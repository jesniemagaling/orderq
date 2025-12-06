import { db } from '../config/db.js';
import { notifyMenuUpdate } from '../../index.js';
import fs from 'fs';
import path from 'path';
import { io } from '../../index.js';

// Helper to delete old image file
const deleteOldImage = (imagePath) => {
  if (!imagePath) return;

  const filePath = path.join(process.cwd(), imagePath);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete old image:', err);
    });
  }
};

// GET ALL MENU ITEMS
export const getMenu = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu ORDER BY id DESC');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET SINGLE MENU ITEM
export const getMenuById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM menu WHERE id = ?', [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'Menu item not found' });

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MENU CATEGORIES
export const getMenuCategories = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT category 
      FROM menu 
      WHERE category IS NOT NULL AND category != ''
    `);

    const categories = [
      { id: 'all', name: 'All', icon: '/images/all.png' },
      ...rows.map((row) => {
        const id = row.category.toLowerCase().replace(/\s+/g, '-');
        return {
          id,
          name: row.category,
          icon: `/images/${id}.png`,
        };
      }),
    ];

    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADD NEW MENU ITEM
export const addMenuItem = async (req, res) => {
  try {
    let { name, description, price, category, stocks } = req.body;
    const file = req.file;

    if (!name || !price)
      return res.status(400).json({ message: 'Name and price are required' });

    price = Number(price);
    stocks = Number(stocks);

    if (isNaN(price) || isNaN(stocks))
      return res
        .status(400)
        .json({ message: 'Price and stocks must be numeric' });

    const image_url = file ? `/uploads/menu/${file.filename}` : null;
    const status = stocks > 0 ? 'in_stock' : 'out_of_stock';

    const [result] = await db.query(
      `INSERT INTO menu (name, description, price, category, stocks, status, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        description || '',
        price,
        category || 'Uncategorized',
        stocks,
        status,
        image_url,
      ]
    );

    const newItemId = result.insertId;

    await logMenuHistory(
      result.insertId,
      'add',
      null,
      {
        name,
        price,
        description,
        category,
        stocks,
        status,
        image_url,
      },
      req.app.get('io')
    );

    res.status(201).json({ message: 'Menu item added successfully!' });

    notifyMenuUpdate({
      type: 'add',
      item: { name, description, price, category, stocks, status, image_url },
    });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE MENU ITEM
export const updateMenuItem = async (req, res) => {
  const { id } = req.params;
  let { name, description, price, category, stocks } = req.body;
  const file = req.file;

  try {
    if (!name || !price)
      return res.status(400).json({ message: 'Name and price are required' });

    price = Number(price);
    stocks = Number(stocks);

    if (isNaN(price) || isNaN(stocks))
      return res
        .status(400)
        .json({ message: 'Price and stocks must be numeric' });

    const [existing] = await db.query('SELECT * FROM menu WHERE id = ?', [id]);
    if (existing.length === 0)
      return res.status(404).json({ message: 'Menu item not found' });

    const oldData = existing[0];

    const oldImage = existing[0].image_url;
    let image_url = oldImage;

    if (file) {
      image_url = `/uploads/menu/${file.filename}`;
      deleteOldImage(oldImage);
    }

    const status = stocks > 0 ? 'in_stock' : 'out_of_stock';

    await db.query(
      `UPDATE menu SET name=?, description=?, price=?, category=?, stocks=?, status=?, image_url=? WHERE id=?`,
      [
        name.trim(),
        description || '',
        price,
        category || 'Uncategorized',
        stocks,
        status,
        image_url,
        id,
      ]
    );

    const newData = {
      id,
      name,
      description,
      price,
      category,
      stocks,
      status,
      image_url,
      logged_at: new Date().toISOString(),
    };

    const oldDataWithTimestamp = {
      ...oldData,
      logged_at: oldData?.created_at || null,
    };

    await logMenuHistory(id, 'update', oldDataWithTimestamp, newData);

    res.status(200).json({ message: 'Menu item updated successfully!' });

    notifyMenuUpdate({
      type: 'update',
      item: newData,
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE MENU ITEM
export const deleteMenuItem = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM menu WHERE id = ?', [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'Menu item not found' });

    const oldData = rows[0];

    deleteOldImage(oldData.image_url);

    await db.query('DELETE FROM menu WHERE id = ?', [id]);

    await logMenuHistory(id, 'delete', oldData, null);

    res.status(200).json({ message: 'Menu item deleted successfully!' });

    notifyMenuUpdate({
      type: 'delete',
      item: { id },
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET TOP-SELLING MENU ITEMS
export const getTopSellingItems = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.id,
        m.name,
        IFNULL(SUM(oi.quantity), 0) AS total_sold
      FROM order_items oi
      JOIN menu m ON oi.menu_id = m.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('served', 'completed')
      GROUP BY m.id
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    const formatted = rows.map((r) => ({
      name: r.name,
      sold: Number(r.total_sold || 0),
      delta: Number((Math.random() * 2 - 1).toFixed(2)),
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching top-selling items:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MENU HISTORY
export const getMenuHistory = async (req, res) => {
  try {
    const { action, menu_id, limit = 50, offset = 0 } = req.query;

    let query = `SELECT * FROM menu_history WHERE 1=1`;
    const params = [];

    if (action) {
      query += ` AND action = ?`;
      params.push(action);
    }

    if (menu_id) {
      query += ` AND menu_id = ?`;
      params.push(menu_id);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await db.query(query, params);

    const formatted = rows.map((entry) => ({
      ...entry,
      old_data:
        entry.old_data && typeof entry.old_data === 'string'
          ? JSON.parse(entry.old_data)
          : entry.old_data,
      new_data:
        entry.new_data && typeof entry.new_data === 'string'
          ? JSON.parse(entry.new_data)
          : entry.new_data,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching menu history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// LOG MENU HISTORY
export const logMenuHistory = async (
  menu_id,
  action,
  old_data = null,
  new_data = null,
  user_id = null,
  io = null
) => {
  try {
    const [result] = await db.query(
      `INSERT INTO menu_history (menu_id, action, old_data, new_data, user_id) VALUES (?, ?, ?, ?, ?)`,
      [
        menu_id,
        action,
        old_data ? JSON.stringify(old_data) : null,
        new_data ? JSON.stringify(new_data) : null,
        user_id,
      ]
    );

    const [rows] = await db.query(`SELECT * FROM menu_history WHERE id = ?`, [
      result.insertId,
    ]);
    const entry = rows[0];

    entry.old_data =
      entry.old_data && typeof entry.old_data === 'string'
        ? JSON.parse(entry.old_data)
        : entry.old_data || null;

    entry.new_data =
      entry.new_data && typeof entry.new_data === 'string'
        ? JSON.parse(entry.new_data)
        : entry.new_data || null;

    io?.emit('menuHistoryUpdated', entry);

    return entry;
  } catch (error) {
    console.error('Error logging menu history:', error);
    throw error;
  }
};
