import { db } from '../config/db.js';
import crypto from 'crypto';
import { notifyTableStatus, notifySessionUpdate } from '../../index.js';

// Create or reuse active session
export const createSession = async (req, res) => {
  const { table_number } = req.body;

  if (!table_number) {
    return res.status(400).json({ message: 'table_number is required' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [tables] = await connection.query(
      'SELECT * FROM tables WHERE table_number = ?',
      [table_number]
    );

    if (tables.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Table not found' });
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

      const result = {
        message: 'Session already active',
        table_id: table.id,
        table_number: table.table_number,
        token: activeSession[0].token,
        expires_at: activeSession[0].expires_at,
      };

      if (typeof res.json === 'function') {
        return res.status(200).json(result);
      }

      return result;
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

    const result = {
      message: 'New session created',
      table_id: table.id,
      table_number: table.table_number,
      token,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    if (typeof res.json === 'function') {
      return res.status(201).json(result);
    }

    return result;
  } catch (error) {
    await connection.rollback();
    console.error('Error creating session:', error);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// Verify session token
export const verifySession = async (req, res) => {
  const { token } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT s.*, t.table_number, t.status
        FROM sessions s
        JOIN tables t ON s.table_id = t.id
        WHERE s.token = ? AND s.is_active = 1 AND s.expires_at > NOW()
        LIMIT 1`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Invalid or expired session' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error verifying session:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// End an active session
export const endSession = async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: 'Session token is required' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [sessions] = await connection.query(
      `SELECT s.id, s.table_id, t.status 
        FROM sessions s
        JOIN tables t ON s.table_id = t.id
        WHERE s.token = ? AND s.is_active = 1
        LIMIT 1`,
      [token]
    );

    if (sessions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Active session not found' });
    }

    const session = sessions[0];

    // End the session immediately
    await connection.query(
      `UPDATE sessions 
        SET is_active = 0, expires_at = NOW()
        WHERE id = ?`,
      [session.id]
    );

    // Mark table back to available
    await connection.query(
      `UPDATE tables 
        SET status = 'available'
        WHERE id = ?`,
      [session.table_id]
    );

    // Notify cashier dashboard about table status change
    notifyTableStatus(session.table_id, 'available');

    await connection.commit();

    // Notify customer app that their session ended
    notifySessionUpdate({
      table_id: session.table_id,
      token,
      status: 'expired',
      manually_ended: true,
    });

    return res.status(200).json({
      message: `Session for Table #${session.table_id} has been ended.`,
      table_id: session.table_id,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error ending session:', error);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// QR scanning
export const scanSessionFromQR = async (req, res) => {
  const { table_number } = req.params;

  console.log('QR Scan Request → table_number =', table_number);

  try {
    const sessionData = await createSession(
      { body: { table_number } },
      {} // empty response forces return of object
    );

    console.log('sessionData returned from createSession:', sessionData);

    if (!sessionData) {
      console.error('sessionData is NULL/undefined');
      return res.status(500).send('sessionData empty');
    }

    if (!sessionData.token) {
      console.error('sessionData.token is missing:', sessionData);
      return res.status(500).send('Token missing');
    }

    console.log('FRONTEND_URL =', process.env.FRONTEND_URL);

    const FE = process.env.FRONTEND_URL?.replace(/\/$/, '');

    if (!FE) {
      console.error('FRONTEND_URL is missing');
      return res.status(500).send('Frontend URL not configured');
    }

    console.log('FE cleaned =', FE);

    const redirectUrl = `${FE}/order?table=${table_number}&token=${sessionData.token}`;

    console.log('Redirecting to:', redirectUrl);

    // Redirect to customer app
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('QR Scan Error:', err);
    return res.status(500).send('Server error');
  }
};
