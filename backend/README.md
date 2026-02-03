# Rental Dashboard Backend API

## Overview

The Rental Dashboard Backend is a RESTful API built with Node.js, Express, and SQLite for managing car rental operations. It provides comprehensive endpoints for managing cars, bookings, customers, expenses, maintenance, incidents, and more.

**Tech Stack:**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** SQLite 3 with WAL mode
- **Authentication:** JWT (JSON Web Tokens) + API Keys
- **Validation:** Zod
- **File Uploads:** Multer

---

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd rental-dashboard/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Initialize database
npm run db:migrate

# (Optional) Seed demo data
npm run db:seed

# Start development server
npm run dev
```

### Production Deployment

```bash
# Using Docker Compose
cd deploy
docker-compose up -d

# Or build and run manually
npm start
```

---

## Documentation

This backend includes comprehensive documentation for developers and integrators:

| Document | Description |
|----------|-------------|
| [API Documentation](./API_DOCUMENTATION.md) | Complete REST API reference with all endpoints, methods, request/response schemas, and examples |
| [Database Schema](./DATABASE_SCHEMA.md) | Full database schema documentation with tables, relationships, indexes, and example queries |
| [n8n Integration Guide](./N8N_INTEGRATION.md) | Comprehensive guide for integrating n8n workflow automation with example workflows |
| [Security Considerations](./SECURITY.md) | Security best practices, authentication, authorization, and deployment security |
| [OpenAPI/Swagger Spec](./openapi.json) | OpenAPI 3.0 specification for API documentation tools |

---

## API Endpoints Overview

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Cars
- `GET /api/cars` - List all cars
- `GET /api/cars/:id` - Get car by ID
- `POST /api/cars` - Create new car (admin, staff)
- `PUT /api/cars/:id` - Update car (admin, staff)
- `DELETE /api/cars/:id` - Archive car (admin, staff)
- `POST /api/cars/:id/images` - Upload car images
- `GET /api/cars/:id/documents` - Get car documents
- `POST /api/cars/:id/documents` - Upload car document
- `DELETE /api/cars/documents/:docId` - Delete document

### Bookings
- `GET /api/bookings` - List all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create new booking (admin, staff)
- `PUT /api/bookings/:id` - Update booking (admin, staff)
- `PUT /api/bookings/:id/status` - Update booking status (admin, staff)

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer with booking history
- `POST /api/customers` - Create customer (admin, staff)
- `PUT /api/customers/:id` - Update customer (admin, staff)
- `DELETE /api/customers/:id` - Delete customer (admin only)

### Availability
- `GET /api/availability` - Check car availability for dates

### Branches
- `GET /api/branches` - List all branches

### Expenses
- `GET /api/expenses` - List expenses
- `GET /api/expenses/:id` - Get expense by ID
- `POST /api/expenses` - Create expense (admin, staff)
- `PUT /api/expenses/:id` - Update expense (admin, staff)
- `DELETE /api/expenses/:id` - Delete expense (admin only)

### Maintenance
- `GET /api/maintenance` - List maintenance blocks
- `POST /api/maintenance` - Create maintenance block (admin, staff)

### Incidents
- `GET /api/incidents` - List incidents
- `GET /api/incidents/:id` - Get incident by ID
- `POST /api/incidents` - Create incident (admin, staff)
- `PUT /api/incidents/:id/status` - Update incident status (admin, staff)

### Settings
- `GET /api/settings` - Get agency settings
- `PUT /api/settings` - Update settings (admin only)
- `GET /api/settings/late-fee-rules` - Get late fee rules (admin only)
- `POST /api/settings/late-fee-rules` - Create late fee rule (admin only)
- `PUT /api/settings/late-fee-rules/:id` - Update late fee rule (admin only)
- `DELETE /api/settings/late-fee-rules/:id` - Delete late fee rule (admin only)

### Integrations (API Keys)
- `GET /api/integrations/api-keys` - List API keys (admin only)
- `POST /api/integrations/api-keys` - Create API key (admin only)
- `DELETE /api/integrations/api-keys/:id` - Delete API key (admin only)

### Users
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)

### Reports
- `GET /api/reports` - Get dashboard statistics
- `GET /api/reports/export/:type` - Export data to CSV
- `GET /api/reports/profit` - Get profit report

### Audit Logs
- `GET /api/audit` - Get audit logs (admin only)

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read

---

## Authentication

### JWT Token Authentication

Most endpoints require authentication via JWT token:

1. Login to get token:
   ```bash
   curl -X POST http://localhost:3010/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password"}'
   ```

2. Include token in requests:
   ```bash
   curl http://localhost:3010/api/cars \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### API Key Authentication

