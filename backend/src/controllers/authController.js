import { db } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!db || typeof db.query !== 'function') {
      console.error('Database pool is not ready');
      return res.status(503).json({ message: 'Database unavailable' });
    }

    // Check if user exists (supports older schemas that may not have `email` column)
    let users = [];
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      users = rows;
    } catch (queryError) {
      if (queryError?.code === 'ER_BAD_FIELD_ERROR') {
        // Fallback for legacy DB schema: login value may be stored as username
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [email]);
        users = rows;
      } else {
        throw queryError;
      }
    }

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Support both bcrypt-hashed and legacy plaintext passwords
    const storedPassword = user.password || '';
    const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);

    let isMatch = false;
    if (isBcryptHash) {
      isMatch = await bcrypt.compare(password, storedPassword);
    } else {
      isMatch = password === storedPassword;

      // One-time migration: upgrade plaintext password to bcrypt hash
      if (isMatch) {
        const newHash = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [
          newHash,
          user.id,
        ]);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res
        .status(500)
        .json({ message: 'Server misconfiguration. Please contact admin.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
