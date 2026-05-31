-- ORDERQ DATABASE INITIAL SETUP

-- Create and select database
CREATE DATABASE IF NOT EXISTS orderq_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE orderq_db;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','cashier','kitchen') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@orderq.com', 'admin123', 'admin'),
('cashier', 'cashier@orderq.com', 'cashier123', 'cashier'),
('kitchen', 'kitchen@orderq.com', 'kitchen123', 'kitchen');

-- TABLES TABLE (RESTAURANT TABLES)
CREATE TABLE IF NOT EXISTS tables (
  id INT NOT NULL AUTO_INCREMENT,
  table_number INT NOT NULL UNIQUE,
  status ENUM('available','occupied','in_progress','served') DEFAULT 'available',
  qr_code VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO tables (table_number, status) VALUES
('1', 'available'),
('2', 'available'),
('3', 'available'),
('4', 'available'),
('5', 'available'),
('6', 'available'),
('7', 'available'),
('8', 'available'),
('9', 'available'),
('10', 'available');

-- SESSIONS TABLE
CREATE TABLE IF NOT EXISTS sessions (
  id INT NOT NULL AUTO_INCREMENT,
  table_id INT NOT NULL,
  token VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 2 HOUR),
  is_active BOOLEAN DEFAULT 1,
  PRIMARY KEY (id),
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MENU TABLE
CREATE TABLE IF NOT EXISTS menu (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50),
  stocks INT DEFAULT 0,
  status ENUM('in_stock','out_of_stock') DEFAULT 'in_stock',
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO menu (name, description, price, category, stocks, status, image_url) VALUES
('Americano', 'A bold and smooth espresso diluted with hot water, giving a rich coffee flavor with a lighter body.', 150.00, 'Iced', 20, 'in_stock', 'https://via.placeholder.com/150'),
('Blueberry', 'A refreshing blueberry-flavored drink that blends sweetness and tang for a delightful fruity taste.', 120.00, 'Fruity', 40, 'in_stock', 'https://via.placeholder.com/150'),
('Caramel Macchiato', 'Espresso combined with milk, vanilla flavor, and caramel drizzle for a sweet, smooth coffee treat.', 180.00, 'Hot', 15, 'in_stock', 'https://via.placeholder.com/150');

-- MENU HISTORY TABLE
CREATE TABLE IF NOT EXISTS menu_history (
  id INT NOT NULL AUTO_INCREMENT,
  menu_id INT,
  action ENUM('add','update','delete') NOT NULL,
  old_data JSON,
  new_data JSON,
  user_id INT NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_menu_id (menu_id),
  INDEX idx_action (action),
  INDEX idx_user_id (user_id),
  INDEX idx_performed_at (performed_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ORDERS TABLE
CREATE TABLE orders (
  id INT NOT NULL AUTO_INCREMENT,
  session_id INT NOT NULL,
  table_id INT NOT NULL,
  status ENUM(
    'pending',
    'unserved',
    'served',
    'canceled',
    'retracted'
  ) DEFAULT 'pending',
  payment_method ENUM(
    'cash',
    'gcash',
    'paypal'
  ) DEFAULT 'cash',
  payment_status ENUM(
    'unpaid',
    'paid',
    'failed',
    'canceled',
    'retracted'
  ) DEFAULT 'unpaid',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  retract_reason TEXT NULL,
  retracted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_orders_session
    FOREIGN KEY (session_id)
    REFERENCES sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_orders_table
    FOREIGN KEY (table_id)
    REFERENCES tables(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id INT NOT NULL AUTO_INCREMENT,
  order_id INT NOT NULL,
  menu_id INT NOT NULL,
  quantity INT DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantity * price) STORED,
  PRIMARY KEY (id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ORDER LOGS TABLE
CREATE TABLE IF NOT EXISTS order_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  action ENUM('created','confirmed','served','retracted','canceled','paid','updated') NOT NULL,
  payload JSON NULL,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PAYMENTS TABLE (for secure online payment tracking)
CREATE TABLE IF NOT EXISTS payments (
    id INT NOT NULL AUTO_INCREMENT,
    order_id INT NOT NULL,
    payment_method ENUM('cash','gcash','paypal') NOT NULL,
    payment_reference VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('paid','unpaid') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- POST-DEPLOY SAFE EXTENSIONS
-- Add missing columns individually (avoids compatibility issues with some MySQL images)
ALTER TABLE orders ADD COLUMN subtotal_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER total_amount;
ALTER TABLE orders ADD COLUMN discount_type ENUM('none','pwd','senior','promo') DEFAULT 'none' AFTER subtotal_amount;
ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER discount_type;
ALTER TABLE orders ADD COLUMN promo_code VARCHAR(64) NULL AFTER discount_amount;
ALTER TABLE orders ADD COLUMN tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1000 AFTER promo_code;
ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER tax_rate;
ALTER TABLE orders ADD COLUMN waiting_minutes INT NOT NULL DEFAULT 15 AFTER tax_amount;
ALTER TABLE orders ADD COLUMN estimated_ready_at TIMESTAMP NULL AFTER waiting_minutes;

ALTER TABLE tables ADD COLUMN qr_nonce VARCHAR(64) NULL AFTER qr_code;

UPDATE tables
SET qr_nonce = REPLACE(UUID(), '-', '')
WHERE qr_nonce IS NULL OR qr_nonce = '';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO promotions (code, title, type, value, minimum_order, is_active) VALUES
('FRIESFREE', 'Free Fries Promo', 'fixed', 30.00, 229.00, 1),
('PIZZASLICE', 'Free Pizza Slice Promo', 'fixed', 40.00, 129.00, 1);

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================================================
-- Demo data for showcase (tables, sessions, orders)
-- ==================================================
-- Create demo sessions for tables 1..5
INSERT INTO sessions (table_id, token, is_active) VALUES
(1, 'demo-token-1', 1),
(2, 'demo-token-2', 1),
(3, 'demo-token-3', 1),
(4, 'demo-token-4', 1),
(5, 'demo-token-5', 1);

-- Insert a few demo orders and order items
SET @s1 = (SELECT id FROM sessions WHERE token = 'demo-token-1');
INSERT INTO orders (session_id, table_id, status, payment_method, payment_status, total_amount)
VALUES (@s1, 1, 'pending', 'cash', 'unpaid', 270.00);
SET @o1 = LAST_INSERT_ID();
INSERT INTO order_items (order_id, menu_id, quantity, price) VALUES
(@o1, 1, 1, 150.00),
(@o1, 2, 1, 120.00);

SET @s2 = (SELECT id FROM sessions WHERE token = 'demo-token-2');
INSERT INTO orders (session_id, table_id, status, payment_method, payment_status, total_amount)
VALUES (@s2, 2, 'unserved', 'gcash', 'paid', 180.00);
SET @o2 = LAST_INSERT_ID();
INSERT INTO order_items (order_id, menu_id, quantity, price) VALUES
(@o2, 3, 1, 180.00);

SET @s3 = (SELECT id FROM sessions WHERE token = 'demo-token-3');
INSERT INTO orders (session_id, table_id, status, payment_method, payment_status, total_amount)
VALUES (@s3, 3, 'served', 'cash', 'paid', 300.00);
SET @o3 = LAST_INSERT_ID();
INSERT INTO order_items (order_id, menu_id, quantity, price) VALUES
(@o3, 1, 2, 150.00);

-- Optional: demo feedback
INSERT INTO feedback (session_id, order_id, table_id, rating, comment)
VALUES
(@s1, @o1, 1, 4, 'Nice coffee'),
(@s3, @o3, 3, 5, 'Great service');

