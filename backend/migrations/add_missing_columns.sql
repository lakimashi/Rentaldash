-- Migration script to add missing columns to existing tables
-- Run this after schema.sqlite.sql if tables already exist

-- Add columns to cars table if they don't exist
ALTER TABLE cars ADD COLUMN current_mileage INTEGER DEFAULT 0;
ALTER TABLE cars ADD COLUMN last_service_mileage INTEGER DEFAULT 0;
ALTER TABLE cars ADD COLUMN registration_expiry TEXT;
ALTER TABLE cars ADD COLUMN insurance_expiry TEXT;

-- Add columns to bookings table if they don't exist
ALTER TABLE bookings ADD COLUMN customer_id INTEGER REFERENCES customers(id);
ALTER TABLE bookings ADD COLUMN start_mileage INTEGER;
ALTER TABLE bookings ADD COLUMN end_mileage INTEGER;
ALTER TABLE bookings ADD COLUMN miles_driven INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN actual_return_date TEXT;
ALTER TABLE bookings ADD COLUMN late_fee_amount REAL DEFAULT 0;
