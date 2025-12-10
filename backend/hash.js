import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const users = [
  { username: 'admin', password: 'admin123' },
  { username: 'cashier', password: 'cashier123' },
  { username: 'kitchen', password: 'kitchen123' },
];

const updatePasswords = async () => {
  try {
    // Connect to MySQL
    const connection = await mysql.createConnection({
      host: 'mysql',
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    for (const user of users) {
      // Hash the password
      const hash = await bcrypt.hash(user.password, 10);

      // Update the user's password in DB
      const [result] = await connection.execute(
        'UPDATE users SET password = ? WHERE username = ?',
        [hash, user.username]
      );

      console.log(
        `Password updated for ${user.username}. Rows affected: ${result.affectedRows}`
      );
    }

    await connection.end();
    console.log('All passwords updated successfully.');
  } catch (err) {
    console.error('Error updating passwords:', err);
  }
};

updatePasswords();
