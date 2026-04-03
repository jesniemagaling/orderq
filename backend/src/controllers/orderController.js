import { db } from '../config/db.js';
import {
  notifyNewOrder,
  notifyTableStatus,
  notifyMenuUpdate,
  notifyOrderCancelled,
  notifyOrderEstimateUpdated,
} from '../../index.js';

const ACTIVE_KITCHEN_STATUSES = ['pending', 'unserved', 'in_progress'];

const toSafeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getDynamicWaitingMinutes = async (connection) => {
  const baseWaiting = toSafeNumber(process.env.DEFAULT_WAITING_MINUTES, 15);
  const extraPerActiveOrder = toSafeNumber(
    process.env.EXTRA_WAITING_PER_ACTIVE_ORDER,
    2,
  );
  const extraPerActiveItem = toSafeNumber(
    process.env.EXTRA_WAITING_PER_ACTIVE_ITEM,
    0.25,
  );
  const maxWaiting = toSafeNumber(process.env.MAX_WAITING_MINUTES, 120);

  const [loadRows] = await connection.query(
    `SELECT
      COUNT(DISTINCT o.id) AS active_orders,
      COALESCE(SUM(oi.quantity), 0) AS active_items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status IN (?)`,
    [ACTIVE_KITCHEN_STATUSES],
  );

  const activeOrders = Number(loadRows[0]?.active_orders || 0);
  const activeItems = Number(loadRows[0]?.active_items || 0);

  const computed =
    baseWaiting +
    activeOrders * extraPerActiveOrder +
    activeItems * extraPerActiveItem;

  return Math.max(1, Math.min(Math.ceil(computed), maxWaiting));
};

