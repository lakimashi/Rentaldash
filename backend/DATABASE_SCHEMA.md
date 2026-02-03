# Rental Dashboard Database Schema Documentation

## Overview

The Rental Dashboard uses SQLite as its database with WAL (Write-Ahead Logging) mode enabled for better concurrency. The database is typically located at `/app/data/rental.db` in production or `data/rental.db` for local development.

**Database Engine:** SQLite 3
**Mode:** WAL (Write-Ahead Logging)
**Foreign Keys:** Enabled

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Users     │       │   Branches  │       │   Settings  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ email       │       │ name        │       │ agency_name │
│ password... │       │ address     │       │ currency    │
│ role        │       │ phone       │       │ vat_percent │
│ created_at  │       └─────────────┘       └─────────────┘
└──────┬──────┘                                   
       │                                           
       │ 1                                         
       │                                           
       │ N                                         
┌──────▼──────────────────────┐    ┌──────────────┐
│           Cars               │    │  API Keys    │
├─────────────────────────────┤    ├──────────────┤
│ id (PK)                     │    │ id (PK)      │
│ plate_number (UNIQUE)        │    │ name         │
│ make                        │    │ token_hash   │
│ model                       │    │ created_at   │
│ year                        │    │ last_used_at │
│ class                       │    └──────────────┘
│ branch_id (FK) ─────────────┼─────┐
│ status                      │     │
│ base_daily_rate             │     │
│ vin                         │     │
│ current_mileage             │     │
│ registration_expiry         │     │
│ insurance_expiry            │     │
│ last_service_mileage        │     │
│ notes                       │     │
│ created_at                  │     │
└────────┬────────────────────┘     │
         │                           │
         │ 1                         │
         │                           │
         │ N                         │
         │                           │
┌────────▼───────────────────────────▼──────────────┐
│              Bookings                             │
├─────────────────────────────────────────────────┤
│ id (PK)                                         │
│ car_id (FK) ─────────────────────────────────────┤
│ customer_id (FK) ───────────────┐                │
│ customer_name                  │                │
│ customer_phone                 │                │
│ customer_id_passport           │                │
│ start_date                     │                │
│ end_date                       │                │
│ status                         │                │
│ total_price                    │                │
│ deposit                        │                │
│ notes                          │                │
│ start_mileage                  │                │
│ end_mileage                    │                │
│ miles_driven                   │                │
│ actual_return_date             │                │
│ late_fee_amount                │                │
│ created_at                     │                │
└────────┬───────────────────────┴────────────────┘
         │
         │ 1
         │
         │ N
         │
┌────────▼───────────┐    ┌────────────────────┐
│ Booking Extras      │    │ Return Checklists  │
├────────────────────┤    ├────────────────────┤
│ id (PK)            │    │ id (PK)           │
│ booking_id (FK)    │    │ booking_id (FK)   │
│ extra_name         │    │ fuel_level        │
│ extra_price        │    │ exterior_condition │
└────────────────────┘    │ interior_condition │
                         │ tire_condition    │
┌───────────────────┐    │ damage_notes      │
│ Customers         │    │ damage_photos     │
├───────────────────┤    │ returned_by (FK)  │
│ id (PK)           │    │ returned_at       │
│ name              │    │ created_at        │
│ email (UNIQUE)    │    └────────────────────┘
│ phone             │
│ address           │
│ id_number         │
│ license_expiry    │
│ created_at        │
└───────────────────┘
         │
         │ 1
         │
         │ N
         │
┌────────▼────────────────────┐    ┌─────────────────┐
│      Expenses               │    │    Incidents    │
├─────────────────────────────┤    ├─────────────────┤
│ id (PK)                     │    │ id (PK)         │
│ car_id (FK)                 │    │ car_id (FK)     │
│ category                    │    │ booking_id (FK) │
│ amount                      │    │ incident_date   │
│ description                 │    │ severity        │
│ expense_date                │    │ description     │
│ created_at                  │    │ estimated_cost  │
└─────────────────────────────┘    │ status          │
                                   │ created_at      │
                                   └─────────────────┘
                                             │
                                             │ 1
                                             │
                                             │ N
                                             │
                                   ┌─────────▼─────────┐
                                   │  Incident Images  │
                                   ├───────────────────┤
                                   │ id (PK)          │
                                   │ incident_id (FK) │
                                   │ url_path         │
                                   │ created_at       │
                                   └───────────────────┘

