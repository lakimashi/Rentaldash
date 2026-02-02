# Database Schema

PostgreSQL. See [backend/schema.sql](../backend/schema.sql) for the authoritative SQL.

## Tables and relationships

- **users** – id, email (unique), password_hash, role (admin | staff | readonly), created_at
- **branches** – id, name, address, phone
- **cars** – id, plate_number (unique), make, model, year, class, branch_id → branches(id), status (active | maintenance | inactive), base_daily_rate, vin, notes, created_at
- **car_images** – id, car_id → cars(id), url_path, created_at
- **bookings** – id, car_id → cars(id), customer_name, customer_phone, customer_id_passport, start_date, end_date, status (draft | reserved | confirmed | active | completed | cancelled), total_price, deposit, notes, created_at
- **booking_extras** – id, booking_id → bookings(id), extra_name, extra_price
- **maintenance_blocks** – id, car_id → cars(id), start_date, end_date, reason, created_at
- **incidents** – id, car_id → cars(id), booking_id → bookings(id) nullable, incident_date, severity (minor | major), description, estimated_cost, status (open | under_review | resolved), created_at
- **incident_images** – id, incident_id → incidents(id), url_path, created_at
- **settings** – id (single row = 1), agency_name, currency, vat_percent, logo_path, created_at
- **api_keys** – id, name, token_hash, created_at, last_used_at
- **audit_logs** – id, user_id → users(id), action, entity_type, entity_id, metadata_json (JSONB), created_at

## Indexes

- `cars (status, class, branch_id)`
- `bookings (car_id, start_date, end_date, status)`
- `maintenance_blocks (car_id, start_date, end_date)`
- `audit_logs (created_at DESC)`

## Availability rules

A car is considered **available** for a date range `[start, end)` if:

1. No booking for that car with status in `reserved`, `confirmed`, `active` overlaps the range (overlap: `A.start < B.end AND B.start < A.end`).
2. No maintenance block for that car overlaps the range.
3. No **open** incident with **major** severity exists for that car (configurable; default: major blocks availability).

Overlapping bookings for the same car are enforced in the backend (validation on create/update), not by a DB constraint.
