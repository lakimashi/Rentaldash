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
  current_mileage INTEGER DEFAULT 0,
  last_service_mileage INTEGER DEFAULT 0,
  registration_expiry TEXT,
  insurance_expiry TEXT,
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
  customer_id INTEGER REFERENCES customers(id),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reserved','confirmed','active','completed','cancelled')),
  total_price REAL NOT NULL DEFAULT 0,
  deposit REAL NOT NULL DEFAULT 0,
  notes TEXT,
  start_mileage INTEGER,
  end_mileage INTEGER,
  miles_driven INTEGER DEFAULT 0,
  actual_return_date TEXT,
  late_fee_amount REAL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  id_number TEXT,
  license_expiry TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL REFERENCES cars(id),
  category TEXT NOT NULL CHECK(category IN ('maintenance','insurance','registration','cleaning','misc','fuel')),
  amount REAL NOT NULL,
  description TEXT,
  expense_date TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_car_date ON expenses(car_id, expense_date);

CREATE TABLE IF NOT EXISTS vehicle_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK(document_type IN ('registration','insurance','inspection','other')),
  title TEXT NOT NULL,
  expiry_date TEXT,
  url_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vehicle_docs_car ON vehicle_documents(car_id);

CREATE TABLE IF NOT EXISTS late_fee_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hours_from INTEGER NOT NULL,
  hours_to INTEGER,
  fee_amount REAL NOT NULL,
  fee_type TEXT NOT NULL CHECK(fee_type IN ('flat','percentage')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_late_fee_rules_active ON late_fee_rules(is_active);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('overdue','expiring_registration','expiring_insurance','other')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS return_checklists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  fuel_level TEXT NOT NULL CHECK(fuel_level IN ('empty','quarter','half','three_quarter','full')),
  exterior_condition TEXT NOT NULL,
  interior_condition TEXT NOT NULL,
  tire_condition TEXT NOT NULL,
  damage_notes TEXT,
  completed_by INTEGER REFERENCES users(id),
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