┌──────────────────────────────┐    ┌──────────────────────┐
│   Maintenance Blocks         │    │  Vehicle Documents   │
├─────────────────────────────┤    ├──────────────────────┤
│ id (PK)                     │    │ id (PK)             │
│ car_id (FK)                 │    │ car_id (FK)         │
│ start_date                  │    │ document_type       │
│ end_date                    │    │ title               │
│ reason                      │    │ expiry_date         │
│ created_at                  │    │ url_path            │
└─────────────────────────────┘    │ file_size           │
                                   │ uploaded_by (FK)    │
┌──────────────────────────────┐    │ created_at          │
│   Late Fee Rules             │    └──────────────────────┘
├─────────────────────────────┤
│ id (PK)                     │    ┌──────────────────────┐
│ hours_from                  │    │   Notifications      │
│ hours_to                    │    ├──────────────────────┤
│ fee_amount                  │    │ id (PK)             │
│ fee_type                    │    │ user_id (FK)        │
│ is_active                   │    │ type                │
│ created_at                  │    │ title               │
└─────────────────────────────┘    │ message             │
                                   │ entity_type         │
                                   │ entity_id           │
┌──────────────────────────────┐    │ is_read             │
│   Audit Logs                 │    │ created_at          │
├─────────────────────────────┤    └──────────────────────┘
│ id (PK)                     │
│ user_id (FK)                │
│ action                      │
│ entity_type                 │
│ entity_id                   │
│ metadata_json               │
│ created_at                  │
└─────────────────────────────┘
```

---

## Table Definitions

### 1. Users

Stores user accounts with authentication credentials and role-based access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user identifier |
| email | TEXT | UNIQUE NOT NULL | User email address (login) |
| password_hash | TEXT | NOT NULL | Bcrypt hashed password |
| role | TEXT | NOT NULL, DEFAULT 'staff', CHECK IN ('admin','staff','readonly') | User role/permissions |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Account creation timestamp |

**Role Permissions:**
- `admin`: Full access to all endpoints including user and API key management
- `staff`: Access to most endpoints, cannot manage users or API keys
- `readonly`: Read-only access to data

**Indexes:**
- Primary key on `id`
- Unique index on `email`

---

### 2. Branches

Stores agency location information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique branch identifier |
| name | TEXT | NOT NULL | Branch name |
| address | TEXT | NULLABLE | Physical address |
| phone | TEXT | NULLABLE | Contact phone number |

**Relationships:**
- One-to-many with Cars (cars belong to branches)

---

### 3. Cars

Stores vehicle inventory information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique car identifier |
| plate_number | TEXT | UNIQUE NOT NULL | License plate number |
| make | TEXT | NOT NULL | Vehicle manufacturer |
| model | TEXT | NOT NULL | Vehicle model |
| year | INTEGER | NOT NULL | Model year |
| class | TEXT | NOT NULL | Vehicle class (e.g., Sedan, SUV) |
| branch_id | INTEGER | FOREIGN KEY → branches(id) | Associated branch |
| status | TEXT | NOT NULL, DEFAULT 'active', CHECK IN ('active','maintenance','inactive') | Car availability status |
| base_daily_rate | REAL | NOT NULL, DEFAULT 0 | Daily rental rate |
| vin | TEXT | NULLABLE | Vehicle identification number |
| notes | TEXT | NULLABLE | Additional notes |
| current_mileage | INTEGER | DEFAULT 0 | Current odometer reading |
| last_service_mileage | INTEGER | DEFAULT 0 | Mileage at last service |
| registration_expiry | TEXT | NULLABLE | Registration expiration date (YYYY-MM-DD) |
| insurance_expiry | TEXT | NULLABLE | Insurance expiration date (YYYY-MM-DD) |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Record creation timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `plate_number`
- Composite index: `(status, class, branch_id)`

**Relationships:**
- Many-to-one with Branches
- One-to-many with Bookings
- One-to-many with Car Images
- One-to-many with Vehicle Documents
- One-to-many with Incidents
- One-to-many with Maintenance Blocks
- One-to-many with Expenses

---

### 4. Car Images

Stores vehicle photo references.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique image identifier |
| car_id | INTEGER | FOREIGN KEY → cars(id) ON DELETE CASCADE | Associated car |
| url_path | TEXT | NOT NULL | Path to image file |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Upload timestamp |

**Relationships:**
- Many-to-one with Cars (cascade delete)

---

### 5. Bookings

Stores rental booking information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique booking identifier |
| car_id | INTEGER | FOREIGN KEY → cars(id) NOT NULL | Rented car |
| customer_name | TEXT | NOT NULL | Customer full name |
| customer_phone | TEXT | NULLABLE | Customer phone number |
| customer_id_passport | TEXT | NULLABLE | Customer ID or passport number |
| customer_id | INTEGER | FOREIGN KEY → customers(id) NULLABLE | Reference to customer record |
| start_date | TEXT | NOT NULL | Rental start date (YYYY-MM-DD) |
| end_date | TEXT | NOT NULL | Rental end date (YYYY-MM-DD) |
| status | TEXT | NOT NULL, DEFAULT 'draft', CHECK IN ('draft','reserved','confirmed','active','completed','cancelled') | Booking status |
| total_price | REAL | NOT NULL, DEFAULT 0 | Total rental price |
| deposit | REAL | NOT NULL, DEFAULT 0 | Deposit amount |
| notes | TEXT | NULLABLE | Booking notes |
| start_mileage | INTEGER | NULLABLE | Mileage at pickup |
| end_mileage | INTEGER | NULLABLE | Mileage at return |
| miles_driven | INTEGER | DEFAULT 0 | Calculated miles driven |
| actual_return_date | TEXT | NULLABLE | Actual return date |
| late_fee_amount | REAL | DEFAULT 0 | Calculated late fee |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Booking creation timestamp |

**Status Flow:**
`draft` → `reserved` → `confirmed` → `active` → `completed`
-or- `cancelled` (at any stage)

**Indexes:**
- Primary key on `id`
- Composite index: `(car_id, start_date, end_date, status)`

**Relationships:**
- Many-to-one with Cars
- Many-to-one with Customers
- One-to-many with Booking Extras
- One-to-one with Return Checklists

---

### 6. Booking Extras

Stores additional services/items for bookings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique extra identifier |
| booking_id | INTEGER | FOREIGN KEY → bookings(id) ON DELETE CASCADE | Parent booking |
| extra_name | TEXT | NOT NULL | Extra item name (e.g., GPS, Child Seat) |
| extra_price | REAL | NOT NULL, DEFAULT 0 | Extra item price |

**Relationships:**
- Many-to-one with Bookings (cascade delete)

---

### 7. Return Checklists

Stores vehicle return condition information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique checklist identifier |
| booking_id | INTEGER | FOREIGN KEY → bookings(id) ON DELETE CASCADE UNIQUE | Associated booking |
| fuel_level | TEXT | NOT NULL, CHECK IN ('empty','quarter','half','three_quarter','full') | Fuel level at return |
| exterior_condition | TEXT | NOT NULL | Exterior condition notes |
| interior_condition | TEXT | NOT NULL | Interior condition notes |
| tire_condition | TEXT | NOT NULL | Tire condition notes |
| damage_notes | TEXT | NULLABLE | Damage description |
| damage_photos | TEXT | NULLABLE | Path to damage photos |
| returned_by | INTEGER | FOREIGN KEY → users(id) | User who processed return |
| returned_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Return timestamp |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Record creation timestamp |

**Relationships:**
- Many-to-one with Bookings (cascade delete)
- Many-to-one with Users

---

### 8. Customers

Stores customer information for repeat renters.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique customer identifier |
| name | TEXT | NOT NULL | Customer full name |
| email | TEXT | UNIQUE NULLABLE | Customer email address |
| phone | TEXT | NULLABLE | Customer phone number |
| address | TEXT | NULLABLE | Customer address |
| id_number | TEXT | NULLABLE | ID or passport number |
| license_expiry | TEXT | NULLABLE | Driver's license expiration (YYYY-MM-DD) |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Customer creation timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `email`

**Relationships:**
- One-to-many with Bookings

---

### 9. Expenses

Tracks vehicle-related expenses for profit calculations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique expense identifier |
| car_id | INTEGER | FOREIGN KEY → cars(id) NOT NULL | Associated vehicle |
| category | TEXT | NOT NULL, CHECK IN ('maintenance','insurance','registration','cleaning','misc','fuel') | Expense category |
| amount | REAL | NOT NULL | Expense amount |
| description | TEXT | NULLABLE | Expense description |
| expense_date | TEXT | NOT NULL, DEFAULT (datetime('now')) | Date of expense |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Record creation timestamp |

**Indexes:**
- Primary key on `id`
- Composite index: `(car_id, expense_date)`

**Relationships:**
- Many-to-one with Cars

---

### 10. Maintenance Blocks

Stores scheduled maintenance periods when cars are unavailable.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique block identifier |
| car_id | INTEGER | FOREIGN KEY → cars(id) NOT NULL | Associated vehicle |
| start_date | TEXT | NOT NULL | Maintenance start date |
| end_date | TEXT | NOT NULL | Maintenance end date |
| reason | TEXT | NULLABLE | Reason for maintenance |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Record creation timestamp |

**Indexes:**
- Primary key on `id`
- Composite index: `(car_id, start_date, end_date)`

**Relationships:**
- Many-to-one with Cars

---

### 11. Incidents

Stores vehicle incident/accident reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique incident identifier |
| car_id | INTEGER | FOREIGN KEY → cars(id) NOT NULL | Involved vehicle |
| booking_id | INTEGER | FOREIGN KEY → bookings(id) NULLABLE | Associated booking (if any) |
| incident_date | TEXT | NOT NULL | Date of incident |
| severity | TEXT | NOT NULL, CHECK IN ('minor','major') | Incident severity |
| description | TEXT | NULLABLE | Incident description |
| estimated_cost | REAL | NULLABLE | Estimated repair cost |
| status | TEXT | NOT NULL, DEFAULT 'open', CHECK IN ('open','under_review','resolved') | Resolution status |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Report creation timestamp |

**Status Flow:**
`open` → `under_review` → `resolved`

**Relationships:**
- Many-to-one with Cars
- Many-to-one with Bookings
- One-to-many with Incident Images

---

### 12. Incident Images

Stores photos related to incidents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique image identifier |
| incident_id | INTEGER | FOREIGN KEY → incidents(id) ON DELETE CASCADE | Parent incident |
| url_path | TEXT | NOT NULL | Path to image file |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Upload timestamp |

**Relationships:**
- Many-to-one with Incidents (cascade delete)

---

### 13. Settings

Stores agency-wide configuration settings (singleton table).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, CHECK (id = 1), DEFAULT 1 | Always 1 |
| agency_name | TEXT | DEFAULT 'Rental Agency' | Agency display name |
| currency | TEXT | DEFAULT 'USD' | Currency code (USD, EUR, etc.) |
| vat_percent | REAL | DEFAULT 0 | VAT percentage |
| logo_path | TEXT | NULLABLE | Path to agency logo |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Record creation timestamp |

**Note:** This is a singleton table with exactly one row (id = 1).

---

### 14. Late Fee Rules

Stores configuration for calculating late return fees.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique rule identifier |
| hours_from | INTEGER | NOT NULL | Hours range start (inclusive) |
| hours_to | INTEGER | NULLABLE | Hours range end (exclusive), NULL for unlimited |
| fee_amount | REAL | NOT NULL | Fee amount |
| fee_type | TEXT | NOT NULL, DEFAULT 'flat', CHECK IN ('flat','percentage') | Fee calculation type |
| is_active | INTEGER | NOT NULL, DEFAULT 1, CHECK IN (0,1) | Rule active flag |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Rule creation timestamp |

**Example Rules:**
- 0-24 hours late: $50 flat
- 24-48 hours late: 20% of daily rate
- 48+ hours late: $100 flat

**Indexes:**
- Primary key on `id`
- Index on `(is_active)`

---

### 15. Vehicle Documents

Stores vehicle registration, insurance, and inspection documents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique document identifier |
| car_id | INTEGER | FOREIGN KEY → cars(id) ON DELETE CASCADE | Associated vehicle |
| document_type | TEXT | NOT NULL, CHECK IN ('registration','insurance','inspection','other') | Document type |
| title | TEXT | NOT NULL | Document title |
| expiry_date | TEXT | NULLABLE | Document expiration date (YYYY-MM-DD) |
| url_path | TEXT | NOT NULL | Path to document file |
| file_size | INTEGER | NOT NULL | File size in bytes |
| uploaded_by | INTEGER | FOREIGN KEY → users(id) | User who uploaded |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Upload timestamp |

**Indexes:**
- Primary key on `id`
- Composite index: `(car_id)`

**Relationships:**
- Many-to-one with Cars (cascade delete)
- Many-to-one with Users

---

### 16. Notifications

Stores user notifications (overdue bookings, expiring docs, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique notification identifier |
| user_id | INTEGER | FOREIGN KEY → users(id) NOT NULL | Target user |
| type | TEXT | NOT NULL, CHECK IN ('overdue','expiring_registration','expiring_insurance','other') | Notification type |
| title | TEXT | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| entity_type | TEXT | NULLABLE | Related entity type |
| entity_id | TEXT | NULLABLE | Related entity ID |
| is_read | INTEGER | NOT NULL, DEFAULT 0, CHECK IN (0,1) | Read status flag |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Creation timestamp |

**Indexes:**
- Primary key on `id`
- Composite index: `(user_id, is_read, created_at DESC)`

**Relationships:**
- Many-to-one with Users

---

### 17. API Keys

Stores API keys for external integrations (like n8n).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique key identifier |
| name | TEXT | NOT NULL | Key name/description |
| token_hash | TEXT | NOT NULL | SHA-256 hash of API token |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Key creation timestamp |
| last_used_at | TEXT | NULLABLE | Last usage timestamp |

**Security Note:** The actual API token is NOT stored, only its SHA-256 hash.

---

### 18. Audit Logs

Stores audit trail of all data modifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique log identifier |
| user_id | INTEGER | FOREIGN KEY → users(id) NULLABLE | User who made change |
| action | TEXT | NOT NULL | Action type (create, update, delete, etc.) |
| entity_type | TEXT | NOT NULL | Entity type (car, booking, etc.) |
| entity_id | TEXT | NULLABLE | Entity ID |
| metadata_json | TEXT | NULLABLE | JSON metadata of changes |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now')) | Log timestamp |

**Indexes:**
- Primary key on `id`
- Index on `(created_at DESC)`

**Relationships:**
- Many-to-one with Users

---

## Common Indexes

The following indexes exist for performance optimization:

```sql
-- Cars availability queries
CREATE INDEX idx_cars_status_class_branch ON cars(status, class, branch_id);

