#!/usr/bin/env bash

################################################################################
# Rental Dashboard - Interactive Installer
# This script sets up a complete rental dashboard deployment for a new business.
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config file paths
BACKEND_ENV_FILE="backend/.env"
FRONTEND_ENV_FILE="frontend/.env"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to read hidden password
read_password() {
    local password
    local password_confirm
    while true; do
        read -s -p "$1: " password
        echo
        read -s -p "Confirm $1: " password_confirm
        echo
        if [ "$password" = "$password_confirm" ]; then
            if [ ${#password} -ge 6 ]; then
                echo "$password"
                return
            else
                print_error "Password must be at least 6 characters"
            fi
        else
            print_error "Passwords do not match"
        fi
    done
}

# Function to validate required input
validate_required() {
    if [ -z "$1" ]; then
        print_error "This field is required"
        return 1
    fi
    return 0
}

# Function to validate port number
validate_port() {
    if [[ ! "$1" =~ ^[0-9]+$ ]] || [ "$1" -lt 1024 ] || [ "$1" -gt 65535 ]; then
        print_error "Port must be between 1024 and 65535"
        return 1
    fi
    return 0
}

# Function to validate URL
validate_url() {
    if [ -n "$1" ] && [[ ! "$1" =~ ^https?:// ]]; then
        print_error "URL must start with http:// or https://"
        return 1
    fi
    return 0
}

# Function to validate email
validate_email() {
    if [[ ! "$1" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        print_error "Invalid email format"
        return 1
    fi
    return 0
}

# Function to validate currency code
validate_currency() {
    if [[ ! "$1" =~ ^[A-Z]{3}$ ]]; then
        print_error "Currency must be a 3-letter code (e.g., USD, EUR, GBP)"
        return 1
    fi
    return 0
}

# Function to offer default or prompt
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local validator="$3"
    local input

    while true; do
        read -p "$prompt [$default]: " input
        input="${input:-$default}"

        if [ -n "$validator" ]; then
            if $validator "$input"; then
                echo "$input"
                return
            fi
        else
            validate_required "$input" && echo "$input" && return
        fi
    done
}

# Function for yes/no prompt
prompt_yes_no() {
    local prompt="$1"
    local default="${2:-n}"
    local input

    while true; do
        read -p "$prompt [y/n] [$default]: " input
        input="${input:-$default}"
        case "$input" in
            y|Y|yes|YES) return 0 ;;
            n|N|no|NO) return 1 ;;
            *) print_error "Please enter y or n" ;;
        esac
    done
}

################################################################################
# Installation Functions
################################################################################

check_system_requirements() {
    print_header "Checking System Requirements"

    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root"
        exit 1
    fi

    # Check OS
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        print_info "Warning: This script is designed for Linux. Your OS is $OSTYPE"
    fi

    print_success "System requirements check passed"
}

install_nodejs() {
    print_header "Node.js Installation"

    if command -v node &> /dev/null; then
        local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -ge 18 ]; then
            print_success "Node.js $(node -v) already installed"
            return
        else
            print_info "Node.js version $node_version found, but 18+ is required"
        fi
    fi

    print_info "Installing Node.js 20.x..."
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    else
        print_error "Could not detect package manager. Please install Node.js 18+ manually."
        exit 1
    fi

    print_success "Node.js $(node -v) installed"
}

install_pm2() {
    print_header "PM2 Installation"

    if command -v pm2 &> /dev/null; then
        print_success "PM2 already installed"
        return
    fi

    print_info "Installing PM2 globally..."
    npm install -g pm2

    print_success "PM2 installed"
}

install_dependencies() {
    print_header "Installing Dependencies"

    print_info "Installing backend dependencies..."
    cd "$PROJECT_ROOT/backend"
    if [ -f "package-lock.json" ]; then
        npm ci --silent
    else
        npm install --silent
    fi

    print_success "Backend dependencies installed"

    print_info "Installing frontend dependencies..."
    cd "$PROJECT_ROOT/frontend"
    if [ -f "package-lock.json" ]; then
        npm ci --silent
    else
        npm install --silent
    fi

    print_success "Frontend dependencies installed"
}

build_frontend() {
    print_header "Building Frontend"

    cd "$PROJECT_ROOT/frontend"
    npm run build

    print_success "Frontend built successfully"
}

################################################################################
# Configuration Wizard
################################################################################

collect_configuration() {
    print_header "Business Configuration Wizard"

    echo "This wizard will collect business-specific settings for your rental dashboard."
    echo "All values can be changed later in the .env files."
    echo

    # Business Information
    print_info "=== Business Information ==="
    BUSINESS_NAME=$(prompt_with_default "Business name" "Rental Agency")
    BUSINESS_NAME=$(echo "$BUSINESS_NAME" | xargs)  # Trim whitespace

    DEFAULT_CURRENCY=$(prompt_with_default "Default currency" "USD" "validate_currency")

    DEFAULT_TIMEZONE=$(prompt_with_default "Timezone" "UTC")

    DEFAULT_VAT_PERCENT=$(prompt_with_default "VAT/Tax percent (0-100)" "0")

    # Admin Account
    print_info "\n=== Admin Account ==="
    echo "Create the primary administrator account for this dashboard."

    while true; do
        ADMIN_EMAIL=$(prompt_with_default "Admin email" "admin@$BUSINESS_NAME.com" "validate_email")
        validate_required "$ADMIN_EMAIL" && break
    done

    ADMIN_PASSWORD=$(read_password "Admin password")

    # Service Ports
    print_info "\n=== Service Ports ==="
    echo "Choose internal ports for the services."
    echo "These ports will be used by Nginx Proxy Manager for routing."

    while true; do
        BACKEND_PORT=$(prompt_with_default "Backend port" "3001" "validate_port")
        validate_required "$BACKEND_PORT" && break
    done

    while true; do
        FRONTEND_PORT=$(prompt_with_default "Frontend port (for production)" "5173" "validate_port")
        validate_required "$FRONTEND_PORT" && break
    done

    # Public URL
    print_info "\n=== Public Configuration ==="
    echo "If you have a domain name, enter it below."
    echo "Leave blank if using IP address or will configure later."

    PUBLIC_URL=$(prompt_with_default "Public domain URL" "" "validate_url")

    # Chatbot Integration
    print_info "\n=== AI Chatbot Integration ==="

    if prompt_yes_no "Enable AI chatbot integration" "n"; then
        CHATBOT_ENABLED=true
        CHATBOT_API_URL=$(prompt_with_default "Chatbot API URL" "" "validate_url")
        CHATBOT_API_KEY=$(prompt_with_default "Chatbot API key" "")
    else
        CHATBOT_ENABLED=false
        CHATBOT_API_URL=""
        CHATBOT_API_KEY=""
    fi

    # Demo Data
    print_info "\n=== Demo Data ==="

    if prompt_yes_no "Seed demo data (recommended for first-time setup)" "y"; then
        SEED_DEMO=true
    else
        SEED_DEMO=false
    fi
}

generate_jwt_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -hex 32
    else
        # Fallback method
        head /dev/urandom | tr -dc A-Za-z0-9 | head -c 64
    fi
}