// Create a new order
export const createOrder = async (req, res) => {
  const {
    table_number,
    session_token,
    items,
    payment_method,
    paypal_order_id,
    payment_reference,
    discount_type = 'none',
    promo_code = null,
  } = req.body;

  if (!table_number || !session_token || !items || items.length === 0) {
    return res.status(400).json({ message: 'Missing order details' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Verify valid session
    const [sessionRows] = await connection.query(
      'SELECT id FROM sessions WHERE token = ? AND is_active = 1 AND expires_at > NOW()',
      [session_token],
    );

    if (sessionRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid or expired session' });
    }

    const session_id = sessionRows[0].id;

    // Get actual table_id from table_number
    const [tableRows] = await connection.query(
      'SELECT id FROM tables WHERE table_number = ?',
      [table_number],
    );

    if (tableRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid table number' });
    }

    const table_id = tableRows[0].id;

    const validItems = items.filter(
      (item) => Number(item.menu_id) > 0 && Number(item.quantity) > 0,
    );

    if (!validItems.length) {
      await connection.rollback();
      return res.status(400).json({ message: 'No valid order items provided' });
    }

    // Compute subtotal from DB prices only
    let subtotal_amount = 0;
    const enrichedItems = [];

    for (const item of validItems) {
      const menuId = Number(item.menu_id);
      const quantity = Number(item.quantity);

      const [menuRows] = await connection.query(
        'SELECT id, name, price, stocks FROM menu WHERE id = ? LIMIT 1',
        [menuId],
      );

      if (!menuRows.length) {
        await connection.rollback();
        return res
          .status(400)
          .json({ message: `Invalid menu item: ${menuId}` });
      }

      const menuItem = menuRows[0];
      if (Number(menuItem.stocks) < quantity) {
        await connection.rollback();
        return res.status(400).json({
          message: `${menuItem.name} has insufficient stock. Available: ${menuItem.stocks}`,
        });
      }

      const unitPrice = Number(menuItem.price);
      subtotal_amount += unitPrice * quantity;
      enrichedItems.push({
        menu_id: menuId,
        name: menuItem.name,
        quantity,
        price: unitPrice,
      });
    }

    const normalizedDiscountType = ['pwd', 'senior'].includes(discount_type)
      ? discount_type
      : 'none';
    const baseDiscountRate =
      normalizedDiscountType === 'none'
        ? 0
        : Number(process.env.PWD_SENIOR_DISCOUNT_RATE || 0.2);

    let discount_amount = subtotal_amount * baseDiscountRate;
    let finalPromoCode = null;

    if (promo_code) {
      const normalizedPromoCode = String(promo_code).trim().toUpperCase();
      const [promoRows] = await connection.query(
        `SELECT code, type, value, minimum_order
          FROM promotions
          WHERE code = ?
            AND is_active = 1
            AND (starts_at IS NULL OR starts_at <= NOW())
            AND (ends_at IS NULL OR ends_at >= NOW())
          LIMIT 1`,
        [normalizedPromoCode],
      );

      if (promoRows.length) {
        const promo = promoRows[0];
        if (subtotal_amount >= Number(promo.minimum_order || 0)) {
          const promoDiscount =
            promo.type === 'percent'
              ? subtotal_amount * (Number(promo.value) / 100)
              : Number(promo.value);
          discount_amount += promoDiscount;
          finalPromoCode = normalizedPromoCode;
        }
      }
    }

    discount_amount = Math.min(discount_amount, subtotal_amount);
    const taxableBase = Math.max(subtotal_amount - discount_amount, 0);
    const tax_rate = Number(process.env.TAX_RATE || 0.1);
    const tax_amount = taxableBase * tax_rate;
    const total_amount = taxableBase + tax_amount;
    const waiting_minutes = await getDynamicWaitingMinutes(connection);

    // Insert new order — status = 'pending' by default
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        table_id,
        session_id,
        status,
        payment_method,
        payment_status,
        total_amount,
        subtotal_amount,
        discount_type,
        discount_amount,
        promo_code,
        tax_rate,
        tax_amount,
        waiting_minutes,
        estimated_ready_at
      ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [
        table_id,
        session_id,
        payment_method,
        payment_method === 'cash' ? 'unpaid' : 'paid',
        total_amount,
        subtotal_amount,
        normalizedDiscountType,
        discount_amount,
        finalPromoCode,
        tax_rate,
        tax_amount,
        waiting_minutes,
        waiting_minutes,
      ],
    );

    const orderId = orderResult.insertId;

    // Insert order items and update stocks
    for (const item of enrichedItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, menu_id, quantity, price)
          VALUES (?, ?, ?, ?)`,
        [orderId, item.menu_id, item.quantity, item.price],
      );

      await connection.query(
        `UPDATE menu 
          SET stocks = GREATEST(stocks - ?, 0),
              status = CASE WHEN stocks - ? <= 0 THEN 'out_of_stock' ELSE 'in_stock' END
          WHERE id = ?`,
        [item.quantity, item.quantity, item.menu_id],
      );

      const [updatedMenuItem] = await connection.query(
        'SELECT * FROM menu WHERE id = ?',
        [item.menu_id],
      );

      notifyMenuUpdate({
        type: 'update',
        item: updatedMenuItem[0],
      });
    }

    // Insert into payments table for online payments
    if (payment_method === 'gcash' || payment_method === 'paypal') {
      const paymentRef = paypal_order_id || payment_reference;
      if (!paymentRef) {
        throw new Error('Missing payment reference for online payment');
      }

      await connection.query(
        `INSERT INTO payments (order_id, payment_method, payment_reference, amount, status)
      VALUES (?, ?, ?, ?, ?)`,
        [orderId, payment_method, paymentRef, total_amount, 'paid'],
      );
    } else if (payment_method === 'cash') {
      // For cash, mark payment as unpaid by default
      await connection.query(
        `INSERT INTO payments (order_id, payment_method, amount, status)
          VALUES (?, 'cash', ?, 'unpaid')`,
        [orderId, total_amount],
      );
    }

    await connection.commit();

    // Notify frontend
    notifyNewOrder(table_id, {
      id: orderId,
      table_id,
      table_number,
      total_amount,
      subtotal_amount,
      tax_amount,
      discount_amount,
      discount_type: normalizedDiscountType,
      promo_code: finalPromoCode,
      waiting_minutes,
      items: enrichedItems,
      status: 'pending',
      confirmed: false,
    });

    res.status(201).json({
      message: 'Order created successfully (awaiting confirmation)',
      orderId,
      table_id,
      table_number,
      total_amount,
      subtotal_amount,
      tax_amount,
      discount_amount,
      discount_type: normalizedDiscountType,
      promo_code: finalPromoCode,
      waiting_minutes,
      items: enrichedItems,
    });
  } catch (error) {
    await connection.rollback();

    console.error('Error creating order:', error);
    console.error('SQL Error Message:', error.sqlMessage);
    console.error('Incoming request body:', req.body);

    res.status(500).json({
      message: 'Server error',
      error: error.sqlMessage || error.message,
    });
  } finally {
    connection.release();
  }
};

// Cancel an order
export const cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  console.log('[CancelOrder] orderId:', orderId);

  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [
      orderId,
    ]);

    if (orders.length === 0) {
      console.log('[CancelOrder] Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    if (order.payment_method !== 'cash') {
      console.log(
        '[CancelOrder] Payment method not cash:',
        order.payment_method,
      );
      return res
        .status(400)
        .json({ message: 'Only cash orders can be canceled' });
    }

    if (order.status !== 'pending') {
      console.log('[CancelOrder] Order already confirmed:', order.status);
      return res
        .status(400)
        .json({ message: 'Order cannot be canceled at this stage' });
    }

    await db.query(
      'UPDATE orders SET status = ?, payment_status = ?, waiting_minutes = 0, estimated_ready_at = NULL WHERE id = ?',
      ['canceled', 'canceled', orderId],
    );
    console.log('[CancelOrder] Order canceled successfully');

    // Notify frontend via WebSocket
    notifyOrderCancelled({
      orderId: order.id,
      tableId: order.table_id,
      payment_status: 'canceled',
    });

    res.json({ message: 'Order canceled successfully' });
  } catch (err) {
    console.error('[CancelOrder] Error:', err);
    res.status(500).json({ message: err.message });
  }
};

// retract orders
export const retractOrder = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  // You may already have auth middleware
  const userId = req.user?.id || null;

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Update order
    const [result] = await conn.query(
      `
      UPDATE orders
      SET payment_status = 'retracted',
          waiting_minutes = 0,
          estimated_ready_at = NULL,
          retract_reason = ?,
          retracted_at = NOW()
      WHERE id = ?
        AND payment_status = 'unpaid'
      `,
      [reason, id],
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Order cannot be retracted' });
    }

    // Insert log
    await conn.query(
      `
      INSERT INTO order_logs (order_id, action, payload, user_id)
      VALUES (?, 'retracted', ?, ?)
      `,
      [id, JSON.stringify({ reason }), userId],
    );

    await conn.commit();

    res.json({ message: 'Order retracted successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Retract order error:', err);
    res.status(500).json({ message: 'Failed to retract order' });
  } finally {
    conn.release();
  }
};
export const getOrderAudit = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        ol.id,
        ol.order_id,
        ol.action,
        ol.payload,
        ol.created_at,
        u.username
      FROM order_logs ol
      LEFT JOIN users u ON u.id = ol.user_id
      ORDER BY ol.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error('Order audit error:', err);
    res.status(500).json({ message: 'Failed to fetch order audit' });
  }
};

// Get all orders with their items
export const getAllOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || null;
    const sort = req.query.sort === 'asc' ? 'ASC' : 'DESC';

    const limitClause = limit ? `LIMIT ${limit}` : '';

    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.table_id,
        o.status,
        o.total_amount,
        o.subtotal_amount,
        o.discount_type,
        o.discount_amount,
        o.promo_code,
        o.tax_rate,
        o.tax_amount,
        o.waiting_minutes,
        o.estimated_ready_at,
        o.payment_method,
        o.payment_status,
        o.created_at,
        COALESCE(t.table_number, CONCAT('T', o.table_id)) AS table_number
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      ORDER BY o.created_at ${sort}
      ${limitClause}
    `);

    if (orders.length === 0) return res.status(200).json([]);

    const [items] = await db.query(`
      SELECT 
        oi.order_id,
        m.id AS menu_id,
        m.name AS name,
        oi.quantity,
        oi.price
      FROM order_items oi
      JOIN menu m ON oi.menu_id = m.id
    `);

    const formattedOrders = orders.map((order) => ({
      ...order,
      items: items
        .filter((item) => item.order_id === order.id)
        .map((item) => ({
          id: item.menu_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
    }));

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get specific order with items
export const getOrderDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const [orderRows] = await db.query(
      `SELECT 
          id, session_id, table_id, status, payment_method, payment_status,
          total_amount, subtotal_amount, discount_type, discount_amount,
          promo_code, tax_rate, tax_amount, waiting_minutes, estimated_ready_at,
          retract_reason, retracted_at, created_at
        FROM orders
        WHERE id = ?`,
      [id],
    );

    if (orderRows.length === 0)
      return res.status(404).json({ message: 'Order not found' });

    const order = orderRows[0];

    const [items] = await db.query(
      `SELECT 
          oi.menu_id,
          m.name AS menu_name,
          oi.quantity,
          oi.price,
          m.image_url
        FROM order_items oi
        JOIN menu m ON oi.menu_id = m.id
        WHERE oi.order_id = ?`,
      [id],
    );

    res.status(200).json({
      ...order,
      items: items.map((i) => ({
        id: i.menu_id,
        name: i.menu_name,
        quantity: i.quantity,
        price: i.price,
        image_url: i.image_url,
      })),
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all orders for a session
export const getOrdersBySession = async (req, res) => {
  const { token } = req.query;

  if (!token)
    return res.status(400).json({ message: 'Session token is required' });

  try {
    const [session] = await db.query(
      'SELECT id, table_id FROM sessions WHERE token = ? AND is_active = 1 AND expires_at > NOW()',
      [token],
    );

    if (session.length === 0)
      return res.status(404).json({ message: 'Invalid or expired session' });

    const session_id = session[0].id;

    const [orders] = await db.query(
      `SELECT 
      o.id, o.status, o.payment_status, o.payment_method,
      o.total_amount, o.subtotal_amount, o.discount_type, o.discount_amount,
      o.promo_code, o.tax_rate, o.tax_amount, o.waiting_minutes,
      o.estimated_ready_at, o.created_at,
      COALESCE(t.table_number, CONCAT('T', o.table_id)) AS table_number
        FROM orders o
        LEFT JOIN tables t ON o.table_id = t.id
        WHERE o.session_id = ?
        ORDER BY o.created_at DESC`,
      [session_id],
    );

    const [items] = await db.query(`
      SELECT 
        oi.order_id, m.name AS name, oi.quantity, oi.price
      FROM order_items oi
      JOIN menu m ON oi.menu_id = m.id
    `);

    const result = orders.map((o) => ({
      ...o,
      items: items
        .filter((i) => i.order_id === o.id)
        .map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching orders by session:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark order as paid
export const markOrderAsPaid = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      `UPDATE orders 
        SET payment_status = 'paid'
        WHERE id = ?`,
      [id],
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Order not found' });

    await db.query(
      `UPDATE payments
        SET status = 'paid'
        WHERE order_id = ?`,
      [id],
    );

    res.status(200).json({ message: 'Order marked as paid' });
  } catch (error) {
    console.error('Error marking order as paid:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Confirm an order
export const confirmOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const [orders] = await db.query(
      'SELECT table_id FROM orders WHERE id = ? LIMIT 1',
      [id],
    );

    if (orders.length === 0)
      return res.status(404).json({ message: 'Order not found' });

    const tableId = orders[0].table_id;

    await db.query(
      `UPDATE orders SET status = 'unserved' WHERE id = ? AND status = 'pending'`,
      [id],
    );

    await db.query(
      `UPDATE tables 
    SET status = 'in_progress'
    WHERE id = ?`,
      [tableId],
    );

    notifyTableStatus(tableId, 'in_progress');
    notifyNewOrder(tableId, { tableId, orderId: id, confirmed: true });

    res.status(200).json({
      message: `Order #${id} confirmed successfully.`,
      table_id: tableId,
      order_id: id,
    });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark order as served (kitchen action)
export const markOrderAsServed = async (req, res) => {
  const { id } = req.params;

  try {
    // Get the order and related table_id
    const [orders] = await db.query(
      'SELECT table_id FROM orders WHERE id = ? LIMIT 1',
      [id],
    );

    if (orders.length === 0)
      return res.status(404).json({ message: 'Order not found' });

    const tableId = orders[0].table_id;

    // Mark all unserved orders for that table as served
    await db.query(
      `UPDATE orders
          SET status = 'served',
              waiting_minutes = 0,
              estimated_ready_at = NULL
        WHERE table_id = ? AND status = 'unserved'`,
      [tableId],
    );

    // Check if any unserved or served orders still exist for the table
    const [activeOrders] = await db.query(
      `SELECT 
          SUM(CASE WHEN status = 'unserved' THEN 1 ELSE 0 END) AS unserved_count,
          SUM(CASE WHEN status = 'served' THEN 1 ELSE 0 END) AS served_count
        FROM orders 
        WHERE table_id = ?`,
      [tableId],
    );

    const hasUnserved = activeOrders[0].unserved_count > 0;
    const hasServed = activeOrders[0].served_count > 0;

    let newStatus = 'available';

    if (hasUnserved) newStatus = 'unserved';
    else if (hasServed) newStatus = 'served';

    // Update table status
    await db.query('UPDATE tables SET status = ? WHERE id = ?', [
      newStatus,
      tableId,
    ]);

    // Notify all dashboards via WebSocket
    notifyTableStatus(tableId, newStatus);

    res.status(200).json({
      message: `Orders for Table #${tableId} marked as served.`,
      table_id: tableId,
      new_status: newStatus,
    });
  } catch (error) {
    console.error('Error marking order as served:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrdersRange = async (req, res) => {
  try {
    let { start, end, limit, sort } = req.query;
    if (!start || !end) {
      const [rows] = await db.query(
        `SELECT o.id, o.table_id, o.total_amount, o.status, o.payment_status, o.payment_method, o.created_at, COALESCE(t.table_number, CONCAT('T', o.table_id)) AS table_number FROM orders o LEFT JOIN tables t ON o.table_id = t.id ORDER BY o.created_at ${
          sort === 'asc' ? 'ASC' : 'DESC'
        } ${limit ? 'LIMIT ' + Number(limit) : ''}`,
      );
      return res.json(rows);
    }

    const { normalizeDateRange } = await import('../utils/dateRange.js');
    const [s, e] = normalizeDateRange(start, end);

    const [rows] = await db.query(
      `SELECT o.id, o.table_id, o.total_amount, o.status, o.payment_status, o.payment_method, o.created_at, COALESCE(t.table_number, CONCAT('T', o.table_id)) AS table_number FROM orders o LEFT JOIN tables t ON o.table_id = t.id WHERE o.created_at BETWEEN ? AND ? ORDER BY o.created_at DESC`,
      [s, e],
    );

    res.json(rows);
  } catch (err) {
    console.error('getOrdersRange error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Extend/override estimated waiting time (kitchen action)
export const updateOrderEstimate = async (req, res) => {
  const { id } = req.params;
  const { add_minutes } = req.body;

  const minutesToAdd = Number(add_minutes);
  if (!Number.isFinite(minutesToAdd) || minutesToAdd <= 0) {
    return res.status(400).json({ message: 'add_minutes must be > 0' });
  }

  const roundedMinutes = Math.min(Math.ceil(minutesToAdd), 180);

  try {
    const [orders] = await db.query(
      `SELECT id, status, waiting_minutes
        FROM orders
        WHERE id = ?
        LIMIT 1`,
      [id],
    );

    if (!orders.length) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];
    if (!ACTIVE_KITCHEN_STATUSES.includes(order.status)) {
      return res.status(400).json({
        message: 'Only active kitchen orders can have their estimate updated',
      });
    }

    const nextWaiting = Number(order.waiting_minutes || 0) + roundedMinutes;

    await db.query(
      `UPDATE orders
        SET waiting_minutes = ?,
            estimated_ready_at = DATE_ADD(NOW(), INTERVAL ? MINUTE)
        WHERE id = ?`,
      [nextWaiting, nextWaiting, id],
    );

    const [updatedRows] = await db.query(
      `SELECT id, table_id, status, waiting_minutes, estimated_ready_at
        FROM orders
        WHERE id = ?
        LIMIT 1`,
      [id],
    );

    if (updatedRows.length) {
      notifyOrderEstimateUpdated(updatedRows[0]);
    }

    res.status(200).json({
      message: 'Estimated waiting time updated',
      order_id: Number(id),
      waiting_minutes: nextWaiting,
      added_minutes: roundedMinutes,
    });
  } catch (error) {
    console.error('Error updating order estimate:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