-- Booking date range queries
CREATE INDEX idx_bookings_car_dates_status ON bookings(car_id, start_date, end_date, status);

-- Maintenance availability queries
CREATE INDEX idx_maintenance_car_dates ON maintenance_blocks(car_id, start_date, end_date);

-- Expense reporting queries
CREATE INDEX idx_expenses_car_date ON expenses(car_id, expense_date DESC);

-- Vehicle documents lookup
CREATE INDEX idx_vehicle_docs_car ON vehicle_documents(car_id);

-- Late fee rules active filter
CREATE INDEX idx_late_fee_rules_active ON late_fee_rules(is_active);

-- Notifications user queries
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

-- Audit log queries
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

---

## Data Integrity Constraints

### Foreign Key Relationships

1. **cars.branch_id** → **branches.id**
2. **bookings.car_id** → **cars.id**
3. **bookings.customer_id** → **customers.id**
4. **booking_extras.booking_id** → **bookings.id** (CASCADE DELETE)
5. **return_checklists.booking_id** → **bookings.id** (CASCADE DELETE, UNIQUE)
6. **return_checklists.returned_by** → **users.id**
7. **expenses.car_id** → **cars.id**
8. **maintenance_blocks.car_id** → **cars.id**
9. **incidents.car_id** → **cars.id**
10. **incidents.booking_id** → **bookings.id**
11. **incident_images.incident_id** → **incidents.id** (CASCADE DELETE)
12. **vehicle_documents.car_id** → **cars.id** (CASCADE DELETE)
13. **vehicle_documents.uploaded_by** → **users.id**
14. **notifications.user_id** → **users.id**
15. **audit_logs.user_id** → **users.id**

