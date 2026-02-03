# Rental Dashboard - Deployment Details

## Deployment Status: ✅ RUNNING

## Container Information

### Main Frontend Container (for nginx proxy manager)
- **Container Name:** deploy-frontend-1
- **Image:** deploy-frontend
- **Host Port:** 8081
- **Container Port:** 80
- **Internal IP:** 172.19.0.12 (on n8n-proxy-network)
- **Networks:** deploy_internal, n8n-proxy-network
- **Access URL:** http://localhost:8081
- **Status:** Up and running

### Backend API Container
- **Container Name:** deploy-backend-1
- **Image:** deploy-backend
- **Internal IP:** 172.19.0.11 (on n8n-proxy-network)
- **Exposed Port:** 3001
- **Networks:** deploy_internal, n8n-proxy-network
- **Status:** Up and running

### Database Container
- **Container Name:** deploy-postgres-1
- **Image:** postgres:16-alpine
- **Internal IP:** 172.19.0.10 (on n8n-proxy-network)
- **Exposed Port:** 5432
- **Networks:** deploy_internal, n8n-proxy-network
- **Health Status:** Healthy

## Network Configuration

- **Primary Network:** n8n-proxy-network (shared with nginx proxy manager)
- **Internal Network:** deploy_deploy_internal
- **Network Subnet:** 172.19.0.0/16
- **All containers are now on the same network as nginx proxy manager**

## For Nginx Proxy Manager Setup ✅ NOW CONFIGURED

Add a new proxy host in nginx proxy manager with:
- **Forward Hostname/IP:** `172.19.0.12` (frontend container IP on shared network)
- **Forward Port:** `80`

### Important Notes:
1. The frontend nginx automatically proxies `/api` requests to the backend container
2. The frontend automatically proxies `/uploads` requests to the backend container
3. No additional configuration needed for API access - it's handled internally
4. The application uses SQLite for data storage (not PostgreSQL)
5. Admin credentials (if seeded): admin@demo.com / DemoAdmin123!

### Default Admin Account
If SEED_DEMO was set to true (it is), you can login with:
- **Email:** admin@demo.com
- **Password:** DemoAdmin123!

### Health Check
To verify the deployment is working:
```bash
curl -I http://localhost:8081
```

Expected response: HTTP/1.1 200 OK

### Container Management Commands
```bash
# Check container status
docker ps -a --filter "name=deploy"

# View logs
docker logs deploy-frontend-1
docker logs deploy-backend-1
docker logs deploy-postgres-1

# Stop all containers
cd /root/rental-dashboard/deploy && docker compose down

# Start all containers
cd /root/rental-dashboard/deploy && docker compose up -d

# Restart containers
cd /root/rental-dashboard/deploy && docker compose restart
```

## Deployment Location
- **Repository:** /root/rental-dashboard
- **Docker Compose:** /root/rental-dashboard/deploy/docker-compose.yml
- **Environment File:** /root/rental-dashboard/.env

## Volumes
- `deploy_pgdata` - PostgreSQL data (not currently used)
- `deploy_uploads_data` - File uploads storage

## NEW FEATURES DEPLOYED ✅

### 1. Customer Database
- **API:** `/api/customers`
- **Frontend:** `/customers`
- **Features:** 
  - Create, view, edit, delete customers
  - Track customer history (bookings per customer)
  - Search by name, email, phone, or ID number
  - Store license expiry dates

### 2. Mileage Tracking
- **Capture:** Pick-up and return mileage
- **Storage:** 
  - `cars.current_mileage` - Current odometer reading
  - `cars.last_service_mileage` - Mileage at last service
  - `bookings.start_mileage` - Odometer at pickup
  - `bookings.end_mileage` - Odometer at return
  - `bookings.miles_driven` - Auto-calculated miles per rental
- **Auto-updates:** Updates `cars.current_mileage` when booking is returned

### 3. Expense & Profit Board
- **API:** `/api/expenses`
- **Frontend:** `/expenses`
- **Features:**
  - Track expenses by vehicle
  - Categories: Maintenance, Insurance, Registration, Cleaning, Miscellaneous, Fuel
  - Profit calculation: Revenue - Expenses = Net Profit
  - Profit breakdown by vehicle
  - Expense breakdown by category
  - Date range filtering
- **API Endpoint:** `GET /api/reports/profit`

### 4. Calendar View
- **Frontend:** `/calendar`
- **Library:** react-calendar
- **Features:**
  - Month view with booking blocks
  - Color-coded by status (Active=Red, Reserved=Yellow, Completed=Green)
  - Filter by car, status
  - Click to view booking details
  - Car selection for availability

### 5. Booking Edit/Modify
- **API:** `PUT /api/bookings/:id`
- **Features:**
  - Full edit capability for non-completed bookings
  - Change dates, car, customer, extras
  - Conflict re-checking when dates changed
  - Cannot edit completed/cancelled bookings

