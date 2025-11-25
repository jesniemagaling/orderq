// src/helpers/sessionHelper.js
import { db } from '../config/db.js';
import crypto from 'crypto';
import { notifyTableStatus, notifySessionUpdate } from '../../index.js';

export const createOrReuseSession = async (table_number) => {
  if (!table_number) throw new Error('table_number is required');

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

    const [activeSession] = await connection.query(
      `SELECT * FROM sessions 
       WHERE table_id = ? AND is_active = 1 AND expires_at > NOW() LIMIT 1`,
      [table.id]
    );

    if (activeSession.length > 0) {
      await connection.commit();

      notifySessionUpdate({
        table_id: table.id,
        table_number: table.table_number,
        status: 'active',
        reused: true,
      });

      return activeSession[0];
    }

    const token = crypto.randomBytes(24).toString('hex');

    await connection.query(
      `INSERT INTO sessions (table_id, token, created_at, expires_at, is_active)
       VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 1)`,
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

    return { table_id: table.id, table_number: table.table_number, token };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
