# Security Considerations for Rental Dashboard

## Overview

This document outlines security considerations for the Rental Dashboard backend API and provides guidance for secure integration with external systems like n8n.

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [API Security](#api-security)
3. [Database Security](#database-security)
4. [n8n Integration Security](#n8n-integration-security)
5. [CORS Configuration](#cors-configuration)
6. [Rate Limiting](#rate-limiting)
7. [Input Validation](#input-validation)
8. [Data Protection](#data-protection)
9. [Audit Logging](#audit-logging)
10. [Deployment Security](#deployment-security)
11. [Best Practices](#best-practices)

---

## Authentication & Authorization

### JWT Token Authentication

**Implementation:**
- JWT tokens are signed using `JWT_SECRET` environment variable
- Default token expiration: 7 days (configurable via `JWT_EXPIRES_IN`)
- Tokens are stored in HTTP-only cookies for web clients
- Tokens can be passed via `Authorization: Bearer <token>` header

**Security Recommendations:**

1. **Generate Strong JWT Secret**
   ```bash
   # Generate 256-bit hex string
   openssl rand -hex 32
   ```

2. **Set Appropriate Token Expiration**
   ```bash
   # Production: Shorter expiration (1-24 hours)
   JWT_EXPIRES_IN=24h
   ```

3. **Use HTTPS in Production**
   - Never transmit JWT tokens over HTTP in production
   - Configure TLS/SSL certificates
   - Use secure cookie flags: `Secure; HttpOnly; SameSite=Strict`

### API Key Authentication

**Implementation:**
- API keys are generated with 256 random bytes (hex-encoded)
- Only SHA-256 hash is stored in database
- Keys can be passed via `Authorization: Bearer <key>` or `x-api-key` header
- Last used timestamp is tracked

**Security Recommendations:**

1. **Rotate API Keys Regularly**
   - Create new keys and disable old ones
   - Document key rotation in audit logs
   - Rotate keys every 90 days

2. **Use Scoped Keys**
   - Create separate keys for different integrations
   - Name keys descriptively (e.g., "n8n-production", "n8n-staging")
   - Delete unused keys immediately

3. **Monitor Key Usage**
   - Review `last_used_at` timestamps
   - Alert on unusual usage patterns
   - Revoke keys from suspicious IPs

### Role-Based Access Control (RBAC)

**Roles:**
| Role | Permissions |
|------|-------------|
| `admin` | Full access to all endpoints including user and API key management |
| `staff` | Access to most endpoints, cannot manage users or API keys |
| `readonly` | Read-only access to data |

**Implementation:**
```javascript
// Middleware checks
requireRole('admin')    // Only admins
requireRole('admin', 'staff')  // Admins and staff
```

**Security Recommendations:**
1. Apply principle of least privilege
2. Regularly review user permissions
3. Create service accounts for automation with minimal permissions
4. Use `staff` role for n8n integrations (not `admin`)

---

## API Security

### CORS Configuration

**Current Configuration:**
```javascript
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true 
}));
```

**Security Recommendations:**

1. **Production CORS Settings**
   ```bash
   # Set explicit frontend origin
   FRONTEND_URL=https://your-frontend-domain.com
   ```

2. **Multiple Origins (if needed)**
   ```javascript
   const allowedOrigins = [
     'https://your-frontend.com',
     'https://admin.your-frontend.com'
   ];
   app.use(cors({
     origin: (origin, callback) => {
       if (!origin || allowedOrigins.includes(origin)) {
         callback(null, true);
       } else {
         callback(new Error('Not allowed by CORS'));
       }
     },
     credentials: true
   }));
   ```

3. **Disable CORS for Private Networks**
   - If n8n and backend are on same private network, CORS may not be needed
   - Consider using API gateway or reverse proxy

### Rate Limiting

**Current Configuration:**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

app.use('/api/', limiter);
```

**Security Recommendations:**

1. **Implement Tiered Rate Limits**
   ```javascript
   const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100, // General users
   });
   
   const apiRateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 1000, // API keys get higher limits
   });
   ```

2. **Add Endpoint-Specific Limits**
   ```javascript
   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5, // Strict limit on auth endpoints
     message: 'Too many login attempts'
   });
   
   app.use('/api/auth/login', authLimiter);
   ```

3. **Monitor Rate Limit Violations**
   - Log rate limit hits
   - Alert on repeated violations
   - Consider IP-based blocking for abuse

### Input Validation

**Current Implementation:**
- Uses Zod schema validation
- Type checking for all inputs
- Regex validation for dates and formats

**Example Validations:**
```javascript
const carSchema = z.object({
  plate_number: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  base_daily_rate: z.number().min(0),
  email: z.string().email(),
  // ...
});
```

**Security Recommendations:**

1. **Sanitize All Inputs**
   ```javascript
   import validator from 'validator';
   
   const email = validator.normalizeEmail(req.body.email);
   const plate = validator.escape(req.body.plate_number);
   ```

2. **Validate File Uploads**
   ```javascript
   // Already implemented in multer configuration
   const carUpload = multer({
     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
     fileFilter: (req, file, cb) => {
       const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
       if (allowedTypes.includes(file.mimetype)) {
         cb(null, true);
       } else {
         cb(new Error('Invalid file type'), false);
       }
     }
   });
   ```

3. **SQL Injection Protection**
   - Database uses prepared statements (via better-sqlite3)
   - No string concatenation in queries
   - $1, $2 parameter placeholders are safe

---

## Database Security

### SQLite Security Considerations

**Current Configuration:**
```javascript
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
```

**Security Recommendations:**

1. **File Permissions**
   ```bash
   # Restrict database file access
   chmod 600 /app/data/rental.db
   chmod 700 /app/data/
   
   # Ensure database directory is owned by app user
   chown appuser:appgroup /app/data/
   chown appuser:appgroup /app/data/rental.db
   ```

2. **Backup Security**
   ```bash
   # Encrypt backups
   gpg --encrypt --recipient admin@company.com rental_backup.db
   
   # Store in secure location with proper permissions
   chmod 600 /backups/*.db.gpg
   ```

3. **Disable Direct Access in Production**
   - Ensure database file is not accessible via web server
   - Use Docker volumes with restricted access
   - Never expose database file via HTTP

4. **Connection Pooling**
   - SQLite doesn't support true connection pooling
   - Use WAL mode for better concurrency
   - Consider PostgreSQL for high-concurrency deployments

### Sensitive Data Handling

**Sensitive Fields:**
- `users.password_hash` - Bcrypt hashed passwords
- `api_keys.token_hash` - SHA-256 hashed API tokens
- `customers.id_number` - ID/passport numbers
- `customers.license_expiry` - License information

**Recommendations:**

1. **Encryption at Rest (Optional)**
   ```bash
   # Use SQLite encryption extension (SEE) if needed
   # Requires recompiling SQLite with SEE support
   ```

2. **Data Masking in Logs**
   ```javascript
   // Never log sensitive data
   logger.info('User login', { userId: user.id, email: maskEmail(user.email) });
   
   function maskEmail(email) {
     const [local, domain] = email.split('@');
     return `${local[0]}***@${domain}`;
   }
   ```

3. **GDPR/Privacy Compliance**
   - Implement data export functionality
   - Provide data deletion on request
   - Document data retention policies

---

## n8n Integration Security

### Secure API Key Usage

**Implementation in n8n:**

1. **Use n8n Credentials Store**
   ```
   n8n Credentials → Header Auth
   Name: Rental Dashboard API
   Header Name: Authorization
   Header Value: Bearer YOUR_API_KEY
   ```

2. **Environment Variables for Secrets**
   ```javascript
   // In n8n Code node
   const apiKey = $env.RENTAL_DASHBOARD_API_KEY;
   ```

3. **Never Hardcode Credentials**
   ❌ Don't do this:
   ```json
   {
     "Header Value": "Bearer a1b2c3d4e5f6..."
   }
   ```
   
   ✅ Do this:
   ```json
   {
     "Header Value": "={{ $env.RENTAL_DASHBOARD_API_KEY }}"
   }
   ```

### Network Security

**Recommendations:**

1. **Private Network Communication**
   ```yaml
   # docker-compose.yml
   networks:
     deploy_internal:
       internal: true  # Blocks external access
   
   services:
     backend:
       networks:
         - deploy_internal
       # No 'ports' section - internal only
   
     n8n:
       networks:
         - deploy_internal
   ```

2. **Reverse Proxy with SSL**
   ```nginx
   # Nginx configuration
   server {
       listen 443 ssl http2;
       server_name api.yourdomain.com;
       
       ssl_certificate /etc/ssl/cert.pem;
       ssl_certificate_key /etc/ssl/key.pem;
       
       location /api/ {
           proxy_pass http://backend:3010;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **IP Whitelisting**
   ```bash
   # Using iptables
   iptables -A INPUT -p tcp -s <n8n_server_ip> --dport 3010 -j ACCEPT
   iptables -A INPUT -p tcp --dport 3010 -j DROP
   ```

### n8n Workflow Security

**Secure Workflow Practices:**

1. **Sanitize User Input**
   ```javascript
   // Always validate before sending to API
   const plate = validator.escape(input.plate_number);
   ```

2. **Error Handling Without Data Leakage**
   ```javascript
   try {
     const response = await apiCall();
     return { json: response };
   } catch (error) {
     // Log full error internally
     console.error(error);
     // Return generic message to user
     return { json: { error: 'An error occurred' } };
   }
   ```

3. **Rate Limit n8n Requests**
   ```javascript
   // Use wait nodes between API calls
   // Or implement exponential backoff
   ```

4. **Workflow Execution Logging**
   - Enable n8n execution logs
   - Log all API calls
   - Monitor for failed executions
   - Alert on suspicious patterns

---

## CORS Configuration

### Current Setup

```javascript
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true 
}));
```

### Security Recommendations

**Production Configuration:**

```javascript
// backend/src/index.js
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://admin.yourdomain.com',  // Admin panel
  'https://customer.yourdomain.com', // Customer portal
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  maxAge: 86400, // 24 hours
}));
```

---

## Rate Limiting

### Current Implementation

```javascript
// Default: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
});
```

### Enhanced Rate Limiting

**Tiered Implementation:**

```javascript
// backend/src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

export const apiKeyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
});
```

**Usage:**

```javascript
import { apiLimiter, authLimiter, apiKeyLimiter } from './middleware/rateLimiter.js';

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Apply to API key routes
app.use('/api/bookings', (req, res, next) => {
  if (req.headers['x-api-key']) {
    return apiKeyLimiter(req, res, next);
  }
  next();
});
```

---

## Input Validation

### Zod Schema Examples

**Comprehensive Validation:**

```javascript
import { z } from 'zod';
import validator from 'validator';

// Enhanced validation schemas
const customerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .transform((val) => validator.escape(val)),
  
  email: z.string()
    .email('Invalid email format')
    .transform((val) => validator.normalizeEmail(val)),
  
  phone: z.string()
    .min(10, 'Phone must be at least 10 digits')
    .max(20, 'Phone too long')
    .optional()
    .transform((val) => val ? validator.escape(val) : null),
  
  id_number: z.string()
    .max(50, 'ID number too long')
    .optional()
    .transform((val) => val ? validator.escape(val) : null),
});

const bookingSchema = z.object({
  car_id: z.number().int().positive('Invalid car ID'),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .transform((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return val;
    }),
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine((val, ctx) => {
      const start = new Date(ctx.parent.start_date);
      const end = new Date(val);
      return end > start;
    }, 'End date must be after start date'),
  total_price: z.number().min(0, 'Price cannot be negative'),
});
```

---

## Data Protection

### File Upload Security

**Current Implementation:**
```javascript
const carUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, carImagesDir),
    filename: (req, file, cb) => cb(null, 
      `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    ),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});
```

**Enhanced Security:**

```javascript
import sharp from 'sharp';

const carUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, carImagesDir),
    filename: (req, file, cb) => {
      // Generate random filename
      const ext = path.extname(file.originalname);
      const name = crypto.randomBytes(16).toString('hex');
      cb(null, `${name}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // Max 10 files
  },
});

// Process uploaded images
export async function processImage(filePath) {
  await sharp(filePath)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(filePath + '.processed');
  
  fs.unlinkSync(filePath);
  fs.renameSync(filePath + '.processed', filePath);
}
```

### Secure Headers

```javascript
// backend/src/index.js
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
}));

app.use(express.json({ limit: '10mb' }));
```

---

## Audit Logging

### Current Implementation

```javascript
// backend/src/services/auditService.js
export async function logAudit(userId, action, entityType, entityId, metadata) {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata_json)
       VALUES ($1, $2, $3, $4, $5)`,
    [userId, action, entityType, String(entityId), JSON.stringify(metadata)]
  );
}
```

### Enhanced Audit Logging

```javascript
// Enhanced audit logging with IP and user agent
export async function logAudit(req, action, entityType, entityId, metadata) {
  const auditData = {
    userId: req.user?.id,
    action,
    entityType,
    entityId: String(entityId),
    metadata: JSON.stringify(metadata),
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  };
  
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata_json)
       VALUES ($1, $2, $3, $4, $5)`,
    [auditData.userId, action, entityType, auditData.entityId, auditData.metadata]
  );
  
  // Also send to external logging service
  if (process.env.AUDIT_WEBHOOK_URL) {
    await fetch(process.env.AUDIT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditData),
    }).catch(console.error);
  }
}
```

---

## Deployment Security

### Docker Security

**Dockerfile Best Practices:**

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY --chown=nodejs:nodejs . .

# Create directories with proper permissions
RUN mkdir -p /app/data /app/uploads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3010/api/reports', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["node", "src/index.js"]
```

**docker-compose.yml Security:**

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
    secrets:
      - jwt_secret
    volumes:
      - uploads_data:/app/uploads
      - db_data:/app/data
    networks:
      - deploy_internal
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE

secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt

networks:
  deploy_internal:
    driver: bridge
    internal: true
```

### Environment Variables

**Never commit secrets:**

```bash
# .gitignore
.env
.env.local
.env.*.local
secrets/
*.key
*.pem
```

**Use Docker Secrets:**

```bash
# Create secret file
echo "your-super-secret-jwt-key" > ./secrets/jwt_secret.txt
chmod 600 ./secrets/jwt_secret.txt

# Use in docker-compose
environment:
  JWT_SECRET_FILE: /run/secrets/jwt_secret
```

### SSL/TLS Configuration

**Using Let's Encrypt (Certbot):**

```bash
# Install certbot
apt-get install certbot

# Generate certificate
certbot certonly --standalone -d api.yourdomain.com

# Configure Nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    location /api/ {
        proxy_pass http://backend:3010;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Best Practices

### 1. Regular Security Audits

- Review audit logs weekly
- Check for suspicious API usage patterns
- Verify user permissions are appropriate
- Review API key usage

### 2. Keep Dependencies Updated

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update
npm audit fix

# Use Snyk for deeper analysis
npx snyk test
```

### 3. Implement Monitoring

- Set up error tracking (Sentry, Bugsnag)
- Monitor API response times
- Track failed authentication attempts
- Alert on unusual activity

### 4. Backup Strategy

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
sqlite3 /app/data/rental.db ".backup $BACKUP_DIR/rental_$DATE.db"

# Uploads backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /app/uploads

# Encrypt backups
gpg --encrypt --recipient admin@company.com $BACKUP_DIR/rental_$DATE.db
gpg --encrypt --recipient admin@company.com $BACKUP_DIR/uploads_$DATE.tar.gz

# Remove old backups (keep last 30 days)
find $BACKUP_DIR -name "*.db.gpg" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz.gpg" -mtime +30 -delete
```

### 5. Incident Response Plan

1. **Immediately**
   - Rotate compromised API keys
   - Change JWT secret (requires all users to re-login)
   - Block suspicious IPs

2. **Within 1 hour**
   - Review audit logs for unauthorized access
   - Identify affected data
   - Notify stakeholders

3. **Within 24 hours**
   - Complete security assessment
   - Patch vulnerabilities
   - Document incident

4. **Post-incident**
   - Conduct post-mortem
   - Update security procedures
   - Implement preventive measures

---

## Security Checklist

### Initial Setup

- [ ] Generate strong JWT secret using `openssl rand -hex 32`
- [ ] Set appropriate JWT expiration (1-24 hours production)
- [ ] Configure CORS for production domain only
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set up rate limiting
- [ ] Create n8n API key with `staff` role (not `admin`)
- [ ] Configure audit logging
- [ ] Set up monitoring and alerts

### Ongoing Maintenance

- [ ] Review audit logs weekly
- [ ] Rotate API keys every 90 days
- [ ] Update dependencies monthly
- [ ] Test backup restoration quarterly
- [ ] Review user permissions quarterly
- [ ] Run security scans monthly
- [ ] Review and update CORS allowlist as needed

### n8n Integration

- [ ] Use n8n credentials store for API keys
- [ ] Implement error handling in workflows
- [ ] Add rate limiting to workflow calls
- [ ] Log all API interactions
- [ ] Set up alerts for failed workflow executions
- [ ] Use HTTPS for all API calls in production
- [ ] Sanitize all user inputs

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [SQLite Security](https://www.sqlite.org/security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