### 6. Return Condition Checklist
- **API:** `POST /api/bookings/:id/checklist`
- **Frontend:** `/bookings/:id/return`
- **Features:**
  - Fuel level dropdown (Empty, Quarter, Half, 3/4, Full)
  - Exterior condition (Body, Windows, Lights, Cleanliness)
  - Interior condition (Seats, Floors, No trash, Odors)
  - Tire condition (Pressure, Tread, Damage)
  - Damage notes and photo upload
  - Auto-sets booking status to "completed"

### 7. Late Fee Automation
- **API:** `/api/settings/late-fee-rules`
- **Frontend:** Settings > Late Fee Rules tab
- **Features:**
  - Tiered fee structure configuration
  - Rules per hour range (e.g., 0-3, 3-24, 24-48, 48+)
  - Flat or percentage fees
  - Enable/disable rules
  - Notifications only (no auto-application per your preference)
- **Default Rules:**
  - 0-3 hours: $0 (grace period)
  - 4-24 hours: $20 (first day)
  - 24-48 hours: $50 (second day)
  - 48+ hours: $100 per day

### 8. Vehicle Documents Storage
- **API:** `/api/cars/:id/documents`
- **Frontend:** `/cars/:id/documents`
- **Features:**
  - Document types: Registration, Insurance, Inspection, Other
  - Upload PDF, JPG, PNG (max 10MB)
  - Expiry date tracking
  - Expiry warnings (red < 30 days, yellow < 60 days)
  - Download and delete documents
  - Document count badge on Cars list

### 9. Overdue Alerts
- **API:** `/api/notifications`
- **Frontend:** `/notifications`
- **Features:**
  - Notification bell icon in header with unread count
  - Notification center page
  - Auto-checks daily at 8 AM
  - Alerts for overdue bookings
  - Mark as read individually or all at once
  - Link to booking details from notification

### 10. Registration & Insurance Expiry Alerts
- **API:** Same notification system
- **Features:**
  - Auto-checks daily for expiring documents
  - 30-day advance warning (configurable)
  - Separate alerts for registration and insurance
  - Per-vehicle expiry tracking
  - Expiry column in Cars table

### 11. Duplicate Booking Prevention
- **Status:** ✅ ALREADY IMPLEMENTED
- **Features:**
  - Conflict detection via `hasConflict()` function
  - Checks overlapping bookings
  - Checks maintenance blocks
  - Checks open major incidents
  - Applied during booking creation and editing

## NEW DATABASE TABLES

- `customers` - Customer CRM database
- `expenses` - Expense tracking
- `vehicle_documents` - Document storage
- `late_fee_rules` - Late fee configuration
- `return_checklists` - Return condition tracking
- `notifications` - Alert system

## NEW DATABASE COLUMNS ADDED

- **cars:** `current_mileage`, `last_service_mileage`, `registration_expiry`, `insurance_expiry`
- **bookings:** `customer_id`, `start_mileage`, `end_mileage`, `miles_driven`, `actual_return_date`, `late_fee_amount`

## NEW FRONTEND PAGES

- `/customers` - Customer management
- `/expenses` - Expense tracking with profit board
- `/calendar` - Calendar view
- `/bookings/:id/return` - Return checklist
- `/notifications` - Notification center
- `/cars/:id/documents` - Vehicle document management

## BACKEND API ENDPOINTS

### Customers
- `GET /api/customers` - List (with search)
- `POST /api/customers` - Create
- `GET /api/customers/:id` - Single with booking history
- `PUT /api/customers/:id` - Update
- `DELETE /api/customers/:id` - Delete

### Expenses
- `GET /api/expenses` - List (with filters)
- `POST /api/expenses` - Create
- `PUT /api/expenses/:id` - Update
- `DELETE /api/expenses/:id` - Delete
- `GET /api/reports/profit` - Profit calculations

### Notifications
- `GET /api/notifications` - List (with unread filter)
- `GET /api/notifications/unread-count` - Unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Settings (Late Fees)
- `GET /api/settings/late-fee-rules` - List rules
- `POST /api/settings/late-fee-rules` - Create rule
- `PUT /api/settings/late-fee-rules/:id` - Update rule
- `DELETE /api/settings/late-fee-rules/:id` - Delete rule

### Cars (Documents)
- `GET /api/cars/:id/documents` - List vehicle documents
- `POST /api/cars/:id/documents` - Upload document
- `DELETE /api/cars/documents/:docId` - Delete document

### Bookings (Enhanced)
- `PUT /api/bookings/:id` - Full edit (mileage, customer, dates, etc.)

## SCHEDULER

- **Type:** node-cron
- **Schedule:** Daily at 8 AM
- **Checks:**
  - Overdue bookings (status IN 'active','reserved' AND end_date < today)
  - Expiring documents (registration/insurance expiry < 30 days)
- **Creates:** Notifications for admin users

## NAVIGATION UPDATES

- **Sidebar:** Added links for Calendar, Customers, Expenses, Notifications
- **Header:** Added notification bell icon with unread count badge
