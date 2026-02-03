# Documentation Summary - Rental Dashboard Backend

## Quick Reference

This document provides a quick overview of all available documentation for the Rental Dashboard Backend API.

---

## Documentation Files

### 1. API Documentation
**File:** `API_DOCUMENTATION.md` (31 KB)
**Purpose:** Complete REST API reference

**Contents:**
- Authentication methods (JWT and API Keys)
- All API endpoints with methods and parameters
- Request/response schemas
- Response codes
- Rate limiting information
- Example usage with cURL and JavaScript

**Use when:** You need to understand how to call specific API endpoints

---

### 2. Database Schema Documentation
**File:** `DATABASE_SCHEMA.md` (32 KB)
**Purpose:** Complete database structure and queries

**Contents:**
- Entity relationship diagram (ASCII)
- All tables with columns, types, and constraints
- Foreign key relationships
- Indexes for performance
- Common SQL query patterns
- Access patterns for n8n

**Use when:** You need to understand database structure or write custom queries

---

### 3. n8n Integration Guide
**File:** `N8N_INTEGRATION.md` (27 KB)
**Purpose:** Complete guide for n8n workflow automation

**Contents:**
- How to create API keys for n8n
- HTTP Request node configuration
- Direct SQLite access setup
- 5 complete example workflows:
  1. Check for overdue bookings
  2. Daily revenue report
  3. Expiring documents alert
  4. Check car availability (webhook)
  5. Create booking from external form
- Common patterns and troubleshooting

**Use when:** Setting up n8n automation workflows

---

### 4. Security Considerations
**File:** `SECURITY.md` (23 KB)
**Purpose:** Security best practices and guidelines

**Contents:**
- Authentication & authorization
- API security (CORS, rate limiting)
- Database security
- n8n integration security
- Input validation
- Data protection
- Deployment security (Docker, SSL/TLS)
- Security checklist

**Use when:** Securing your deployment or n8n integration

---

### 5. OpenAPI/Swagger Specification
**File:** `openapi.json` (61 KB)
**Purpose:** Machine-readable API specification

**Contents:**
- OpenAPI 3.0 specification
- All endpoints with schemas
- Can be imported into Swagger UI, Postman, Insomnia, etc.

**Use when:** You need to generate API docs or test with API tools

---

### 6. README
**File:** `README.md` (14 KB)
**Purpose:** Project overview and quick start guide

**Contents:**
- Project overview and tech stack
- Installation instructions
- API endpoints overview
- Authentication setup
- Environment variables
- Development setup
- Docker deployment
- Troubleshooting

**Use when:** Getting started with the project

---

## Quick Start for n8n Integration

### Step 1: Create API Key

```bash
# Login as admin
curl -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Use returned token to create API key
curl -X POST http://localhost:3010/api/integrations/api-keys \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"n8n Integration"}'

# Save the returned token!
```

### Step 2: Configure n8n HTTP Request Node

```
Method: GET
URL: http://localhost:3010/api/cars
Authentication: Header Auth
  - Header Name: Authorization
  - Header Value: Bearer YOUR_API_KEY
```

### Step 3: Use Example Workflows

See `N8N_INTEGRATION.md` for complete workflow JSON files you can import into n8n.

---

## API Endpoint Summary

| Category | Base Path | Endpoints |
|----------|-----------|-----------|
| Authentication | `/api/auth` | login, logout, me |
| Cars | `/api/cars` | CRUD operations, images, documents |
| Bookings | `/api/bookings` | CRUD operations, status updates |
| Customers | `/api/customers` | CRUD operations |
| Availability | `/api/availability` | Check car availability |
| Branches | `/api/branches` | List branches |
| Expenses | `/api/expenses` | CRUD operations |
| Maintenance | `/api/maintenance` | CRUD operations |
| Incidents | `/api/incidents` | CRUD operations, status updates |
| Settings | `/api/settings` | CRUD operations, late fee rules |
| Integrations | `/api/integrations/api-keys` | Manage API keys |
| Users | `/api/users` | CRUD operations |
| Reports | `/api/reports` | Statistics, exports, profit reports |
| Audit | `/api/audit` | View audit logs |
| Notifications | `/api/notifications` | CRUD operations, mark as read |

---

## Database Access Methods

### Option 1: HTTP API (Recommended for n8n)

**Advantages:**
- Secure API key authentication
- Built-in authorization
- Consistent with application logic

**Connection:**
```
Base URL: http://localhost:3010
Authentication: Bearer <api_key>
```

### Option 2: Direct SQLite Access

**Location:**
- Production: `/app/data/rental.db`
- Local: `data/rental.db`

**Connection:**
```bash
sqlite3 /app/data/rental.db
```

---

## Common n8n Workflow Patterns

### 1. Scheduled Checks
- Overdue bookings notification
- Expiring documents alert
- Daily revenue report

### 2. Webhook-Triggered Actions
- Check car availability
- Create booking from form
- Status updates