write_backend_env() {
    print_header "Writing Backend Configuration"

    JWT_SECRET=$(generate_jwt_secret)

    cat > "$PROJECT_ROOT/$BACKEND_ENV_FILE" << EOF
# ==========================================
# RENTAL DASHBOARD BACKEND CONFIGURATION
# ==========================================
# Auto-generated by install.sh on $(date)

# ------------------
# Server Configuration
# ------------------
NODE_ENV=production
PORT=$BACKEND_PORT

# ------------------
# Database Configuration
# ------------------
SQLITE_PATH=./data/rental.db

# ------------------
# Security & Authentication
# ------------------
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
COOKIE_MAX_AGE=604800000
COOKIE_SAME_SITE=lax

# ------------------
# Admin Account (Seed)
# ------------------
SEED_ADMIN_EMAIL=$ADMIN_EMAIL
SEED_ADMIN_PASSWORD=$ADMIN_PASSWORD

# ------------------
# Business Settings
# ------------------
BUSINESS_NAME=$BUSINESS_NAME
DEFAULT_CURRENCY=$DEFAULT_CURRENCY
DEFAULT_VAT_PERCENT=$DEFAULT_VAT_PERCENT
DEFAULT_TIMEZONE=$DEFAULT_TIMEZONE

# ------------------
# File Uploads
# ------------------
UPLOAD_DIR=./uploads

# ------------------
# Rate Limiting
# ------------------
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ------------------
# CORS Configuration
# ------------------
FRONTEND_URL=http://localhost:$FRONTEND_PORT

# ------------------
# Demo Data
# ------------------
SEED_DEMO=$SEED_DEMO

# ------------------
# AI Chatbot Integration
# ------------------
CHATBOT_ENABLED=$CHATBOT_ENABLED
CHATBOT_API_URL=$CHATBOT_API_URL
CHATBOT_API_KEY=$CHATBOT_API_KEY

# ------------------
# Validation Constraints
# ------------------
CAR_YEAR_MIN=1900
CAR_YEAR_MAX=2100
CUSTOMER_NAME_MIN_LENGTH=2
CUSTOMER_NAME_MAX_LENGTH=100
EOF

    chmod 600 "$PROJECT_ROOT/$BACKEND_ENV_FILE"
    print_success "Backend configuration written"
}

