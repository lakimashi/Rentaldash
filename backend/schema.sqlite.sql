-- Rental Dashboard SQLite Schema
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('admin','staff','readonly')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plate_number TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  class TEXT NOT NULL,
  branch_id INTEGER REFERENCES branches(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','maintenance','inactive')),
  base_daily_rate REAL NOT NULL DEFAULT 0,
  vin TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cars_status_class_branch ON cars(status, class, branch_id);

CREATE TABLE IF NOT EXISTS car_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  url_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL REFERENCES cars(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_id_passport TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reserved','confirmed','active','completed','cancelled')),
  total_price REAL NOT NULL DEFAULT 0,
  deposit REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_car_dates_status ON bookings(car_id, start_date, end_date, status);

CREATE TABLE IF NOT EXISTS booking_extras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  extra_name TEXT NOT NULL,
  extra_price REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS maintenance_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL REFERENCES cars(id),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_maintenance_car_dates ON maintenance_blocks(car_id, start_date, end_date);

CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL REFERENCES cars(id),
  booking_id INTEGER REFERENCES bookings(id),
  incident_date TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('minor','major')),
  description TEXT,
  estimated_cost REAL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','under_review','resolved')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incident_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  url_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1) DEFAULT 1,
  agency_name TEXT DEFAULT 'Rental Agency',
  currency TEXT DEFAULT 'USD',
  vat_percent REAL DEFAULT 0,
  logo_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
