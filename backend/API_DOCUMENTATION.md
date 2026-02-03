# Rental Dashboard Backend API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Cars](#cars-endpoints)
   - [Bookings](#bookings-endpoints)
   - [Customers](#customers-endpoints)
   - [Availability](#availability-endpoints)
   - [Branches](#branches-endpoints)
   - [Expenses](#expenses-endpoints)
   - [Maintenance](#maintenance-endpoints)
   - [Incidents](#incidents-endpoints)
   - [Settings](#settings-endpoints)
   - [Integrations](#integrations-endpoints)
   - [Users](#users-endpoints)
   - [Reports](#reports-endpoints)
   - [Audit Logs](#audit-logs-endpoints)
   - [Notifications](#notifications-endpoints)
4. [Response Codes](#response-codes)
5. [Rate Limiting](#rate-limiting)
6. [Example Usage](#example-usage)

---

## Overview

The Rental Dashboard API provides a RESTful interface for managing car rental operations including cars, bookings, customers, expenses, maintenance, and incidents.

**Base URL:** `http://localhost:3010` (or your deployed backend URL)

**API Version:** v1

**Content-Type:** `application/json`

**Database:** SQLite with WAL mode enabled

---

## Authentication

### JWT Token Authentication

Most endpoints require authentication via JWT token or API key.

**How to Authenticate:**

1. **Login to get JWT token:**
   ```bash
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
   
   Response:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": 1,
       "email": "user@example.com",
       "role": "admin"
     }
   }
   ```

2. **Include token in requests:**
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:3010/api/cars
   ```

### API Key Authentication

For integrations (like n8n), you can create API keys:

1. Create an API key (requires admin role)
2. Include in `Authorization: Bearer <api_key>` header or `x-api-key` header

**Role Levels:**
- `admin` - Full access to all endpoints
- `staff` - Access to most endpoints, cannot manage users or API keys
- `readonly` - Read-only access

---

## API Endpoints

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin"
  }
}
```

**Response (401):**
```json
{
  "error": "Invalid email or password"
}
```

#### Logout
```http
POST /api/auth/logout
```

**Response (200):**
```json
{
  "ok": true
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "admin"
}
```

---

### Cars Endpoints

#### List All Cars
```http
GET /api/cars?status=active&class=SUV&branch_id=1
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional) - Filter by status: `active`, `maintenance`, `inactive`
- `class` (optional) - Filter by car class
- `branch_id` (optional) - Filter by branch

**Response (200):**
```json
[
  {
    "id": 1,
    "plate_number": "ABC123",
    "make": "Toyota",
    "model": "Camry",
    "year": 2023,
    "class": "Sedan",
    "branch_id": 1,
    "branch_name": "Main Branch",
    "status": "active",
    "base_daily_rate": 50.00,
    "vin": "JTHBE5C28...",
    "notes": null,
    "current_mileage": 15000,
    "registration_expiry": "2024-12-31",
    "insurance_expiry": "2024-12-31",
    "doc_count": 2,
    "images": [
      {
        "id": 1,
        "url_path": "/uploads/cars/1234567890-image.jpg"
      }
    ]
  }
]
```

#### Get Car by ID
```http
GET /api/cars/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "plate_number": "ABC123",
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "class": "Sedan",
  "branch_id": 1,
  "branch_name": "Main Branch",
  "status": "active",
  "base_daily_rate": 50.00,
  "vin": "JTHBE5C28...",
  "notes": null,
  "current_mileage": 15000,
  "registration_expiry": "2024-12-31",
  "insurance_expiry": "2024-12-31",
  "images": []
}
```

#### Create Car
```http
POST /api/cars
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin, staff*

**Request Body:**
```json
{
  "plate_number": "ABC123",
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "class": "Sedan",
  "branch_id": 1,
  "status": "active",
  "base_daily_rate": 50.00,
  "vin": "JTHBE5C28...",
  "notes": "Great condition",
  "current_mileage": 15000,
  "registration_expiry": "2024-12-31",
  "insurance_expiry": "2024-12-31"
}
```

**Response (201):**
```json
{
  "id": 1,
  "plate_number": "ABC123",
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "class": "Sedan",
  "branch_id": 1,
  "status": "active",
  "base_daily_rate": 50.00,
  "vin": "JTHBE5C28...",
  "notes": "Great condition",
  "current_mileage": 15000,
  "registration_expiry": "2024-12-31",
  "insurance_expiry": "2024-12-31"
}
```

#### Update Car
```http
PUT /api/cars/:id
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin, staff*

**Request Body:** (Partial update supported)
```json
{
  "base_daily_rate": 55.00,
  "current_mileage": 16000
}
```

**Response (200):**
```json
{
  "id": 1,
  "plate_number": "ABC123",
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "class": "Sedan",
  "branch_id": 1,
  "status": "active",
  "base_daily_rate": 55.00,
  "vin": "JTHBE5C28...",
  "notes": "Great condition",
  "current_mileage": 16000,
  "registration_expiry": "2024-12-31",
  "insurance_expiry": "2024-12-31"
}
```

#### Delete/Archive Car
```http
DELETE /api/cars/:id
Authorization: Bearer <token>
```
*Requires role: admin, staff*

**Response (200):**
```json
{
  "ok": true
}
```

#### Upload Car Images
```http
POST /api/cars/:id/images
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
*Requires role: admin, staff*

**Request:** Form data with `images` field (max 10 images, 5MB each)

**Response (201):**
```json
[
  {
    "id": 1,
    "url_path": "/uploads/cars/1234567890-image.jpg"
  }
]
```

#### Get Car Documents
```http
GET /api/cars/:id/documents
Authorization: Bearer <token>
```
*Requires role: admin, staff*

**Response (200):**
```json
[
  {
    "id": 1,
    "car_id": 1,
    "document_type": "registration",
    "title": "Vehicle Registration 2024",
    "expiry_date": "2024-12-31",
    "url_path": "/uploads/vehicles/1_1234567890.pdf",
    "file_size": 1024000,
    "uploaded_by": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Upload Car Document
```http
POST /api/cars/:id/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
*Requires role: admin, staff*

**Request:** Form data with:
- `document` (file, max 10MB)
- `document_type` - `registration`, `insurance`, `inspection`, `other`
- `title`
- `expiry_date` (optional, format: YYYY-MM-DD)

**Response (201):**
```json
{
  "id": 1,
  "car_id": 1,
  "document_type": "registration",
  "title": "Vehicle Registration 2024",
  "expiry_date": "2024-12-31",
  "url_path": "/uploads/vehicles/1_1234567890.pdf",
  "file_size": 1024000,
  "uploaded_by": 1,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### Delete Car Document
```http
DELETE /api/cars/documents/:docId
Authorization: Bearer <token>
```
*Requires role: admin, staff*

**Response (200):**
```json
{
  "ok": true
}
```

---

### Bookings Endpoints

#### List All Bookings
```http
GET /api/bookings?status=active&car_id=1&from=2024-01-01&to=2024-12-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional) - Filter by status: `draft`, `reserved`, `confirmed`, `active`, `completed`, `cancelled`
- `car_id` (optional) - Filter by car
- `from` (optional) - Start date filter (YYYY-MM-DD)
- `to` (optional) - End date filter (YYYY-MM-DD)

**Response (200):**
```json
[
  {
    "id": 1,
    "car_id": 1,
    "plate_number": "ABC123",
    "make": "Toyota",
    "model": "Camry",
    "customer_name": "John Doe",
    "customer_phone": "+1234567890",
    "customer_id_passport": "A12345678",
    "customer_id": 1,
    "start_date": "2024-01-15",
    "end_date": "2024-01-20",
    "status": "active",
    "total_price": 250.00,
    "deposit": 50.00,
    "notes": null,
    "start_mileage": 15000,
    "end_mileage": null,
    "miles_driven": 0,
    "actual_return_date": null,
    "late_fee_amount": 0,
    "created_at": "2024-01-10T00:00:00.000Z",
    "extras": [
      {
        "extra_name": "GPS",
        "extra_price": 10.00
      }
    ]
  }
]
```

#### Get Booking by ID
```http
GET /api/bookings/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "car_id": 1,
  "plate_number": "ABC123",
  "make": "Toyota",
  "model": "Camry",
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "customer_id_passport": "A12345678",
  "customer_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-20",
  "status": "active",
  "total_price": 250.00,
  "deposit": 50.00,
  "notes": null,
  "start_mileage": 15000,
  "end_mileage": null,
  "miles_driven": 0,
  "actual_return_date": null,
  "late_fee_amount": 0,
  "extras": []
}
```

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin, staff*

**Request Body:**
```json
{
  "car_id": 1,
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "customer_id_passport": "A12345678",
  "customer_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-20",
  "status": "confirmed",
  "total_price": 250.00,
  "deposit": 50.00,
  "notes": "Early arrival requested",
  "extras": [
    {
      "extra_name": "GPS",
      "extra_price": 10.00
    },
    {
      "extra_name": "Child Seat",
      "extra_price": 15.00
    }
  ],
  "start_mileage": 15000,
  "end_mileage": null
}
```

**Response (201):**
```json
{
  "id": 1,
  "car_id": 1,
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "customer_id_passport": "A12345678",
  "customer_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-20",
  "status": "confirmed",
  "total_price": 250.00,
  "deposit": 50.00,
  "notes": "Early arrival requested",
  "start_mileage": 15000,
  "end_mileage": null,
  "miles_driven": 0,
  "actual_return_date": null,
  "late_fee_amount": 0,
  "created_at": "2024-01-10T00:00:00.000Z"
}
```

#### Update Booking Status
```http
PUT /api/bookings/:id/status
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin, staff*

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response (200):**
```json
{
  "id": 1,
  "car_id": 1,
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "customer_id_passport": "A12345678",
  "customer_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-20",
  "status": "completed",
  "total_price": 250.00,
  "deposit": 50.00,
  "notes": "Early arrival requested",
  "start_mileage": 15000,
  "end_mileage": 15500,
  "miles_driven": 500,
  "actual_return_date": "2024-01-20",
  "late_fee_amount": 0,
  "created_at": "2024-01-10T00:00:00.000Z"
}
```

#### Update Booking
```http
PUT /api/bookings/:id
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin, staff*

**Request Body:** (Partial update supported)
```json
{
  "end_mileage": 15500,
  "total_price": 275.00
}
```

**Response (200):**
```json
{
  "id": 1,
  "car_id": 1,
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "customer_id_passport": "A12345678",
  "customer_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-20",
  "status": "completed",
  "total_price": 275.00,
  "deposit": 50.00,
  "notes": "Early arrival requested",
  "start_mileage": 15000,
  "end_mileage": 15500,
  "miles_driven": 500,
  "actual_return_date": "2024-01-20",
  "late_fee_amount": 0,
  "created_at": "2024-01-10T00:00:00.000Z"
}
```

---

### Customers Endpoints

#### List Customers
```http
GET /api/customers?search=John
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (optional) - Search in name, email, phone, or ID number

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "id_number": "A12345678",
    "license_expiry": "2025-12-31",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Get Customer by ID
```http
GET /api/customers/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "id_number": "A12345678",
  "license_expiry": "2025-12-31",
  "created_at": "2024-01-01T00:00:00.000Z",
  "bookings": [
    {
      "id": 1,
      "car_id": 1,
      "plate_number": "ABC123",
      "make": "Toyota",
      "model": "Camry",
      "customer_name": "John Doe",
      "customer_phone": "+1234567890",
      "customer_id_passport": "A12345678",
      "customer_id": 1,
      "start_date": "2024-01-15",
      "end_date": "2024-01-20",
      "status": "completed",
      "total_price": 250.00,
      "deposit": 50.00,
      "notes": null,
      "start_mileage": 15000,
      "end_mileage": 15500,
      "miles_driven": 500,
      "actual_return_date": "2024-01-20",
      "late_fee_amount": 0,
      "created_at": "2024-01-10T00:00:00.000Z",
      "extras": []
    }
  ]
}
```

#### Create Customer
```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin, staff*

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "id_number": "A12345678",
  "license_expiry": "2025-12-31"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "id_number": "A12345678",
  "license_expiry": "2025-12-31",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### Update Customer
```http
PUT /api/customers/:id
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin, staff*

**Request Body:** (Partial update supported)
```json
{
  "phone": "+1987654321"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1987654321",
  "address": "123 Main St",
  "id_number": "A12345678",
  "license_expiry": "2025-12-31",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### Delete Customer
```http
DELETE /api/customers/:id
Authorization: Bearer <token>
```
*Requires role: admin*

**Response (200):**
```json
{
  "ok": true
}
```

---

### Availability Endpoints

#### Check Car Availability
```http
GET /api/availability?start=2024-01-15&end=2024-01-20&class=SUV&branch_id=1
Authorization: Bearer <token>
```

**Query Parameters:**
- `start` (required) - Start date (YYYY-MM-DD)
- `end` (required) - End date (YYYY-MM-DD)
- `class` (optional) - Filter by car class
- `branch_id` (optional) - Filter by branch

**Response (200):**
```json
[
  {
    "id": 1,
    "plate_number": "ABC123",
    "make": "Toyota",
    "model": "Camry",
    "year": 2023,
    "class": "Sedan",
    "branch_id": 1,
    "branch_name": "Main Branch",
    "status": "active",
    "base_daily_rate": 50.00
  }
]
```

---

### Branches Endpoints

#### List All Branches
```http
GET /api/branches
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Main Branch",
    "address": "123 Main St",
    "phone": "+1234567890"
  }
]
```

---

### Expenses Endpoints

#### List Expenses
```http
GET /api/expenses?car_id=1&category=maintenance&from=2024-01-01&to=2024-12-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `car_id` (optional) - Filter by car
- `category` (optional) - Filter by category: `maintenance`, `insurance`, `registration`, `cleaning`, `misc`, `fuel`
- `from` (optional) - Start date filter (YYYY-MM-DD)
- `to` (optional) - End date filter (YYYY-MM-DD)

**Response (200):**
```json
[
  {
    "id": 1,
    "car_id": 1,
    "plate_number": "ABC123",
    "make": "Toyota",
    "model": "Camry",
    "category": "maintenance",
    "amount": 150.00,
    "description": "Oil change",
    "expense_date": "2024-01-15",
    "created_at": "2024-01-15T00:00:00.000Z"
  }
]
```

#### Get Expense by ID
```http
GET /api/expenses/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "car_id": 1,
  "plate_number": "ABC123",
  "make": "Toyota",
  "model": "Camry",
  "category": "maintenance",
  "amount": 150.00,
  "description": "Oil change",
  "expense_date": "2024-01-15",
  "created_at": "2024-01-15T00:00:00.000Z"
}
```

#### Create Expense
```http
POST /api/expenses
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin, staff*

**Request Body:**
```json
{
  "car_id": 1,
  "category": "maintenance",
  "amount": 150.00,
  "description": "Oil change",
  "expense_date": "2024-01-15"
}
```

**Response (201):**
```json
{
  "id": 1,
  "car_id": 1,
  "category": "maintenance",
  "amount": 150.00,
  "description": "Oil change",
  "expense_date": "2024-01-15",
  "created_at": "2024-01-15T00:00:00.000Z"
}
```

#### Update Expense
```http
PUT /api/expenses/:id
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin, staff*

**Request Body:** (Partial update supported)
```json
{
  "amount": 175.00
}
```

**Response (200):**
```json
{
  "id": 1,
  "car_id": 1,
  "category": "maintenance",
  "amount": 175.00,
  "description": "Oil change",
  "expense_date": "2024-01-15",
  "created_at": "2024-01-15T00:00:00.000Z"
}
```

#### Delete Expense
```http
DELETE /api/expenses/:id
Authorization: Bearer <token>
```
*Requires role: admin*

**Response (200):**
```json
{
  "ok": true
}
```

---

### Maintenance Endpoints

#### List Maintenance Blocks
```http
GET /api/maintenance?car_id=1
Authorization: Bearer <token>
```

**Query Parameters:**
- `car_id` (optional) - Filter by car

**Response (200):**
```json
[
  {
    "id": 1,
    "car_id": 1,
    "plate_number": "ABC123",
    "make": "Toyota",
    "model": "Camry",
    "start_date": "2024-01-15",
    "end_date": "2024-01-17",
    "reason": "Annual service",
    "created_at": "2024-01-10T00:00:00.000Z"
  }
]
```

#### Create Maintenance Block
```http
POST /api/maintenance
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin, staff*

**Request Body:**
```json
{
  "car_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-17",
  "reason": "Annual service"
}
```

**Response (201):**
```json
{
  "id": 1,
  "car_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-17",
  "reason": "Annual service",
  "created_at": "2024-01-10T00:00:00.000Z"
}
```

---

### Incidents Endpoints

#### List Incidents
```http
GET /api/incidents?status=open&car_id=1&severity=major
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional) - Filter by status: `open`, `under_review`, `resolved`
- `car_id` (optional) - Filter by car
- `severity` (optional) - Filter by severity: `minor`, `major`

**Response (200):**
```json
[
  {
    "id": 1,
    "car_id": 1,
    "plate_number": "ABC123",
    "make": "Toyota",
    "model": "Camry",
    "booking_id": 1,
    "incident_date": "2024-01-16",
    "severity": "minor",
    "description": "Small scratch on rear bumper",
    "estimated_cost": 100.00,
    "status": "open",
    "created_at": "2024-01-16T00:00:00.000Z",
    "images": [
      {
        "id": 1,
        "url_path": "/uploads/incidents/1234567890-image.jpg"
      }
    ]
  }
]
```

#### Get Incident by ID
```http
GET /api/incidents/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "car_id": 1,
  "plate_number": "ABC123",
  "make": "Toyota",
  "model": "Camry",
  "booking_id": 1,
  "incident_date": "2024-01-16",
  "severity": "minor",
  "description": "Small scratch on rear bumper",
  "estimated_cost": 100.00,
  "status": "open",
  "created_at": "2024-01-16T00:00:00.000Z",
  "images": []
}
```

#### Create Incident
```http
POST /api/incidents
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
*Requires role: admin, staff*

**Request:** Form data with:
- `car_id`
- `booking_id` (optional)
- `incident_date`
- `severity` - `minor`, `major`
- `description` (optional)
- `estimated_cost` (optional)
- `status` (optional, default: `open`)
- `images` (optional, max 5 images, 5MB each)

**Response (201):**
```json
{
  "id": 1,
  "car_id": 1,
  "booking_id": 1,
  "incident_date": "2024-01-16",
  "severity": "minor",
  "description": "Small scratch on rear bumper",
  "estimated_cost": 100.00,
  "status": "open",
  "created_at": "2024-01-16T00:00:00.000Z"
}
```

#### Update Incident Status
```http
PUT /api/incidents/:id/status
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin, staff*

**Request Body:**
```json
{
  "status": "resolved"
}
```

**Response (200):**
```json
{
  "id": 1,
  "car_id": 1,
  "plate_number": "ABC123",
  "make": "Toyota",
  "model": "Camry",
  "booking_id": 1,
  "incident_date": "2024-01-16",
  "severity": "minor",
  "description": "Small scratch on rear bumper",
  "estimated_cost": 100.00,
  "status": "resolved",
  "created_at": "2024-01-16T00:00:00.000Z"
}
```

---

### Settings Endpoints

#### Get Settings
```http
GET /api/settings
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "agency_name": "Rental Agency",
  "currency": "USD",
  "vat_percent": 10.0,
  "logo_path": "/uploads/logo.png",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### Update Settings
```http
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin*

**Request Body:** (Partial update supported)
```json
{
  "agency_name": "My Rental Agency",
  "currency": "EUR",
  "vat_percent": 20.0
}
```

**Response (200):**
```json
{
  "id": 1,
  "agency_name": "My Rental Agency",
  "currency": "EUR",
  "vat_percent": 20.0,
  "logo_path": "/uploads/logo.png",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### Get Late Fee Rules
```http
GET /api/settings/late-fee-rules
Authorization: Bearer <token>
```
*Requires role: admin*

**Response (200):**
```json
[
  {
    "id": 1,
    "hours_from": 0,
    "hours_to": 24,
    "fee_amount": 50.00,
    "fee_type": "flat",
    "is_active": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Late Fee Rule
```http
POST /api/settings/late-fee-rules
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin*

**Request Body:**
```json
{
  "hours_from": 0,
  "hours_to": 24,
  "fee_amount": 50.00,
  "fee_type": "flat",
  "is_active": true
}
```

**Response (201):**
```json
{
  "id": 1,
  "hours_from": 0,
  "hours_to": 24,
  "fee_amount": 50.00,
  "fee_type": "flat",
  "is_active": 1,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### Update Late Fee Rule
```http
PUT /api/settings/late-fee-rules/:id
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin*

**Request Body:** (Partial update supported)
```json
{
  "fee_amount": 75.00
}
```

**Response (200):**
```json
{
  "id": 1,
  "hours_from": 0,
  "hours_to": 24,
  "fee_amount": 75.00,
  "fee_type": "flat",
  "is_active": 1,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### Delete Late Fee Rule
```http
DELETE /api/settings/late-fee-rules/:id
Authorization: Bearer <token>
```
*Requires role: admin*

**Response (200):**
```json
{
  "ok": true
}
```

---

### Integrations Endpoints

#### List API Keys
```http
GET /api/integrations/api-keys
Authorization: Bearer <token>
```
*Requires role: admin*

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "n8n Integration",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_used_at": "2024-01-15T10:30:00.000Z"
  }
]
```

#### Create API Key
```http
POST /api/integrations/api-keys
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin*

**Request Body:**
```json
{
  "name": "n8n Integration"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "n8n Integration",
  "created_at": "2024-01-01T00:00:00.000Z",
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
}
```

**Important:** Save the `token` value immediately. It won't be shown again!

#### Delete API Key
```http
DELETE /api/integrations/api-keys/:id
Authorization: Bearer <token>
```
*Requires role: admin*

**Response (200):**
```json
{
  "ok": true
}
```

---

### Users Endpoints

#### List Users
```http
GET /api/users
Authorization: Bearer <token>
```
*Requires role: admin*

**Response (200):**
```json
[
  {
    "id": 1,
    "email": "admin@example.com",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create User
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json
```
*Requires role: admin*

**Request Body:**
```json
{
  "email": "staff@example.com",
  "password": "password123",
  "role": "staff"
}
```

**Response (201):**
```json
{
  "id": 2,
  "email": "staff@example.com",
  "role": "staff",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

### Reports Endpoints

#### Get Dashboard Statistics
```http
GET /api/reports
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "cars_total": 50,
  "available_today": 35,
  "bookings_today": 15,
  "active_rentals": 10,
  "pending_incidents": 3,
  "revenue_total": 25000.00,
  "utilization_percent": 20
}
```

#### Export Data to CSV
```http
GET /api/reports/export/:type
Authorization: Bearer <token>
```

**Path Parameters:**
- `type` - `bookings`, `cars`, or `incidents`

**Response (200):** CSV file with appropriate headers

#### Get Profit Report
```http
GET /api/reports/profit?car_id=1&from=2024-01-01&to=2024-12-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `car_id` (optional) - Filter by car
- `from` (optional) - Start date (YYYY-MM-DD)
- `to` (optional) - End date (YYYY-MM-DD)

**Response (200):**
```json
{
  "by_vehicle": [
    {
      "car_id": 1,
      "plate_number": "ABC123",
      "make": "Toyota",
      "model": "Camry",
      "revenue": 5000.00,
      "expenses": 500.00,
      "profit": 4500.00,
      "bookings_count": 20
    }
  ],
  "totals": {
    "revenue": 25000.00,
    "expenses": 3000.00,
    "profit": 22000.00
  },
  "by_category": [
    {
      "category": "maintenance",
      "total": 2000.00
    },
    {
      "category": "fuel",
      "total": 800.00
    }
  ]
}
```

---

### Audit Logs Endpoints

#### Get Audit Logs
```http
GET /api/audit?limit=100
Authorization: Bearer <token>
```
*Requires role: admin*

**Query Parameters:**
- `limit` (optional) - Number of logs to return (max 500, default 100)

**Response (200):**
```json
[
  {
    "id": 1,
    "action": "create",
    "entity_type": "booking",
    "entity_id": "1",
    "metadata_json": "{\"status\":\"confirmed\"}",
    "created_at": "2024-01-15T10:00:00.000Z",
    "user_email": "admin@example.com"
  }
]
```

---

### Notifications Endpoints

#### Get Notifications
```http
GET /api/notifications?unread=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `unread` (optional) - If `true`, only return unread notifications

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "type": "overdue",
    "title": "Overdue Booking",
    "message": "Booking #123 is overdue",
    "entity_type": "booking",
    "entity_id": "123",
    "is_read": false,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
]
```

#### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "count": 5
}
```

#### Mark Notification as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "type": "overdue",
  "title": "Overdue Booking",
  "message": "Booking #123 is overdue",
  "entity_type": "booking",
  "entity_id": "123",
  "is_read": true,
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

#### Mark All as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "ok": true
}
```

---

## Response Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Invalid or missing authentication |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource doesn't exist |
| 500  | Internal Server Error |

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

---

## Rate Limiting

The API uses rate limiting to prevent abuse. Default limits:
- 100 requests per 15 minutes per IP address

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp

---

## Example Usage

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

**Get all active cars:**
```bash
curl http://localhost:3010/api/cars?status=active \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create a new booking:**
```bash
curl -X POST http://localhost:3010/api/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "car_id": 1,
    "customer_name": "John Doe",
    "customer_phone": "+1234567890",
    "start_date": "2024-02-01",
    "end_date": "2024-02-05",
    "total_price": 200,
    "deposit": 50
  }'
```

### JavaScript/Node.js Examples

```javascript
// Using fetch API
const API_URL = 'http://localhost:3010';
const API_KEY = 'your-api-key-here';

async function getCars() {
  const response = await fetch(`${API_URL}/api/cars`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });
  const cars = await response.json();
  return cars;
}

async function createBooking(bookingData) {
  const response = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookingData)
  });
  const booking = await response.json();
  return booking;
}
```

---

## Additional Resources

- [OpenAPI/Swagger Specification](./openapi.json)
- [Database Schema Documentation](./DATABASE_SCHEMA.md)
- [n8n Integration Guide](./N8N_INTEGRATION.md)
- [Security Considerations](./SECURITY.md)