write_frontend_env() {
    print_header "Writing Frontend Configuration"

    # Determine API URL based on public URL or localhost
    if [ -n "$PUBLIC_URL" ]; then
        API_URL="$PUBLIC_URL"
    else
        API_URL="http://localhost:$BACKEND_PORT"
    fi

    cat > "$PROJECT_ROOT/$FRONTEND_ENV_FILE" << EOF
# ==========================================
# RENTAL DASHBOARD FRONTEND CONFIGURATION
# ==========================================
# Auto-generated by install.sh on $(date)

# ------------------
# API Configuration
# ------------------
VITE_API_URL=$API_URL

# ------------------
# Development Server
# ------------------
VITE_DEV_PORT=$FRONTEND_PORT
EOF

    print_success "Frontend configuration written"
}

initialize_database() {
    print_header "Initializing Database"

    cd "$PROJECT_ROOT/backend"
    npm run db:migrate

    if [ "$SEED_DEMO" = "true" ]; then
        print_info "Seeding demo data..."
        npm run db:seed
    fi

    print_success "Database initialized"
}

setup_pm2() {
    print_header "Setting Up PM2"

    cd "$PROJECT_ROOT"

    # Create PM2 ecosystem file
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'rental-dashboard-backend',
      script: './backend/src/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'rental-dashboard-frontend',
      script: 'npx',
      args: 'serve dist -l 5173',
      cwd: __dirname + '/frontend',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    }
  ]
};
EOF

    # Create logs directory
    mkdir -p logs

    # Install serve for frontend if not present
    if [ ! -d "$PROJECT_ROOT/frontend/node_modules/serve" ]; then
        cd "$PROJECT_ROOT/frontend"
        npm install serve --save-dev --silent
    fi

    print_success "PM2 configuration created"
}

start_services() {
    print_header "Starting Services"

    cd "$PROJECT_ROOT"

    # Stop existing processes if any
    pm2 delete rental-dashboard-backend 2>/dev/null || true
    pm2 delete rental-dashboard-frontend 2>/dev/null || true

    # Start services
    pm2 start ecosystem.config.js

    # Save PM2 process list
    pm2 save

    # Setup PM2 to start on system boot
    pm2 startup | tail -n 1 > /tmp/pm2_startup_cmd
    if [ -s /tmp/pm2_startup_cmd ]; then
        print_info "To enable PM2 to start on system boot, run:"
        cat /tmp/pm2_startup_cmd
    fi

    print_success "Services started"
}