For external integrations (like n8n):

1. Create API key (admin only):
   ```bash
   curl -X POST http://localhost:3010/api/integrations/api-keys \
     -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"n8n Integration"}'
   ```

2. Use API key in requests:
   ```bash
   curl http://localhost:3010/api/cars \
     -H "Authorization: Bearer YOUR_API_KEY"
   # OR
   curl http://localhost:3010/api/cars \
     -H "x-api-key: YOUR_API_KEY"
   ```

### Role-Based Access Control

| Role | Description |
|------|-------------|
| `admin` | Full access to all endpoints |
| `staff` | Access to most endpoints, cannot manage users/API keys |
| `readonly` | Read-only access to data |

---

## Environment Variables

Create a `.env` file in the backend directory:

```bash
# Server Configuration
PORT=3010
NODE_ENV=production

# Database
SQLITE_PATH=/app/data/rental.db
# Or use relative path for local development: ./data/rental.db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# File Uploads
UPLOAD_DIR=/app/uploads

# (Optional) Audit Logging Webhook
AUDIT_WEBHOOK_URL=https://your-logging-service.com/webhook
```

**Generate secure JWT secret:**
```bash
openssl rand -hex 32
```

---

## Database

### Schema

The database uses SQLite with the following main tables:
- `users` - User accounts
- `branches` - Agency locations
- `cars` - Vehicle inventory
- `bookings` - Rental bookings
- `customers` - Customer records
- `expenses` - Vehicle expenses
- `maintenance_blocks` - Maintenance schedules
- `incidents` - Incident reports
- `settings` - Agency settings
- `notifications` - User notifications
- `audit_logs` - Audit trail
- And more...

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema documentation.

### Migrations

```bash
# Initialize database
npm run db:migrate

# Apply new migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

### Direct Database Access

For debugging or complex queries:

```bash
# Connect to database
sqlite3 /app/data/rental.db

# Or with Docker
docker exec -it <backend-container> sqlite3 /app/data/rental.db

# Example queries
.tables
.schema cars
SELECT * FROM bookings WHERE status = 'active';
```

---

## File Uploads

The API supports file uploads for:
- Car images (max 10 images, 5MB each)
- Vehicle documents (max 10MB)
- Incident images (max 5 images, 5MB each)

Uploads are stored in the `uploads/` directory:
- `uploads/cars/` - Car images
- `uploads/vehicles/` - Vehicle documents
- `uploads/incidents/` - Incident photos

Files are accessible via:
```
http://localhost:3010/uploads/cars/<filename>
```

---

## Development

### Project Structure

```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic services
│   ├── db.js           # Database connection
│   └── index.js        # Application entry point
├── migrations/          # Database migrations
├── scripts/            # Utility scripts
├── schema.sqlite.sql    # Database schema
├── uploads/            # Uploaded files
├── data/               # Database file
└── docs/              # Additional documentation
```

### Available Scripts

```bash
# Start production server
npm start

# Start development server with hot reload
npm run dev

# Run database migration
npm run db:migrate

