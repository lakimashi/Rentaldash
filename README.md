# Rental Agency Web Dashboard

A minimalistic web dashboard for rental agencies to manage cars, availability, bookings, incidents, and maintenance. Portable and deployable with a single setup script. Ready for future AI booking chatbot integration (API keys, REST API).

## Quick start (local, no Docker)

1. **Backend (Node 18+)**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```
   Backend runs on http://localhost:3001. Database: SQLite at `backend/data/rental.db`.

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on http://localhost:5173 and proxies `/api` to the backend.

3. **Log in**  
   - Open http://localhost:5173  
   - Email: `admin@demo.com`  
   - Password: `DemoAdmin123!` (or `SEED_ADMIN_PASSWORD` from backend `.env`)

## Quick start (Docker, optional)

1. Install [Docker](https://docs.docker.com/get-docker/) and Docker Compose.
2. Clone, then: `cp .env.example .env` and run `bash deploy/setup.sh`.
3. Open http://localhost. (Note: Docker setup still uses PostgreSQL; for SQLite use local run above.)

## Project structure

```
rental-dashboard/
├── backend/           # Node.js + Express API
│   ├── src/
│   ├── scripts/      # runSchema.js, seed.js
│   ├── schema.sql
│   ├── package.json
│   └── Dockerfile
├── frontend/         # React + Vite + Tailwind
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── deploy/
│   ├── docker-compose.yml
│   └── setup.sh
├── docs/
│   ├── API.md
│   └── DB.md
├── .env.example
└── README.md
```

## Development

- **Backend:** `cd backend && npm install && npm run dev` (port 3001). Uses SQLite by default (`backend/data/rental.db`).
- **Frontend:** `cd frontend && npm install && npm run dev` (port 5173, proxies `/api` and `/uploads` to backend).
- **Database:** SQLite. Path: `SQLITE_PATH` or `DATABASE_URL` in `backend/.env` (default: `./data/rental.db`).
- Apply schema: `cd backend && npm run db:migrate`
- Seed: `cd backend && npm run db:seed`

## Roles

- **Admin:** Full access (settings, users, cars, bookings, incidents, maintenance, reports, audit, API keys).
- **Staff:** Manage bookings, availability, incidents, maintenance; add/edit cars; no settings or user management.
- **Read-only:** View-only (availability, reports, etc.).

## Docs

- [API endpoints and payloads](docs/API.md)
- [Database schema and rules](docs/DB.md)

## Definition of done

- Run `bash deploy/setup.sh` on a clean environment and the app is reachable.
- Log in with seeded admin; add cars; create bookings; create incidents; add maintenance blocks.
- Availability page shows only cars available for the selected date range (bookings, maintenance, and open major incidents block availability).
- UI: sidebar, cards, tables, empty states; usable on desktop and basic mobile.
- API keys (Settings): create, list, revoke; token stored hashed.
- Audit log records car/booking/incident changes (admin only).
