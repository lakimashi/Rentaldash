-- Phase 1: Customer Database
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  phone TEXT,
  name TEXT,
  address TEXT,
  id_number TEXT,
  license_expiry TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Add customer_id to bookings
ALTER TABLE bookings ADD COLUMN customer_id INTEGER REFERENCES customers(id);

-- Phase 2: Mileage Tracking
-- Add mileage fields to cars
ALTER TABLE cars ADD COLUMN current_mileage INTEGER DEFAULT 0;
ALTER TABLE cars ADD COLUMN last_service_mileage INTEGER DEFAULT 0;

-- Add mileage tracking to bookings
ALTER TABLE bookings ADD COLUMN start_mileage INTEGER;
ALTER TABLE bookings ADD COLUMN end_mileage INTEGER;
ALTER TABLE bookings ADD COLUMN miles_driven INTEGER;

-- Phase 3: Vehicle Documents Storage
CREATE TABLE IF NOT EXISTS vehicle_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL REFERENCES cars(id),
  document_type TEXT NOT NULL CHECK(document_type IN ('registration','insurance','inspection','other')),
  title TEXT NOT NULL,
  expiry_date TEXT,
  url_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vehicle_docs_car_type ON vehicle_documents(car_id, document_type);

-- Phase 4: Expenses and Profit
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER REFERENCES cars(id),
  category TEXT NOT NULL CHECK(category IN ('maintenance','insurance','registration','cleaning','misc','fuel')),
  amount REAL NOT NULL,
  description TEXT,
  expense_date TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_car_date ON expenses(car_id, expense_date DESC);

-- Phase 5: Late Fee Rules
CREATE TABLE IF NOT EXISTS late_fee_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hours_from INTEGER NOT NULL,
  hours_to INTEGER,
  fee_amount REAL NOT NULL,
  fee_type TEXT DEFAULT 'flat' CHECK(fee_type IN ('flat', 'percentage')),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Add late fee columns to bookings
ALTER TABLE bookings ADD COLUMN late_fee_amount REAL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN actual_return_date TEXT;

-- Phase 6: Return Condition Checklist
CREATE TABLE IF NOT EXISTS return_checklists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  fuel_level TEXT NOT NULL,
  exterior_condition TEXT,
  interior_condition TEXT,
  tire_condition TEXT,
  damage_notes TEXT,
  damage_photos TEXT,
  returned_by INTEGER REFERENCES users(id),
  returned_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Phase 7: Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('overdue','expiring','system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Phase 8: Registration and Insurance Expiry on Cars
ALTER TABLE cars ADD COLUMN registration_expiry TEXT;
ALTER TABLE cars ADD COLUMN insurance_expiry TEXT;
