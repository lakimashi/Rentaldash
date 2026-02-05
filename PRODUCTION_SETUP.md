# Production Setup Guide

This guide explains the production deployment options for the Rental Dashboard.

## Quick Start (Recommended)

Run the interactive installer:

```bash
bash install.sh
```

This will:
- Install all dependencies
- Configure environment variables
- Initialize the database
- Build the frontend
- Set up PM2 for process management
- Start all services

## Manual Setup

If you prefer manual setup instead of the interactive installer:

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Copy the example environment files and customize them:

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your settings
```

### 3. Initialize Database

```bash
cd backend
npm run db:migrate
npm run db:seed  # Optional: for demo data
```

### 4. Build Frontend

```bash
cd frontend
npm run build
```

### 5. Start Services

Choose one of the following options:

#### Option A: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Copy ecosystem config
cp ecosystem.config.js.example ecosystem.config.js
# Edit ports and paths as needed

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the command output to enable auto-start on boot
```

#### Option B: Docker Compose

```bash
docker-compose up -d
```

#### Option C: Systemd Services

See the `systemd/` directory for service files.

```bash
# Copy service files
sudo cp systemd/rental-dashboard-*.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable rental-dashboard-backend
sudo systemctl enable rental-dashboard-frontend

# Start services
sudo systemctl start rental-dashboard-backend
sudo systemctl start rental-dashboard-frontend
```

### 6. Configure Reverse Proxy (Nginx Proxy Manager)

1. Log in to Nginx Proxy Manager
2. Add a new proxy host:
   - **Domain:** Your public domain
   - **Scheme:** http
   - **Forward Host:** localhost:5173 (or your configured frontend port)
   - **Forward Port:** 5173

3. For API access (if needed):
   - **Domain:** api.yourdomain.com
   - **Forward Host:** localhost:3001 (or your configured backend port)
   - **Forward Port:** 3001

4. Enable SSL certificates for both hosts

## Service Management

### PM2 Commands

```bash
pm2 status              # View status
pm2 logs                # View all logs
pm2 logs backend        # View backend logs
pm2 logs frontend       # View frontend logs
pm2 restart all         # Restart all services
pm2 restart backend     # Restart specific service
pm2 stop all            # Stop all services
pm2 start all           # Start all services
pm2 monit               # Real-time monitoring
```

### Systemd Commands

```bash
sudo systemctl status rental-dashboard-backend
sudo systemctl status rental-dashboard-frontend

sudo systemctl restart rental-dashboard-backend
sudo systemctl restart rental-dashboard-frontend

sudo journalctl -u rental-dashboard-backend -f
```

## Environment Variables

See `BUSINESS_SETUP_NOTES.md` (generated after installation) for a complete list of all environment variables.

### Critical Security Variables

These MUST be changed from defaults:

- `JWT_SECRET` - Generate with: `openssl rand -hex 32`
- `SEED_ADMIN_PASSWORD` - Use a strong password

### Business Configuration

These can be customized per business:

- `BUSINESS_NAME` - Your agency name
- `DEFAULT_CURRENCY` - Currency code (USD, EUR, etc.)
- `DEFAULT_VAT_PERCENT` - Tax/VAT percentage
- `DEFAULT_TIMEZONE` - IANA timezone (America/New_York, etc.)

## Database Management

### Backup

```bash
# Simple backup
cp backend/data/rental.db backups/rental.db.$(date +%Y%m%d_%H%M%S)

# Automated backup (add to crontab)
0 2 * * * cp /path/to/backend/data/rental.db /path/to/backups/rental.db.$(date +\%Y\%m\%d)
```

### Restore

```bash
# Stop services
pm2 stop all

# Restore database
cp backups/rental.db.YYYYMMDD_HHMMSS backend/data/rental.db

# Restart services
pm2 start all
```

### Reset

```bash
# WARNING: Deletes all data
rm backend/data/rental.db
cd backend
npm run db:migrate
npm run db:seed
```

## Troubleshooting

### Services Won't Start

1. Check if ports are already in use:
   ```bash
   netstat -tlnp | grep -E '3001|5173'
   ```

2. Check logs:
   ```bash
   pm2 logs
   # or
   tail -f logs/backend-error.log
   ```

3. Verify environment files exist:
   ```bash
   ls -la backend/.env frontend/.env
   ```

### Database Errors

```bash
# Re-run migrations
cd backend
npm run db:migrate

# Check database permissions
ls -la backend/data/rental.db
```

### Frontend Build Issues

```bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

### Permission Issues

```bash
# Fix upload directory permissions
chmod -R 755 backend/uploads
chown -R $USER:$USER backend/uploads

# Fix database directory permissions
chmod -R 755 backend/data
chown -R $USER:$USER backend/data
```

## Updating

To update to a new version:

```bash
# Stop services
pm2 stop all

# Pull latest code
git pull origin main

# Install new dependencies
cd backend && npm install
cd ../frontend && npm install

# Rebuild frontend
cd frontend
npm run build

# Restart services
pm2 start all
```

## Security Considerations

1. **Never commit .env files** - They are in .gitignore
2. **Change default passwords** - Set strong admin password
3. **Use HTTPS** - Configure SSL in Nginx Proxy Manager
4. **Firewall** - Only expose ports 80/443, not internal service ports
5. **Regular backups** - Set up automated database backups
6. **Monitor logs** - Check for suspicious activity regularly

## Performance Tuning

### Backend

- Adjust `max_memory_restart` in ecosystem.config.js
- Increase `NODE_ENV=production` heap size if needed
- Use clustering for high-traffic deployments

### Frontend

- Enable gzip compression in Nginx Proxy Manager
- Configure browser caching headers
- Use CDN for static assets in high-traffic scenarios

## Support

For detailed configuration information, see `BUSINESS_SETUP_NOTES.md` (generated after installation).

For issues:
1. Check logs: `pm2 logs`
2. Review this guide's troubleshooting section
3. Ensure all environment variables are set correctly
