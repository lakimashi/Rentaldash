# n8n Integration Guide for Rental Dashboard

## Overview

This guide provides comprehensive instructions for connecting n8n to the Rental Dashboard backend API. n8n can be used to automate workflows such as:

- Sending automated notifications for overdue bookings
- Generating daily/weekly reports
- Syncing data with external systems
- Creating custom booking workflows
- Monitoring expiring documents
- Automated customer follow-ups

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Authentication Setup](#authentication-setup)
3. [Connection Methods](#connection-methods)
4. [Example Workflows](#example-workflows)
5. [n8n Workflow Templates](#n8n-workflow-templates)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before integrating n8n with the Rental Dashboard, ensure you have:

- ✅ Rental Dashboard backend running and accessible
- ✅ Admin access to the Rental Dashboard
- ✅ n8n instance (self-hosted or cloud)
- ✅ Network connectivity between n8n and Rental Dashboard backend

**Rental Dashboard Backend URL:** `http://localhost:3010` (or your deployed URL)

---

## Authentication Setup

### Step 1: Create API Key

Use the Rental Dashboard admin panel or API to create an API key for n8n:

**Option A: Via API**
```bash
# First, login as admin to get JWT token
curl -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_admin_password"
  }'

# Use the returned token to create API key
curl -X POST http://localhost:3010/api/integrations/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "n8n Integration"
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "n8n Integration",
  "created_at": "2024-01-15T10:00:00.000Z",
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
}
```

**⚠️ IMPORTANT:** Save the token immediately! It won't be shown again.

**Option B: Via Admin Panel (if available)**
1. Login to admin panel
2. Navigate to Settings → Integrations
3. Click "Create API Key"
4. Enter name "n8n Integration"
5. Copy the generated token

---

## Connection Methods

### Option 1: HTTP Request Node (Recommended)

Use n8n's built-in HTTP Request node to call the Rental Dashboard API.

**Configuration:**

1. Add an **HTTP Request** node
2. Set **Method:** `GET`, `POST`, `PUT`, or `DELETE`
3. Set **URL:** `http://localhost:3010/api/...`
4. Set **Authentication:** `Generic Credential Type` → `Header Auth`
5. Set **Header Name:** `Authorization`
6. Set **Header Value:** `Bearer YOUR_API_KEY`

**Example Configuration:**

```
Node: HTTP Request
Method: GET
URL: http://localhost:3010/api/cars
Authentication: Header Auth
  - Header Name: Authorization
  - Header Value: Bearer a1b2c3d4e5f6g7h8i9j0...
```

### Option 2: Direct SQLite Access (Advanced)

For direct database access, use n8n's SQLite node.

**Configuration:**

1. Add an **SQLite** node
2. Set **Operation:** `Execute Query`
3. Set **File Path:** `/app/data/rental.db` (or your database path)
4. Set **Query:** Your SQL query

**⚠️ Security Warning:** Direct database access bypasses the API's authorization and validation logic. Use with caution and ensure proper file permissions.

---

## Example Workflows

### Workflow 1: Check for Overdue Bookings

**Purpose:** Check daily for overdue bookings and send notifications.

**Steps:**
1. Get active/reserved bookings with end_date < today
2. For each overdue booking, get customer and car details
3. Send notification email/SMS

**n8n Workflow JSON:**

```json
{
  "name": "Check Overdue Bookings",
  "nodes": [
    {
      "parameters": {
        "method": "GET",
        "url": "http://localhost:3010/api/bookings",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "status",
              "value": "active"
            }
          ]
        }
      },
      "name": "Get Active Bookings",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [250, 300],
      "credentials": {
        "httpHeaderAuth": {
          "id": "1",
          "name": "Rental Dashboard API"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "c1f4a2e3-d1b4-4e3f-a8b5-6c7d8e9f0a1b",
              "leftValue": "={{ $json.end_date }}",
              "rightValue": "={{ $now.format('YYYY-MM-DD') }}",
              "operator": {
                "type": "date",
                "operation": "before"
              }
            }
          ],
          "combinator": "and"
        }
      },
      "name": "Filter Overdue Bookings",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "=http://localhost:3010/api/customers/{{ $json.customer_id }}"
      },
      "name": "Get Customer Details",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "subject": "=Overdue Booking: {{ $('Get Active Bookings').item.json.plate_number }}",
        "email": "={{ $json.email }}",
        "message": "=Your rental of {{ $('Get Active Bookings').item.json.make }} {{ $('Get Active Bookings').item.json.model }} was due on {{ $('Get Active Bookings').item.json.end_date }}. Please return the vehicle immediately."
      },
      "name": "Send Notification Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [850, 300]
    }
  ],
  "connections": {
    "Get Active Bookings": {
      "main": [
        [
          {
            "node": "Filter Overdue Bookings",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter Overdue Bookings": {
      "main": [
        [
          {
            "node": "Get Customer Details",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get Customer Details": {
      "main": [
        [
          {
            "node": "Send Notification Email",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

**Schedule:** Run daily at 9:00 AM
```json
{
  "triggerTimes": [{ "mode": "everyDay", "value": "09:00" }]
}
```

---

### Workflow 2: Daily Revenue Report

**Purpose:** Generate and send daily revenue report.

**Steps:**
1. Get bookings completed yesterday
2. Calculate total revenue
3. Format report
4. Send email to management

**n8n Workflow JSON:**

```json
{
  "name": "Daily Revenue Report",
  "nodes": [
    {
      "parameters": {
        "method": "GET",
        "url": "http://localhost:3010/api/bookings",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "status",
              "value": "completed"
            },
            {
              "name": "from",
              "value": "={{ $now.minus({ days: 1 }).format('YYYY-MM-DD') }}"
            },
            {
              "name": "to",
              "value": "={{ $now.minus({ days: 1 }).format('YYYY-MM-DD') }}"
            }
          ]
        }
      },
      "name": "Get Yesterday's Completed Bookings",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "operation": "aggregateItems",
        "aggregate": "aggregateAllItemData",
        "options": {}
      },
      "name": "Calculate Total Revenue",
      "type": "n8n-nodes-base.aggregate",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "jsCode": "// Calculate totals\nconst items = $input.all();\nconst bookings = items[0].json.data;\n\nlet totalRevenue = 0;\nlet totalDeposit = 0;\nlet bookingCount = bookings.length;\n\nbookings.forEach(b => {\n  totalRevenue += b.total_price;\n  totalDeposit += b.deposit;\n});\n\nreturn [{\n  json: {\n    date: $now.minus({ days: 1 }).format('YYYY-MM-DD'),\n    booking_count: bookingCount,\n    total_revenue: totalRevenue,\n    total_deposit: totalDeposit,\n    net_revenue: totalRevenue - totalDeposit\n  }\n}];"
      },
      "name": "Format Report",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "subject": "=Daily Revenue Report - {{ $json.date }}",
        "email": "management@rentalagency.com",
        "message": "=Daily Revenue Report for {{ $json.date }}:\n\nBookings Completed: {{ $json.booking_count }}\nTotal Revenue: ${{ $json.total_revenue }}\nTotal Deposits: ${{ $json.total_deposit }}\nNet Revenue: ${{ $json.net_revenue }}"
      },
      "name": "Send Report Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [850, 300]
    }
  ],
  "connections": {
    "Get Yesterday's Completed Bookings": {
      "main": [
        [
          {
            "node": "Calculate Total Revenue",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Calculate Total Revenue": {
      "main": [
        [
          {
            "node": "Format Report",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Report": {
      "main": [
        [
          {
            "node": "Send Report Email",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

**Schedule:** Run daily at 8:00 AM
```json
{
  "triggerTimes": [{ "mode": "everyDay", "value": "08:00" }]
}
```

---

### Workflow 3: Expiring Documents Alert

**Purpose:** Check for expiring registration/insurance documents and send alerts.

**Steps:**
1. Get all cars with documents expiring within 30 days
2. Group by car and document type
3. Send alert to management

**n8n Workflow JSON:**

```json
{
  "name": "Expiring Documents Alert",
  "nodes": [
    {
      "parameters": {
        "method": "GET",
        "url": "http://localhost:3010/api/cars",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth"
      },
      "name": "Get All Cars",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "mode": "combine",
        "combineBy": "combineAll"
      },
      "name": "Split into Items",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "=http://localhost:3010/api/cars/{{ $json.id }}/documents"
      },
      "name": "Get Car Documents",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "c1f4a2e3-d1b4-4e3f-a8b5-6c7d8e9f0a1b",
              "leftValue": "={{ $json.expiry_date }}",
              "rightValue": "={{ $now.plus({ days: 30 }).format('YYYY-MM-DD') }}",
              "operator": {
                "type": "date",
                "operation": "before"
              }
            }
          ],
          "combinator": "and"
        }
      },
      "name": "Filter Expiring Documents",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [850, 300]
    },
    {
      "parameters": {
        "jsCode": "// Collect expiring documents\nconst cars = $('Get All Cars').all();\nconst allDocs = [];\n\ncars.forEach(car => {\n  const docs = $(`Get Car Documents_${car.json.id}`).all();\n  if (docs) {\n    docs.forEach(doc => {\n      allDocs.push({\n        car: car.json,\n        document: doc.json\n      });\n    });\n  }\n});\n\nif (allDocs.length === 0) {\n  return [{ json: { message: 'No expiring documents found' } }];\n}\n\n// Format message\nlet message = 'Expiring Documents Alert:\\n\\n';\nallDocs.forEach(item => {\n  const daysUntilExpiry = Math.ceil((new Date(item.document.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));\n  message += `${item.car.plate_number} - ${item.car.make} ${item.car.model}\\n`;\n  message += `  ${item.document.document_type}: ${item.document.expiry_date} (${daysUntilExpiry} days)\\n`;\n  message += `  ${item.document.title}\\n\\n`;\n});\n\nreturn [{ json: { message, count: allDocs.length } }];"
      },
      "name": "Format Alert",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "subject": "=Expiring Documents Alert ({{ $json.count }} items)",
        "email": "management@rentalagency.com",
        "message": "={{ $json.message }}"
      },
      "name": "Send Alert Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [1250, 300]
    }
  ],
  "connections": {
    "Get All Cars": {
      "main": [
        [
          {
            "node": "Split into Items",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Split into Items": {
      "main": [
        [
          {
            "node": "Get Car Documents",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get Car Documents": {
      "main": [
        [
          {
            "node": "Filter Expiring Documents",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter Expiring Documents": {
      "main": [
        [
          {
            "node": "Format Alert",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Alert": {
      "main": [
        [
          {
            "node": "Send Alert Email",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

**Schedule:** Run daily at 7:00 AM
```json
{
  "triggerTimes": [{ "mode": "everyDay", "value": "07:00" }]
}
```

---

### Workflow 4: Check Car Availability

**Purpose:** Webhook to check car availability for external systems.

**Steps:**
1. Receive webhook with dates and car class
2. Call availability API
3. Return available cars

**n8n Workflow JSON:**

```json
{
  "name": "Check Car Availability",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "check-availability",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "check-availability-webhook"
    },
    {
      "parameters": {
        "method": "GET",
        "url": "=http://localhost:3010/api/availability",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "start",
              "value": "={{ $json.body.start_date }}"
            },
            {
              "name": "end",
              "value": "={{ $json.body.end_date }}"
            },
            {
              "name": "class",
              "value": "={{ $json.body.car_class }}"
            }
          ]
        }
      },
      "name": "Check Availability API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify($('Check Availability API').item.json) }}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Check Availability API",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check Availability API": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

**Webhook URL Example:**
```
POST https://your-n8n-instance.com/webhook/check-availability
Content-Type: application/json

{
  "start_date": "2024-02-15",
  "end_date": "2024-02-20",
  "car_class": "SUV"
}
```

---

### Workflow 5: Create Booking from External Form

**Purpose:** Receive booking request from external form and create booking.

**Steps:**
1. Receive webhook with booking details
2. Validate data
3. Call booking creation API
4. Send confirmation email

**n8n Workflow JSON:**

```json
{
  "name": "Create Booking from Form",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "create-booking",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "create-booking-webhook"
    },
    {
      "parameters": {
        "jsCode": "// Validate required fields\nconst body = $input.item.json.body;\nconst required = ['car_id', 'customer_name', 'customer_email', 'start_date', 'end_date'];\n\nfor (const field of required) {\n  if (!body[field]) {\n    throw new Error(`Missing required field: ${field}`);\n  }\n}\n\n// Calculate days and price\nconst startDate = new Date(body.start_date);\nconst endDate = new Date(body.end_date);\nconst days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));\n\nif (days <= 0) {\n  throw new Error('End date must be after start date');\n}\n\n// Get car daily rate\nconst carResponse = await this.helpers.httpRequest({\n  method: 'GET',\n  url: `http://localhost:3010/api/cars/${body.car_id}`,\n  headers: { Authorization: `Bearer ${$env.API_KEY}` }\n});\n\nconst dailyRate = carResponse.base_daily_rate;\nconst totalPrice = dailyRate * days;\nconst deposit = dailyRate; // 1 day as deposit\n\nreturn [{\n  json: {\n    ...body,\n    total_price: totalPrice,\n    deposit: deposit,\n    days: days\n  }\n}];"
      },
      "name": "Validate and Calculate Price",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://localhost:3010/api/bookings",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "car_id",
              "value": "={{ $json.car_id }}"
            },
            {
              "name": "customer_name",
              "value": "={{ $json.customer_name }}"
            },
            {
              "name": "customer_phone",
              "value": "={{ $json.customer_phone }}"
            },
            {
              "name": "start_date",
              "value": "={{ $json.start_date }}"
            },
            {
              "name": "end_date",
              "value": "={{ $json.end_date }}"
            },
            {
              "name": "total_price",
              "value": "={{ $json.total_price }}"
            },
            {
              "name": "deposit",
              "value": "={{ $json.deposit }}"
            },
            {
              "name": "status",
              "value": "confirmed"
            }
          ]
        }
      },
      "name": "Create Booking",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "subject": "=Booking Confirmation - {{ $('Validate and Calculate Price').item.json.make }} {{ $('Validate and Calculate Price').item.json.model }}",
        "email": "={{ $('Validate and Calculate Price').item.json.customer_email }}",
        "message": "=Your booking has been confirmed!\\n\\nBooking ID: {{ $json.id }}\\nVehicle: {{ $('Validate and Calculate Price').item.json.make }} {{ $('Validate and Calculate Price').item.json.model }} ({{ $('Validate and Calculate Price').item.json.plate_number }})\\nFrom: {{ $('Validate and Calculate Price').item.json.start_date }}\\nTo: {{ $('Validate and Calculate Price').item.json.end_date }}\\nTotal: ${{ $json.total_price }}\\nDeposit: ${{ $json.deposit }}\\n\\nThank you for your booking!"
      },
      "name": "Send Confirmation Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [850, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ success: true, booking_id: $('Create Booking').item.json.id }) }}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Validate and Calculate Price",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Validate and Calculate Price": {
      "main": [
        [
          {
            "node": "Create Booking",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Create Booking": {
      "main": [
        [
          {
            "node": "Send Confirmation Email",
            "type": "main",
            "index": 0
          },
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

**Webhook URL Example:**
```
POST https://your-n8n-instance.com/webhook/create-booking
Content-Type: application/json

{
  "car_id": 1,
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+1234567890",
  "start_date": "2024-02-15",
  "end_date": "2024-02-20"
}
```

---

## Common Patterns

### Pattern 1: Pagination

For large datasets, use pagination:

```json
{
  "parameters": {
    "method": "GET",
    "url": "http://localhost:3010/api/bookings",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth"
  }
}
```

The API doesn't currently support pagination parameters. For large datasets, consider:
- Filtering by date ranges
- Direct database access with LIMIT/OFFSET

### Pattern 2: Error Handling

Always include error handling in your workflows:

```json
{
  "parameters": {
    "continueOnFail": true
  }
}
```

Add an error node to log failures:

```json
{
  "name": "Handle Errors",
  "type": "n8n-nodes-base.noOp",
  "position": [650, 500]
}
```

### Pattern 3: Data Transformation

Use the Code node to transform API responses:

```javascript
// Example: Calculate days between dates
const startDate = new Date($json.start_date);
const endDate = new Date($json.end_date);
const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

return [{
  json: {
    ...$json,
    rental_days: days,
    daily_rate: $json.total_price / days
  }
}];
```

---

## Direct SQLite Access (Advanced)

For complex queries or direct database access:

### SQLite Node Configuration

```json
{
  "name": "Query Database",
  "type": "n8n-nodes-base.sqlite",
  "parameters": {
    "operation": "executeQuery",
    "file": "/app/data/rental.db",
    "query": "SELECT b.*, c.plate_number FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.status = 'active' AND b.end_date < date('now')"
  }
}
```

### Example Queries

**Get Available Cars for Date Range:**
```sql
SELECT c.* FROM cars c
WHERE c.status = 'active'
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

**Get Revenue by Month:**
```sql
SELECT 
  strftime('%Y-%m', start_date) as month,
  COUNT(*) as booking_count,
  SUM(total_price) as total_revenue,
  SUM(deposit) as total_deposits
FROM bookings
WHERE status = 'completed'
GROUP BY month
ORDER BY month DESC;
```

**Get Top Performing Cars:**
```sql
SELECT 
  c.id,
  c.plate_number,
  c.make,
  c.model,
  COUNT(b.id) as total_bookings,
  SUM(b.total_price) as total_revenue
FROM cars c
LEFT JOIN bookings b ON c.id = b.car_id AND b.status = 'completed'
WHERE c.status = 'active'
GROUP BY c.id
ORDER BY total_revenue DESC
LIMIT 10;
```

---

## Troubleshooting

### Issue 1: Authentication Error (401)

**Problem:** `{"error": "Unauthorized"}`

**Solutions:**
1. Verify API key is correct
2. Check Authorization header format: `Bearer YOUR_TOKEN`
3. Ensure API key is not deleted or expired

### Issue 2: Connection Refused

**Problem:** Cannot connect to backend

**Solutions:**
1. Verify backend is running: `docker ps` or `ps aux | grep node`
2. Check backend URL is correct
3. Test connectivity: `curl http://localhost:3010/api/cars`
4. Check firewall rules
5. Verify n8n can reach the backend (network if using Docker)

### Issue 3: CORS Errors

**Problem:** Browser CORS errors when testing

**Solutions:**
1. CORS is configured on the backend for production URL
2. For testing, the backend allows `localhost:5173` (frontend dev server)
3. Use n8n's HTTP Request node (not browser) for workflows

### Issue 4: Missing Data

**Problem:** API returns empty arrays

**Solutions:**
1. Verify query parameters are correct
2. Check database has data
3. Verify date formats (YYYY-MM-DD)
4. Check status values match expected enums

### Issue 5: Rate Limiting

**Problem:** Too many requests

**Solutions:**
1. Default limit: 100 requests per 15 minutes per IP
2. Implement caching in n8n
3. Use batch operations when possible
4. Consider using direct SQLite for bulk reads

---

## Best Practices

1. **Security**
   - Never hardcode API keys in workflow JSON
   - Use n8n credentials store
   - Rotate API keys periodically
   - Use HTTPS in production

2. **Performance**
   - Cache frequently accessed data
   - Use appropriate query filters
   - Consider direct SQLite for complex queries
   - Implement pagination for large datasets

3. **Reliability**
   - Add error handling nodes
   - Implement retry logic for transient failures
   - Log all API interactions
   - Set appropriate timeouts

4. **Monitoring**
   - Set up workflow execution monitoring
   - Track API response times
   - Monitor error rates
   - Set up alerts for failed workflows

---

## Additional Resources

- [Rental Dashboard API Documentation](./API_DOCUMENTATION.md)
- [Database Schema Documentation](./DATABASE_SCHEMA.md)
- [OpenAPI/Swagger Specification](./openapi.json)
- [Security Considerations](./SECURITY.md)

---

## Support

For issues or questions:
1. Check the API documentation
2. Review database schema
3. Test API endpoints directly with curl
4. Enable debug logging in n8n
5. Check backend logs: `docker logs <backend-container>`
