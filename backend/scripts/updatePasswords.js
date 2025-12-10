import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const users = [
  { username: 'admin', password: 'admin123' },
  { username: 'cashier', password: 'cashier123' },
  { username: 'kitchen', password: 'kitchen123' },
];

for (const user of users) {
  const hashedPassword = await bcrypt.hash(user.password, 10);

  await connection.execute('UPDATE users SET password = ? WHERE username = ?', [
    hashedPassword,
    user.username,
  ]);

  console.log(`Password updated for ${user.username}`);
}

await connection.end();
console.log('All passwords updated.');