generate_business_notes() {
    print_header "Generating Business Setup Notes"

    cat > "$PROJECT_ROOT/BUSINESS_SETUP_NOTES.md" << EOF
# Business Setup Notes

**Generated:** $(date)
**Business:** $BUSINESS_NAME

---

## A. Configuration Files and Environment Variables

All business-specific configuration is stored in environment variables:

### Backend Configuration
**File:** \`backend/.env\`

### Frontend Configuration
**File:** \`frontend/.env\`

### Environment Variables Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| \`PORT\` | Backend server port | \`3001\` | Yes |
| \`SQLITE_PATH\` | Database file path | \`./data/rental.db\` | Yes |
| \`JWT_SECRET\` | JWT signing secret | \`<random-64-chars>\` | Yes |
| \`JWT_EXPIRES_IN\` | Token expiration | \`7d\` | No |
| \`COOKIE_MAX_AGE\` | Cookie max age (ms) | \`604800000\` | No |
| \`SEED_ADMIN_EMAIL\` | Default admin email | \`admin@example.com\` | Yes |
| \`SEED_ADMIN_PASSWORD\` | Default admin password | \`SecurePass123!\` | Yes |
| \`BUSINESS_NAME\` | Agency display name | \`My Rental Agency\` | No |
| \`DEFAULT_CURRENCY\` | Default currency code | \`USD\` | No |
| \`DEFAULT_VAT_PERCENT\` | VAT/tax percentage | \`10\` | No |
| \`DEFAULT_TIMEZONE\` | Default timezone | \`America/New_York\` | No |
| \`UPLOAD_DIR\` | Upload directory path | \`./uploads\` | No |
| \`RATE_LIMIT_WINDOW_MS\` | Rate limit window | \`900000\` | No |
| \`RATE_LIMIT_MAX_REQUESTS\` | Max requests per window | \`100\` | No |
| \`FRONTEND_URL\` | Frontend URL for CORS | \`http://localhost:5173\` | Yes |
| \`SEED_DEMO\` | Enable demo data seed | \`true\` | No |
| \`CHATBOT_ENABLED\` | Enable chatbot integration | \`false\` | No |
| \`CHATBOT_API_URL\` | Chatbot API endpoint | \`https://api.example.com\` | No |
| \`CHATBOT_API_KEY\` | Chatbot API key | \`<key>\` | No |
| \`VITE_API_URL\` | Backend API URL | \`http://localhost:3001\` | Yes |

---

## B. New Business Checklist

Use this checklist when deploying to a new business:

- [ ] Run \`bash install.sh\` and complete the configuration wizard
- [ ] Update business name in settings via the dashboard UI
- [ ] Add branches/locations in the dashboard
- [ ] Add cars/vehicles to inventory
- [ ] Configure pricing and rates
- [ ] Set up late fee rules (if applicable)
- [ ] Configure VAT/tax rates
- [ ] Customize notification settings
- [ ] Set up Nginx Proxy Manager for domain/routing
- [ ] Configure SSL certificates
- [ ] Set up regular database backups
- [ ] Configure AI chatbot integration (if enabled)

---

## C. Admin Login Details

**Admin Email:** \`$ADMIN_EMAIL\`
**Admin Password:** \`$ADMIN_PASSWORD\`

### Resetting Admin Password

To reset the admin password:

1. Stop the backend service: \`pm2 stop rental-dashboard-backend\`
2. Update the password in \`backend/.env\`:
   \`\`\`bash
   SEED_ADMIN_PASSWORD=new_secure_password
   \`\`\`
3. Re-run the seed script: \`cd backend && npm run db:seed\`
4. Restart the service: \`pm2 restart rental-dashboard-backend\`

Or update via database:
\`\`\`bash
cd backend
node -e "import('bcryptjs').then(b => b.default.hash('newpassword', 10).then(h => import('./src/db.js').then(d => d.default.query('UPDATE users SET password_hash = \\\$1 WHERE email = \\\$2', [h, '$ADMIN_EMAIL']))))"
\`\`\`

---

## D. AI Chatbot Integration

### Configuration

The chatbot integration is **$([ "$CHATBOT_ENABLED" = "true" ] && echo "ENABLED" || echo "DISABLED")**.

**Environment Variables:**
- \`CHATBOT_ENABLED=$CHATBOT_ENABLED\`
- \`CHATBOT_API_URL=$CHATBOT_API_URL\`
- \`CHATBOT_API_KEY=$([ -n "$CHATBOT_API_KEY" ] && echo "***CONFIGURED***" || echo "Not set")\`

### API Endpoints for Chatbot

The following endpoints are available for chatbot integration:

#### Check Car Availability
\`\`\`
GET /api/availability?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}&class={class}
\`\`\`

Returns list of available cars for the given date range.

#### Create Booking
\`\`\`
POST /api/bookings
Authorization: Bearer {API_KEY}

{
  "car_id": 1,
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "start_date": "2025-01-01",
  "end_date": "2025-01-05",
  "total_price": 200,
  "deposit": 50
}
\`\`\`

#### List Cars
\`\`\`
GET /api/cars
Authorization: Bearer {API_KEY}
\`\`\`

Returns all cars with filtering options.

### API Key Authentication

To generate an API key for the chatbot:
1. Login as admin to the dashboard
2. Navigate to Settings → Integrations
3. Create a new API key
4. Use the key in the Authorization header: \`Authorization: Bearer {key}\`

---

## E. Ports, Services, and Nginx Proxy Manager Mapping

### Internal Ports

| Service | Internal Port | Description |
|---------|---------------|-------------|
| Backend API | $BACKEND_PORT | Express.js backend server |
| Frontend | $FRONTEND_PORT | Vite/serve frontend server |

### Nginx Proxy Manager Configuration

Configure the following host mappings:

**Frontend (Main Dashboard):**
- Domain: \`$PUBLIC_URL\` (or your chosen domain)
- Scheme: http
- Forward Host: \`localhost:$FRONTEND_PORT\`
- Forward Port: \`$FRONTEND_PORT\`

**Backend API (if exposed separately):**
- Domain: \`api.$PUBLIC_URL\` (optional)
- Scheme: http
- Forward Host: \`localhost:$BACKEND_PORT\`
- Forward Port: \`$BACKEND_PORT\`

### Websocket Support (if needed)

Add the following to Nginx Proxy Manager's "Custom Nginx Configuration" (Advanced tab):

\`\`\`nginx
location /api {
    proxy_pass http://localhost:$BACKEND_PORT;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
}
\`\`\`

---

## F. Re-running Installer

To re-run the installer for a new business or to update configuration:

\`\`\`bash
bash install.sh
\`\`\`

**Note:** Re-running will regenerate the .env files but preserve your database.

To completely reset:
\`\`\`bash
# Stop services
pm2 stop all

# Backup current database
cp backend/data/rental.db backend/data/rental.db.backup

# Remove database and re-run
rm backend/data/rental.db
bash install.sh
\`\`\`

---

## G. Troubleshooting

### Services Not Starting

1. Check PM2 status: \`pm2 status\`
2. Check logs: \`pm2 logs rental-dashboard-backend\` or \`pm2 logs rental-dashboard-frontend\`
3. Verify ports are not in use: \`netstat -tlnp | grep -E '$BACKEND_PORT|$FRONTEND_PORT'\`

### Database Issues

\`\`\`bash
# Re-run migrations
cd backend
npm run db:migrate

# Reset database (WARNING: deletes all data)
rm backend/data/rental.db
npm run db:migrate
npm run db:seed
\`\`\`

### Permission Issues

\`\`\`bash
# Fix upload directory permissions
chmod -R 755 backend/uploads
chown -R \$USER:\$USER backend/uploads
\`\`\`

### Frontend Build Issues

\`\`\`bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
\`\`\`

### Cannot Access Dashboard

1. Verify PM2 is running: \`pm2 list\`
2. Check firewall rules: \`sudo ufw status\`
3. Verify Nginx Proxy Manager is configured correctly
4. Check the browser console for errors

### Reset Admin Password

See section C above for detailed instructions.

---

## Service Management

### PM2 Commands

\`\`\`bash
# View status
pm2 status

# View logs
pm2 logs

# Restart all services
pm2 restart all

# Restart specific service
pm2 restart rental-dashboard-backend

# Stop all services
pm2 stop all

# Start all services
pm2 start all

# Monitor
pm2 monit
\`\`\`

---

## Backup and Maintenance

### Database Backup

\`\`\`bash
# Backup database
cp backend/data/rental.db backups/rental.db.\$(date +%Y%m%d_%H%M%S)

# Automated backup (add to crontab)
0 2 * * * cp /path/to/backend/data/rental.db /path/to/backups/rental.db.\$(date +\%Y\%m\%d)
\`\`\`

### Configuration Backup

\`\`\`bash
# Backup configuration
tar -czf config-backup-\$(date +%Y%m%d).tar.gz backend/.env frontend/.env ecosystem.config.js
\`\`\`

---

## Support

For issues or questions:
- Check logs: \`pm2 logs\`
- Review this file for common issues
- Ensure all environment variables are properly set

**Internal URLs for testing:**
- Frontend: http://localhost:$FRONTEND_PORT
- Backend API: http://localhost:$BACKEND_PORT

EOF

    print_success "Business setup notes generated"
}

print_final_summary() {
    print_header "Installation Complete"

    echo
    print_success "Installation completed successfully!"
    echo
    echo -e "${GREEN}Business Configuration:${NC}"
    echo "  Business Name: $BUSINESS_NAME"
    echo "  Currency: $DEFAULT_CURRENCY"
    echo "  Timezone: $DEFAULT_TIMEZONE"
    echo
    echo -e "${GREEN}Admin Credentials:${NC}"
    echo "  Email: $ADMIN_EMAIL"
    echo "  Password: $ADMIN_PASSWORD"
    echo
    echo -e "${GREEN}Service URLs:${NC}"
    echo "  Frontend: http://localhost:$FRONTEND_PORT"
    echo "  Backend API: http://localhost:$BACKEND_PORT"
    echo
    echo -e "${GREEN}Nginx Proxy Manager Configuration:${NC}"
    echo "  Frontend → localhost:$FRONTEND_PORT"
    echo "  Backend API → localhost:$BACKEND_PORT (if proxied separately)"
    if [ -n "$PUBLIC_URL" ]; then
        echo "  Public Domain: $PUBLIC_URL"
    fi
    echo
    echo -e "${GREEN}Next Steps:${NC}"
    echo "  1. Review BUSINESS_SETUP_NOTES.md for detailed information"
    echo "  2. Configure Nginx Proxy Manager for your domain"
    echo "  3. Login to the dashboard and complete initial setup"
    echo "  4. Add cars, branches, and configure business settings"
    echo
    echo -e "${GREEN}PM2 Commands:${NC}"
    echo "  pm2 status              # View service status"
    echo "  pm2 logs                # View logs"
    echo "  pm2 restart all         # Restart services"
    echo
    echo -e "${YELLOW}IMPORTANT:${NC}"
    echo "  - Keep your .env files secure and never commit them to git"
    echo "  - Set up regular database backups"
    echo "  - Review BUSINESS_SETUP_NOTES.md for all configuration details"
    echo
}

################################################################################
# Main Installation Flow
################################################################################

main() {
    print_header "Rental Dashboard Installer"
    echo "This installer will set up a complete rental dashboard deployment."
    echo

    check_system_requirements
    install_nodejs
    install_pm2
    install_dependencies
    collect_configuration
    write_backend_env
    write_frontend_env
    initialize_database
    build_frontend
    setup_pm2
    start_services
    generate_business_notes
    print_final_summary
}

# Run main function
main