### 3. Data Synchronization
- Export data to external systems
- Import data from external systems
- Generate and send reports

---

## Security Checklist

### Initial Setup
- [ ] Generate strong JWT secret (`openssl rand -hex 32`)
- [ ] Set appropriate JWT expiration
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS
- [ ] Create n8n API key with `staff` role
- [ ] Enable audit logging

### Ongoing
- [ ] Review audit logs weekly
- [ ] Rotate API keys every 90 days
- [ ] Update dependencies monthly
- [ ] Test backup restoration quarterly

---

## Support Resources

### Documentation Files
- `README.md` - Getting started
- `API_DOCUMENTATION.md` - API reference
- `DATABASE_SCHEMA.md` - Database structure
- `N8N_INTEGRATION.md` - n8n workflows
- `SECURITY.md` - Security practices
- `openapi.json` - API specification

### Testing Tools
- Import `openapi.json` into:
  - Swagger UI
  - Postman
  - Insomnia
  - Hoppscotch

### Quick Test Commands

```bash
# Health check
curl http://localhost:3010/api/reports

# Get all cars (requires auth)
curl http://localhost:3010/api/cars \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check availability
curl "http://localhost:3010/api/availability?start=2024-02-15&end=2024-02-20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## File Locations

### Backend Directory Structure
```
/root/rental-dashboard/backend/
├── API_DOCUMENTATION.md        # API reference (31 KB)
├── DATABASE_SCHEMA.md           # Database docs (32 KB)
├── N8N_INTEGRATION.md         # n8n guide (27 KB)
├── SECURITY.md                # Security practices (23 KB)
├── README.md                  # Project overview (14 KB)
├── openapi.json               # API spec (61 KB)
├── DOCUMENTATION_INDEX.md      # This file
├── src/
│   ├── routes/               # API route handlers
│   ├── middleware/           # Auth, error handling
│   ├── services/             # Business logic
│   ├── db.js                # Database connection
│   └── index.js             # Application entry
├── migrations/               # Database migrations
├── schema.sqlite.sql         # Initial schema
├── uploads/                  # File uploads
└── data/                     # Database file (rental.db)
```

### Docker Deployment
```
/backend
  ├─ data/rental.db          # SQLite database
  └─ uploads/                # Uploaded files
      ├─ cars/               # Car images
      ├─ vehicles/           # Vehicle documents
      └─ incidents/          # Incident photos
```

---

## Authentication Methods Comparison

| Method | Use Case | Pros | Cons |
|--------|-----------|-------|-------|
| JWT Token | Web dashboard, staff users | User-specific, can be revoked | Expires, needs refresh |
| API Key | External integrations (n8n) | Long-lived, tracked | If leaked, requires rotation |

**Recommendation:** Use API keys for n8n integrations, JWT tokens for human users.

---

## Quick Reference: Key n8n Workflows

### Workflow 1: Overdue Bookings Alert
- **Purpose:** Notify when bookings are overdue
- **Schedule:** Daily at 9:00 AM
- **Endpoints:** `/api/bookings`, `/api/customers`
- **Output:** Email notifications

### Workflow 2: Daily Revenue Report
- **Purpose:** Summarize revenue from completed bookings
- **Schedule:** Daily at 8:00 AM
- **Endpoints:** `/api/bookings`
- **Output:** Email to management

### Workflow 3: Expiring Documents Alert
- **Purpose:** Alert when vehicle documents are expiring
- **Schedule:** Daily at 7:00 AM
- **Endpoints:** `/api/cars`, `/api/cars/:id/documents`
- **Output:** Email to management

### Workflow 4: Car Availability Webhook
- **Purpose:** External systems can check availability
- **Trigger:** Webhook POST
- **Endpoints:** `/api/availability`
- **Output:** JSON response with available cars

### Workflow 5: Create Booking from Form
- **Purpose:** Receive booking requests and create bookings
- **Trigger:** Webhook POST
- **Endpoints:** `/api/cars`, `/api/bookings`
- **Output:** Booking confirmation email

---

## Troubleshooting Quick Fixes

| Problem | Solution |
|----------|----------|
| 401 Unauthorized | Check API key or JWT token is valid |
| 403 Forbidden | Verify user has required role |
| 404 Not Found | Check endpoint path and ID |
| 429 Too Many Requests | Wait or increase rate limit |
| CORS Error | Check FRONTEND_URL configuration |
| Database Locked | Restart application or enable WAL mode |

---

## Next Steps

1. **Read the README.md** to understand the project
2. **Review API_DOCUMENTATION.md** to learn available endpoints
3. **Follow N8N_INTEGRATION.md** to set up automation
4. **Implement SECURITY.md** recommendations before production
5. **Use DATABASE_SCHEMA.md** for custom queries if needed

---

## Contact & Support

For questions or issues:
1. Check documentation files first
2. Review API documentation
3. Test endpoints with cURL or Postman
4. Check application logs

---

**Documentation Last Updated:** February 3, 2026
**API Version:** 1.0.0
