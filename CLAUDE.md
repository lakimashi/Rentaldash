# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A rental agency web dashboard with a Node.js/Express backend and React/Vite frontend. Manages cars, bookings, availability, incidents, maintenance, customers, expenses, and includes API key authentication for external integrations (e.g., AI booking chatbots).

## Development Commands

### Backend (Node 18+)
```bash
cd backend
cp .env.example .env        # Configure environment variables
npm install                  # Install dependencies
npm run db:migrate           # Apply schema (SQLite)
npm run db:seed              # Seed database with demo data
npm run dev                  # Start dev server with --watch (port 3001)
```

### Frontend (React + Vite)
```bash
cd frontend
npm install                  # Install dependencies
npm run dev                  # Start Vite dev server (port 5173)
npm run build                # Production build
```

### Docker (Optional)
```bash
bash deploy/setup.sh          # Full setup and deployment
```

### Database
- **Default:** SQLite at `backend/data/rental.db`
- **Path:** Configure via `SQLITE_PATH` or `DATABASE_URL` in `backend/.env`
- **Schema:** `backend/schema.sql` (PostgreSQL syntax, compatible via adapter)
- **Migrations:** Run `npm run db:migrate` after schema changes
- **Reset:** Delete `backend/data/rental.db` and re-run migrate/seed

## Architecture

### Backend Structure
- `src/index.js` - Entry point, mounts all route handlers
- `src/db.js` - Database adapter wrapping `better-sqlite3` with PostgreSQL compatibility layer (converts `$1, $2` placeholders to `?`)
- `src/middleware/auth.js` - JWT and API key authentication
- `src/routes/*.js` - API route handlers (auth, cars, bookings, availability, incidents, maintenance, settings, users, reports, audit, branches, customers, expenses, notifications, integrations)
- `src/services/availabilityService.js` - Core availability logic with overlap detection
- `src/services/auditService.js` - Audit logging for admin actions
- `src/services/scheduler.js` - Cron jobs for notifications (overdue bookings, expiring documents)

### Frontend Structure
- `src/App.jsx` - Route definitions (react-router-dom)
- `src/context/AuthContext.jsx` - Authentication state and JWT management
- `src/components/layout/` - AppLayout, Sidebar, Topbar
- `src/components/ui/` - Reusable UI components (Card, Button, Modal, Table, etc.)
- `src/pages/*.jsx` - Page components for each feature

### Key Design Patterns

**Database Adapter:** `db.js` provides a PostgreSQL-like API (`query()` returns `{ rows }`) over SQLite. Supports both styles of parameterized queries (`$1` or `?`).

**Availability Logic:** A car is available for `[start, end)` if:
- No booking with status `reserved|confirmed|active` overlaps
- No maintenance block overlaps
- No **open major** incident exists for that car
- Overlap formula: `A.start < B.end AND B.start < A.end`

**Authentication:**
- Dashboard users: JWT via `Authorization: Bearer <token>` or cookie
- API keys (for chatbots): `Authorization: Bearer <key>` or `X-API-Key: <key>`
- API keys have staff-level permissions (no settings/users/audit)
- Token hashed with SHA-256 in `api_keys` table

**Role-Based Access:**
- `admin` - Full access including settings, user management, audit logs
- `staff` - Bookings, cars, incidents, maintenance, customers, expenses
- `readonly` - View-only

**File Uploads:**
- Car images: `POST /api/cars/:id/images` (multipart/form-data)
- Incident images: `POST /api/incidents` (multipart/form-data)
- Stored in `backend/uploads/`, served via `/uploads` static route

## API Endpoints Summary

Base: `/api`

| Route | Auth | Description |
|-------|------|-------------|
| `POST /auth/login` | - | Login, returns JWT |
| `GET /auth/me` | Required | Get current user |
| `GET /cars` | Required | List cars (query: status, class, branch_id) |
| `POST /cars` | admin/staff | Create car |
| `PUT /cars/:id` | admin/staff | Update car |
| `POST /cars/:id/images` | admin/staff | Upload car images |
| `GET /availability` | Required | Get available cars for date range |
| `GET /bookings` | Required | List bookings |
| `POST /bookings` | admin/staff | Create booking (validates no overlap) |
| `PUT /bookings/:id/status` | admin/staff | Update booking status |
| `GET /incidents` | Required | List incidents |
| `POST /incidents` | admin/staff | Create incident with images |
| `PUT /incidents/:id/status` | admin/staff | Update incident status |
| `GET /maintenance` | Required | List maintenance blocks |
| `POST /maintenance` | admin/staff | Create maintenance block |
| `GET /reports` | Required | Dashboard metrics |
| `GET /reports/export/:type` | Required | CSV export (bookings/cars/incidents) |
| `GET /settings` | admin | Get agency settings |
| `PUT /settings` | admin | Update agency settings |
| `GET /users` | admin | List users |
| `POST /users` | admin | Create user |
| `GET /audit` | admin | Audit logs (query: limit) |
| `GET /branches` | Required | List branches |
| `GET /integrations/api-keys` | admin | List API keys |
| `POST /integrations/api-keys` | admin | Create API key |
| `DELETE /integrations/api-keys/:id` | admin | Revoke API key |

## Environment Variables

Backend `.env`:
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
SQLITE_PATH=./data/rental.db
SEED_ADMIN_PASSWORD=DemoAdmin123!
```

Frontend `.env`:
```
VITE_API_URL=http://localhost:3001
```

## Demo Credentials

- Email: `admin@demo.com`
- Password: `DemoAdmin123!` (or `SEED_ADMIN_PASSWORD` from backend `.env`)

## Important Notes

- **Overlap validation** is enforced at the application level (not DB constraints) via `hasConflict()` in `availabilityService.js`
- **Soft delete** for cars (sets status to `inactive`)
- **Audit logging** automatically tracks car/booking/incident changes for admin
- **CORS:** Configured with `origin: true` to allow any origin (for VPS deployment)
- **Rate limiting:** Applied to login endpoint (20 req/15min per IP)
- **Database migrations:** Use idempotent SQL (`CREATE TABLE IF NOT EXISTS`, `CREATE TYPE ... DO $$ BEGIN ... EXCEPTION $$`)
