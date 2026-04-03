import { db } from '../config/db.js';

export const createFeedback = async (req, res) => {
  try {
    const { session_token, order_id, rating, comment } = req.body;
    const parsedRating = Number(rating);

    if (
      !Number.isInteger(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return res
        .status(400)
        .json({ message: 'Rating must be an integer from 1 to 5' });
    }

    let sessionId = null;
    let tableId = null;

    if (session_token) {
      const [sessions] = await db.query(
        'SELECT id, table_id FROM sessions WHERE token = ? LIMIT 1',
        [session_token],
      );
      if (sessions.length) {
        sessionId = sessions[0].id;
        tableId = sessions[0].table_id;
      }
    }

    if (order_id) {
      const [orders] = await db.query(
        'SELECT table_id FROM orders WHERE id = ? LIMIT 1',
        [order_id],
      );
      if (orders.length) {
        tableId = orders[0].table_id;
      }
    }

    await db.query(
      `INSERT INTO feedback (session_id, order_id, table_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [
        sessionId,
        order_id || null,
        tableId,
        parsedRating,
        String(comment || '').trim() || null,
      ],
    );

    res.status(201).json({ message: 'Feedback submitted. Thank you!' });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

export const getFeedback = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, session_id, order_id, table_id, rating, comment, created_at
       FROM feedback
       ORDER BY created_at DESC
       LIMIT 200`,
    );

    res.json(rows);
  } catch (error) {
    console.error('Fetch feedback error:', error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
};
