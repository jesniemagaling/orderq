import { db } from './db.js';

const getDatabaseName = () => process.env.DB_NAME || 'orderq_db';

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [getDatabaseName(), tableName, columnName],
  );

  return rows.length > 0;
}

async function addColumnIfMissing(tableName, columnName, columnDefinition) {
  const exists = await columnExists(tableName, columnName);
  if (exists) return;

  await db.query(
    `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`,
  );
}

export async function applyMigrations() {
  try {
    // Orders extensions
    await addColumnIfMissing(
      'orders',
      'subtotal_amount',
      'DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER total_amount',
    );
    await addColumnIfMissing(
      'orders',
      'discount_type',
      "ENUM('none','pwd','senior','promo') DEFAULT 'none' AFTER subtotal_amount",
    );
    await addColumnIfMissing(
      'orders',
      'discount_amount',
      'DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER discount_type',
    );
    await addColumnIfMissing(
      'orders',
      'promo_code',
      'VARCHAR(64) NULL AFTER discount_amount',
    );
    await addColumnIfMissing(
      'orders',
      'tax_rate',
      'DECIMAL(5,4) NOT NULL DEFAULT 0.1000 AFTER promo_code',
    );
    await addColumnIfMissing(
      'orders',
      'tax_amount',
      'DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER tax_rate',
    );
    await addColumnIfMissing(
      'orders',
      'waiting_minutes',
      'INT NOT NULL DEFAULT 15 AFTER tax_amount',
    );
    await addColumnIfMissing(
      'orders',
      'estimated_ready_at',
      'TIMESTAMP NULL AFTER waiting_minutes',
    );

    // Tables extensions
    await addColumnIfMissing(
      'tables',
      'qr_nonce',
      'VARCHAR(64) NULL AFTER qr_code',
    );

    await db.query(`
      UPDATE tables
      SET qr_nonce = REPLACE(UUID(), '-', '')
      WHERE qr_nonce IS NULL OR qr_nonce = ''
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INT NOT NULL AUTO_INCREMENT,
        code VARCHAR(64) NOT NULL UNIQUE,
        title VARCHAR(100) NOT NULL,
        type ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
        value DECIMAL(10,2) NOT NULL,
        minimum_order DECIMAL(10,2) NOT NULL DEFAULT 0,
        starts_at TIMESTAMP NULL,
        ends_at TIMESTAMP NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_promotions_active (is_active),
        INDEX idx_promotions_window (starts_at, ends_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT NOT NULL AUTO_INCREMENT,
        session_id INT NULL,
        order_id INT NULL,
        table_id INT NULL,
        rating TINYINT NOT NULL,
        comment TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_feedback_order (order_id),
        INDEX idx_feedback_table (table_id),
        CONSTRAINT fk_feedback_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
        CONSTRAINT fk_feedback_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        CONSTRAINT fk_feedback_table FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(
      `INSERT IGNORE INTO promotions (code, title, type, value, minimum_order, is_active)
       VALUES
       ('FRIESFREE', 'Free Fries Promo', 'fixed', 30.00, 229.00, 1),
       ('PIZZASLICE', 'Free Pizza Slice Promo', 'fixed', 40.00, 129.00, 1)`,
    );

    console.log('Database migrations checked/applied successfully.');
  } catch (error) {
    console.error('Migration error:', error.message);
  }
}