### Cascade Delete Rules

- When a **car** is deleted:
  - Related car_images are deleted
  - Related vehicle_documents are deleted

- When a **booking** is deleted:
  - Related booking_extras are deleted
  - Related return_checklist is deleted

- When an **incident** is deleted:
  - Related incident_images are deleted

---

## Access Patterns for n8n

### Common Query Patterns

#### 1. Get Active Cars
```sql
SELECT id, plate_number, make, model, class, base_daily_rate 
FROM cars 
WHERE status = 'active' 
ORDER BY plate_number;
```

#### 2. Check Car Availability
```sql
SELECT c.* FROM cars c
WHERE c.id = ? AND c.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM bookings b 
  WHERE b.car_id = c.id 
  AND b.status IN ('reserved','confirmed','active')
  AND b.start_date <= ? 
  AND b.end_date >= ?
)
AND NOT EXISTS (
  SELECT 1 FROM maintenance_blocks m
  WHERE m.car_id = c.id
  AND m.start_date <= ?
  AND m.end_date >= ?
);
```

#### 3. Get Active Bookings
```sql
SELECT b.*, c.plate_number, c.make, c.model
FROM bookings b
JOIN cars c ON b.car_id = c.id
WHERE b.status = 'active'
ORDER BY b.start_date;
```

