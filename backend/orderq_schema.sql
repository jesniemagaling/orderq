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
CREATE TABLE IF NOT EXISTS orders (
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
  retracted_by INT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_orders_session
    FOREIGN KEY (session_id)
    REFERENCES sessions(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_orders_table
    FOREIGN KEY (table_id)
    REFERENCES tables(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_orders_retracted_by
    FOREIGN KEY (retracted_by)
    REFERENCES users(id)
    ON DELETE SET NULL

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
