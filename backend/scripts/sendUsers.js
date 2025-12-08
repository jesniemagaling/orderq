import bcrypt from 'bcrypt';
import { db } from '../src/config/db.js';

const defaultUsers = [
  { username: 'admin', role: 'admin', password: 'admin123' },
  { username: 'kitchen1', role: 'kitchen', password: 'kitchen123' },
  { username: 'cashier1', role: 'cashier', password: 'cashier123' },
];

async function waitForDb() {
  let connected = false;
  while (!connected) {
    try {
      await db.query('SELECT 1');
      connected = true;
    } catch (err) {
      console.log('Waiting for MySQL to be ready...');
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
}

export const seedUsers = async () => {
  await waitForDb();

  for (const user of defaultUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await db.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password = VALUES(password)',
      [user.username, hashedPassword, user.role]
    );

    console.log(`User ${user.username} seeded with hashed password.`);
  }

  console.log('All default users seeded.');
  process.exit(0);
};

seedUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