#### 4. Get Customer History
```sql
SELECT b.*, c.plate_number, c.make, c.model
FROM bookings b
JOIN cars c ON b.car_id = c.id
WHERE b.customer_id = ?
ORDER BY b.start_date DESC;
```

#### 5. Get Expense Summary
```sql
SELECT 
  car_id,
  category,
  SUM(amount) as total_amount,
  COUNT(*) as count
FROM expenses
WHERE expense_date BETWEEN ? AND ?
GROUP BY car_id, category
ORDER BY total_amount DESC;
```

#### 6. Get Overdue Bookings
```sql
SELECT b.*, c.plate_number
FROM bookings b
JOIN cars c ON b.car_id = c.id
WHERE b.status IN ('active', 'reserved')
AND b.end_date < date('now')
ORDER BY b.end_date;
```

#### 7. Get Expiring Documents
```sql
SELECT c.*, vd.document_type, vd.title, vd.expiry_date
FROM cars c
JOIN vehicle_documents vd ON c.id = vd.car_id
WHERE vd.expiry_date <= date('now', '+30 days')
ORDER BY vd.expiry_date;
```

#### 8. Get Revenue by Car
```sql
SELECT 
  b.car_id,
  c.plate_number,
  c.make,
  c.model,
  COUNT(b.id) as booking_count,
  SUM(b.total_price - b.deposit) as revenue
FROM bookings b
JOIN cars c ON b.car_id = c.id
WHERE b.status = 'completed'
  AND b.end_date >= date('now', '-30 days')
GROUP BY b.car_id
ORDER BY revenue DESC;
```

