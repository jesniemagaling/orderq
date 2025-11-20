import { db } from '../config/db.js';
import crypto from 'crypto';
import { notifyTableStatus, notifySessionUpdate } from '../../index.js';

export const getOrCreateSession = async (table_number) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [tables] = await connection.query(
      'SELECT * FROM tables WHERE table_number = ?',
      [table_number]
    );

    if (tables.length === 0) {
      await connection.rollback();
      throw new Error('Table not found');
    }

    const table = tables[0];

    // Check for active session
    const [activeSession] = await connection.query(
      'SELECT * FROM sessions WHERE table_id = ? AND is_active = 1 AND expires_at > NOW() LIMIT 1',
      [table.id]
    );

    if (activeSession.length > 0) {
      await connection.commit();
      return { reused: true, ...activeSession[0], table };
    }

    // Create new session
    const token = crypto.randomBytes(24).toString('hex');

    await connection.query(
      'INSERT INTO sessions (table_id, token, created_at, expires_at, is_active) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 1)',
      [table.id, token]
    );

    if (table.status === 'available') {
      await connection.query('UPDATE tables SET status = ? WHERE id = ?', [
        'occupied',
        table.id,
      ]);
      notifyTableStatus(table.id, 'occupied');
    }

    await connection.commit();

    notifySessionUpdate({
      table_id: table.id,
      table_number: table.table_number,
      token,
      status: 'created',
    });

    return {
      reused: false,
      token,
      table,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
