import { db } from '../config/db.js';
import { format } from 'date-fns';
import { debugLog, debugError } from '../utils/logger.js';

export const getDailyIncome = async (req, res) => {
  debugLog('getDailyIncome called', 'Query:', req.query);
  try {
    const { date } = req.query;

    const [rows] = await db.execute(
      `
      SELECT DATE(created_at) AS day,
              SUM(total_amount) AS total_income
      FROM orders
      WHERE payment_status = 'paid'
        AND DATE(created_at) = ?
      GROUP BY DATE(created_at)
      `,
      [date]
    );

    debugLog('getDailyIncome result:', rows);
    res.json(rows);
  } catch (err) {
    debugError('getDailyIncome error:', err);
    res.status(500).json({ message: 'Failed to fetch daily income' });
  }
};

export const getOrdersPerDay = async (req, res) => {
  debugLog('getOrdersPerDay called', 'Query:', req.query);
  try {
    const { start, end } = req.query;

    const [rows] = await db.execute(
      `
      SELECT DATE(created_at) AS day,
              COUNT(*) AS orders_count
      FROM orders
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY day
      `,
      [start, end]
    );

    debugLog('getOrdersPerDay result:', rows);
    res.json(rows);
  } catch (err) {
    debugError('getOrdersPerDay error:', err);
    res.status(500).json({ message: 'Failed to fetch orders per day' });
  }
};

export const getOrdersPerTable = async (req, res) => {
  debugLog('getOrdersPerTable called');
  try {
    const [rows] = await db.execute(
      `
      SELECT t.table_number,
              COUNT(o.id) AS total_orders,
              IFNULL(SUM(o.total_amount), 0) AS total_sales
      FROM tables t
      LEFT JOIN orders o 
        ON t.id = o.table_id AND o.payment_status = 'paid'
      GROUP BY t.id
      ORDER BY t.table_number
      `
    );

    debugLog('getOrdersPerTable result:', rows);
    res.json(rows);
  } catch (err) {
    debugError('getOrdersPerTable error:', err);
    res.status(500).json({ message: 'Failed to fetch orders per table' });
  }
};

export const getItemSales = async (req, res) => {
  debugLog('getItemSales called');
  try {
    const [rows] = await db.execute(
      `
      SELECT m.name,
              SUM(oi.quantity) AS total_sold,
              SUM(oi.subtotal) AS total_revenue
      FROM order_items oi
      JOIN menu m ON m.id = oi.menu_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.payment_status = 'paid'
      GROUP BY oi.menu_id
      ORDER BY total_sold DESC
      `
    );

    debugLog('getItemSales result:', rows);
    res.json(rows);
  } catch (err) {
    debugError('getItemSales error:', err);
    res.status(500).json({ message: 'Failed to fetch item sales' });
  }
};

export const getSalesPerDay = async (req, res) => {
  try {
    const { start, end } = req.query;

    const [rows] = await db.execute(
      `
      SELECT 
        DATE(created_at) AS day,
        SUM(total_amount) AS total_sales,
        COUNT(*) AS total_orders,
        AVG(total_amount) AS average_order
      FROM orders
      WHERE payment_status = 'paid'
        AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
      `,
      [start, end]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch sales per day' });
  }
};

export const getSalesSummary = async (req, res) => {
  try {
    const { start, end } = req.query;

    const [rows] = await db.execute(
      `
      SELECT
        SUM(total_amount) AS gross_sales,
        COUNT(*) AS total_orders,
        SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) AS cash_sales,
        SUM(CASE WHEN payment_method = 'gcash' THEN total_amount ELSE 0 END) AS gcash_sales,
        SUM(CASE WHEN payment_method = 'paypal' THEN total_amount ELSE 0 END) AS paypal_sales,
        SUM(CASE WHEN status = 'canceled' THEN total_amount ELSE 0 END) AS canceled_amount,
        AVG(total_amount) AS avg_order_value
      FROM orders
      WHERE payment_status = 'paid'
        AND DATE(created_at) BETWEEN ? AND ?
      `,
      [start, end]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch sales summary' });
  }
};

export const getPaymentBreakdown = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT payment_method, COUNT(*) AS count,
              SUM(total_amount) AS total
      FROM orders
      WHERE payment_status = 'paid'
      GROUP BY payment_method
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch payment breakdown' });
  }
};

export const getHourlyHeatmap = async (req, res) => {
  try {
    const date = req.query.date || format(new Date(), 'yyyy-MM-dd');

    const [rows] = await db.execute(
      `
      SELECT 
        HOUR(created_at) AS hour,
        COUNT(*) AS orders_count,
        SUM(total_amount) AS total_sales
      FROM orders
      WHERE payment_status = 'paid'
        AND DATE(created_at) = ?
      GROUP BY HOUR(created_at)
      ORDER BY hour
      `,
      [date]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch hourly heatmap' });
  }
};

export const getCategorySales = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT m.category,
              SUM(oi.quantity) AS total_sold,
              SUM(oi.subtotal) AS revenue
      FROM order_items oi
      JOIN menu m ON m.id = oi.menu_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.payment_status = 'paid'
      GROUP BY m.category
      ORDER BY revenue DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch category sales' });
  }
};
