import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.js';
import { carsRouter } from './routes/cars.js';
import { availabilityRouter } from './routes/availability.js';
import { bookingsRouter } from './routes/bookings.js';
import { maintenanceRouter } from './routes/maintenance.js';
import { incidentsRouter } from './routes/incidents.js';
import { settingsRouter } from './routes/settings.js';
import { integrationsRouter } from './routes/integrations.js';
import { usersRouter } from './routes/users.js';
import { reportsRouter } from './routes/reports.js';
import { auditRouter } from './routes/audit.js';
import { branchesRouter } from './routes/branches.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRouter);
app.use('/api/cars', carsRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/branches', branchesRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