# Seed demo data
npm run db:seed
```

### Adding New Routes

1. Create route file in `src/routes/`:
   ```javascript
   // src/routes/example.js
   import { Router } from 'express';
   import pool from '../db.js';
   import { authMiddleware } from '../middleware/auth.js';

   export const exampleRouter = Router();
   exampleRouter.use(authMiddleware);

   exampleRouter.get('/', async (req, res, next) => {
     const r = await pool.query('SELECT * FROM example');
     res.json(r.rows);
   });
   ```

2. Register in `src/index.js`:
   ```javascript
   import { exampleRouter } from './routes/example.js';
   app.use('/api/example', exampleRouter);
   ```

---

## Testing

### Manual Testing with cURL

```bash
# Get all cars
curl http://localhost:3010/api/cars \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a booking
curl -X POST http://localhost:3010/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "car_id": 1,
    "customer_name": "John Doe",
    "start_date": "2024-02-15",
    "end_date": "2024-02-20",
    "total_price": 250,
    "deposit": 50
  }'

# Check availability
curl "http://localhost:3010/api/availability?start=2024-02-15&end=2024-02-20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using API Documentation Tools

Import [openapi.json](./openapi.json) into:
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Postman](https://www.postman.com/) (Import → API → OpenAPI)
- [Insomnia](https://insomnia.rest/)
- [Hoppscotch](https://hoppscotch.io/)

---

## Docker Deployment

### Using Docker Compose

```bash
# Start all services
cd deploy
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Build Docker Image

```bash
# Build image
docker build -t rental-dashboard-backend .

# Run container
docker run -p 3010:3010 \
  -e JWT_SECRET=your-secret \
  -e SQLITE_PATH=/app/data/rental.db \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  rental-dashboard-backend
```

---

## n8n Integration

For detailed n8n integration instructions, see [N8N_INTEGRATION.md](./N8N_INTEGRATION.md).

Quick setup:

1. Create API key for n8n
2. Add HTTP Request node to n8n workflow
3. Set authentication: `Header Auth`
4. Set header: `Authorization: Bearer YOUR_API_KEY`
5. Call API endpoints

Example n8n HTTP Request node:
```json
{
  "method": "GET",
  "url": "http://backend:3010/api/cars",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  }
}
```

---

## Security

For comprehensive security guidelines, see [SECURITY.md](./SECURITY.md).

Key security points:
- Use strong JWT secrets (generate with `openssl rand -hex 32`)
- Enable HTTPS in production
- Implement rate limiting
- Use CORS properly
- Never hardcode credentials
- Rotate API keys regularly
- Enable audit logging
- Keep dependencies updated

---

## Troubleshooting

### Common Issues

**1. Database Locked Error**
```bash
# Enable WAL mode (should be enabled by default)
sqlite3 data/rental.db "PRAGMA journal_mode=WAL;"

# Or restart the application
```

**2. CORS Errors**
```bash
# Check FRONTEND_URL in .env
# Ensure it matches your frontend URL exactly
```

**3. Authentication Failures**
```bash
# Verify JWT_SECRET is set
# Check token expiration
# Ensure user exists in database
```

**4. Port Already in Use**
```bash
# Find process using port
lsof -i :3010

# Kill process
kill -9 <PID>

# Or change PORT in .env
```

---

## API Rate Limiting

Default rate limiting:
- 100 requests per 15 minutes per IP address
- API keys may have higher limits

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp

---

## Monitoring & Logging

### Application Logs

```bash
# Docker logs
docker-compose logs -f backend

# Or if running directly
npm start  # Logs go to stdout/stderr
```

### Audit Logs

All data modifications are logged in the `audit_logs` table:

```sql
SELECT * FROM audit_logs 
WHERE user_id = 1 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Support & Contributing

### Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Database Schema](./DATABASE_SCHEMA.md) - Database structure and queries
- [n8n Integration](./N8N_INTEGRATION.md) - n8n workflows and automation
- [Security](./SECURITY.md) - Security best practices
- [OpenAPI Spec](./openapi.json) - API specification for tools

### Getting Help

1. Check the documentation above
2. Review the API endpoints
3. Test endpoints manually with cURL
4. Check application logs

---

## License

[Your License Here]

---

## Version History

- **1.0.0** - Initial release with core features
  - Cars, bookings, customers management
  - Expenses, maintenance, incidents
  - API key authentication
  - Audit logging
  - n8n integration support