---

## Database Connection Methods

### Option 1: HTTP API (Recommended for n8n)

Use the existing REST API with API key authentication.

**Advantages:**
- Security through API key authentication
- Built-in authorization and validation
- Consistent with application logic
- No direct database access required

**Connection:**
```
Base URL: http://localhost:3010
Authentication: Bearer <api_key>
```

### Option 2: Direct SQLite Access (For Advanced Use)

Connect directly to the SQLite database file.

**Location:**
- Production: `/app/data/rental.db`
- Local: `data/rental.db`

**Connection String:**
```
sqlite:/app/data/rental.db
```

**Advantages:**
- Direct access to all data
- Custom queries possible
- No API overhead

**Disadvantages:**
- Bypasses application logic
- Security concerns (file access)
- May break if schema changes

---

## Schema Migration Files

The database schema is managed through migration files:

1. **schema.sqlite.sql** - Initial schema definition
2. **migrations/001_add_new_features.sql** - Feature additions (customers, mileage, documents, expenses, etc.)
3. **migrations/add_missing_columns.sql** - Backwards-compatible column additions

---

## Performance Considerations

1. **WAL Mode**: Enabled for better concurrent read/write performance
2. **Indexes**: Strategic indexes on frequently queried columns
3. **Foreign Keys**: Enabled for data integrity
4. **Date Format**: Stored as TEXT in ISO 8601 format (YYYY-MM-DD)

---

## Backup Recommendations

For production deployments:

```bash
# SQLite backup
sqlite3 /app/data/rental.db ".backup /backups/rental_$(date +%Y%m%d_%H%M%S).db"

# Or using cp with WAL checkpoint
sqlite3 /app/data/rental.db "PRAGMA wal_checkpoint(TRUNCATE);"
cp /app/data/rental.db /backups/rental_$(date +%Y%m%d_%H%M%S).db
```
