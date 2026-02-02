# API Reference

Base URL: `/api` (relative to app origin in production, or `http://localhost:3001` for backend-only).

**Authentication (choose one):**
- **Dashboard users:** `Authorization: Bearer <jwt_token>` (from login), or cookie `token`.
- **API keys (e.g. chatbot):** `Authorization: Bearer <api_key>` or header `X-API-Key: <api_key>`. API keys have staff-level access (read + create/update bookings, cars, incidents, maintenance; no settings/users/audit).

---

## Auth

### POST /api/auth/login
Body: `{ "email": "string", "password": "string" }`  
Response: `{ "token": "string", "user": { "id", "email", "role" } }`  
Rate limited (20 requests per 15 min per IP).

### POST /api/auth/logout
Response: `{ "ok": true }`  
Clears cookie.

### GET /api/auth/me
Requires auth.  
Response: `{ "id", "email", "role" }`

---

## Cars

### GET /api/cars
Query: `status`, `class`, `branch_id` (optional).  
Response: array of cars with `images` array.

### GET /api/cars/:id
Response: single car with `images`.

### POST /api/cars
Requires admin or staff.  
Body: `{ "plate_number", "make", "model", "year", "class", "base_daily_rate", "branch_id?", "status?", "vin?", "notes?" }`  
Response: created car.

### PUT /api/cars/:id
Requires admin or staff.  
Body: same fields as POST (partial).  
Response: updated car.

### DELETE /api/cars/:id
Requires admin or staff. Soft delete (sets status to inactive).  
Response: `{ "ok": true }`

### POST /api/cars/:id/images
Requires admin or staff.  
Body: multipart/form-data, field `images` (files).  
Response: array of `{ id, url_path }`

---

## Availability

### GET /api/availability
Query: `start` (YYYY-MM-DD), `end` (YYYY-MM-DD), `class?`, `branch_id?` (required: start, end).  
Response: array of available cars with pricing (excludes cars with overlapping bookings/maintenance/open major incidents).

---

## Bookings

### GET /api/bookings
Query: `status?`, `car_id?`, `from?`, `to?`.  
Response: array of bookings with car info and extras.

### GET /api/bookings/:id
Response: single booking with extras.

### POST /api/bookings
Requires admin or staff.  
Body: `{ "car_id", "customer_name", "customer_phone?", "customer_id_passport?", "start_date", "end_date", "status?", "total_price?", "deposit?", "notes?", "extras?": [{ "extra_name", "extra_price" }] }`  
Validates no overlap with existing bookings/maintenance.  
Response: created booking.

### PUT /api/bookings/:id/status
Requires admin or staff.  
Body: `{ "status": "draft" | "reserved" | "confirmed" | "active" | "completed" | "cancelled" }`  
Response: updated booking.

---

## Maintenance

### GET /api/maintenance
Query: `car_id?`.  
Response: array of maintenance blocks with car info.

### POST /api/maintenance
Requires admin or staff.  
Body: `{ "car_id", "start_date", "end_date", "reason?" }`  
Response: created block.

---

## Incidents

### GET /api/incidents
Query: `status?`, `car_id?`, `severity?`.  
Response: array of incidents with `images`.

### GET /api/incidents/:id
Response: single incident with images.

### POST /api/incidents
Requires admin or staff.  
Body: multipart/form-data: `car_id`, `booking_id?`, `incident_date`, `severity`, `description?`, `estimated_cost?`, `images?` (files).  
Response: created incident.

### PUT /api/incidents/:id/status
Requires admin or staff.  
Body: `{ "status": "open" | "under_review" | "resolved" }`  
Response: updated incident.

---

## Settings (admin only)

### GET /api/settings
Response: `{ "id", "agency_name", "currency", "vat_percent", "logo_path", "created_at" }`

### PUT /api/settings
Body: `{ "agency_name?", "currency?", "vat_percent?", "logo_path?" }`  
Response: updated settings.

---

## Branches

### GET /api/branches
Response: array of `{ id, name, address, phone }`

---

## Users (admin only)

### GET /api/users
Response: array of `{ id, email, role, created_at }`

### POST /api/users
Body: `{ "email", "password", "role": "admin" | "staff" | "readonly" }`  
Response: created user (no password in response).

---

## Integrations / API keys (admin only)

### GET /api/integrations/api-keys
Response: array of `{ id, name, created_at, last_used_at }`

### POST /api/integrations/api-keys
Body: `{ "name": "string" }`  
Response: `{ "id", "name", "created_at", "token": "string" }` — token shown only once.

### DELETE /api/integrations/api-keys/:id
Response: `{ "ok": true }`

---

## Reports

### GET /api/reports
Response: `{ "cars_total", "available_today", "bookings_today", "active_rentals", "pending_incidents", "revenue_total", "utilization_percent" }`

### GET /api/reports/export/:type
Type: `bookings` | `cars` | `incidents`.  
Response: CSV file (attachment).

---

## Audit (admin only)

### GET /api/audit
Query: `limit?` (default 100, max 500).  
Response: array of `{ id, action, entity_type, entity_id, metadata_json, created_at, user_email }`
