-- Rental Dashboard PostgreSQL Schema (idempotent)
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'staff', 'readonly'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE car_status AS ENUM ('active', 'maintenance', 'inactive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('draft', 'reserved', 'confirmed', 'active', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE incident_severity AS ENUM ('minor', 'major'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE incident_status AS ENUM ('open', 'under_review', 'resolved'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  plate_number VARCHAR(50) UNIQUE NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  class VARCHAR(50) NOT NULL,
  branch_id INTEGER REFERENCES branches(id),
  status car_status NOT NULL DEFAULT 'active',
  base_daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  vin VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cars_status_class_branch ON cars(status, class, branch_id);

CREATE TABLE IF NOT EXISTS car_images (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  url_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_id_passport VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status booking_status NOT NULL DEFAULT 'draft',
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_car_dates_status ON bookings(car_id, start_date, end_date, status);

CREATE TABLE IF NOT EXISTS booking_extras (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  extra_name VARCHAR(100) NOT NULL,
  extra_price DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS maintenance_blocks (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_car_dates ON maintenance_blocks(car_id, start_date, end_date);

CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id),
  booking_id INTEGER REFERENCES bookings(id),
  incident_date TIMESTAMPTZ NOT NULL,
  severity incident_severity NOT NULL,
  description TEXT,
  estimated_cost DECIMAL(10,2),
  status incident_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_images (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  url_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  agency_name VARCHAR(255) DEFAULT 'Rental Agency',
  currency VARCHAR(10) DEFAULT 'USD',
  vat_percent DECIMAL(5,2) DEFAULT 0,
  logo_path VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
