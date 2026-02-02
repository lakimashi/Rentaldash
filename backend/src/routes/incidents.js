import { Router } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import pool from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { logAudit } from '../services/auditService.js';

export const incidentsRouter = Router();
incidentsRouter.use(authMiddleware);

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const incidentDir = path.join(uploadDir, 'incidents');
if (!fs.existsSync(incidentDir)) fs.mkdirSync(incidentDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, incidentDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const incidentSchema = z.object({
  car_id: z.number().int(),
  booking_id: z.number().int().optional().nullable(),
  incident_date: z.string(),
  severity: z.enum(['minor', 'major']),
  description: z.string().optional().nullable(),
  estimated_cost: z.number().optional().nullable(),
  status: z.enum(['open', 'under_review', 'resolved']).optional(),
});

incidentsRouter.get('/', async (req, res, next) => {
  try {
    const { status, car_id, severity } = req.query;
    let q = 'SELECT i.*, c.plate_number, c.make, c.model FROM incidents i JOIN cars c ON i.car_id = c.id WHERE 1=1';
    const params = [];
    let i = 1;
    if (status) { q += ` AND i.status = $${i}`; params.push(status); i++; }
    if (car_id) { q += ` AND i.car_id = $${i}`; params.push(car_id); i++; }
    if (severity) { q += ` AND i.severity = $${i}`; params.push(severity); i++; }
    q += ' ORDER BY i.incident_date DESC';
    const r = await pool.query(q, params);
    const incidents = r.rows.map((inc) => ({ ...inc, estimated_cost: inc.estimated_cost != null ? parseFloat(inc.estimated_cost) : null }));
    const withImages = await Promise.all(incidents.map(async (inc) => {
      const imgs = await pool.query('SELECT id, url_path FROM incident_images WHERE incident_id = $1', [inc.id]);
      return { ...inc, images: imgs.rows };
    }));
    res.json(withImages);
  } catch (e) { next(e); }
});

incidentsRouter.get('/:id', async (req, res, next) => {
  try {
    const r = await pool.query(
      'SELECT i.*, c.plate_number, c.make, c.model FROM incidents i JOIN cars c ON i.car_id = c.id WHERE i.id = $1',
      [req.params.id]
    );
    const inc = r.rows[0];
    if (!inc) throw new AppError('Incident not found', 404);
    const imgs = await pool.query('SELECT id, url_path FROM incident_images WHERE incident_id = $1', [inc.id]);
    res.json({ ...inc, estimated_cost: inc.estimated_cost != null ? parseFloat(inc.estimated_cost) : null, images: imgs.rows });
  } catch (e) { next(e); }
});

incidentsRouter.post('/', requireRole('admin', 'staff'), upload.array('images', 5), async (req, res, next) => {
  try {
    const body = incidentSchema.parse({
      ...req.body,
      car_id: req.body.car_id != null ? Number(req.body.car_id) : undefined,
      booking_id: req.body.booking_id != null ? Number(req.body.booking_id) : undefined,
      estimated_cost: req.body.estimated_cost != null ? Number(req.body.estimated_cost) : undefined,
    });
    const r = await pool.query(
      `INSERT INTO incidents (car_id, booking_id, incident_date, severity, description, estimated_cost, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [body.car_id, body.booking_id ?? null, body.incident_date, body.severity, body.description ?? null, body.estimated_cost ?? null, body.status ?? 'open']
    );
    const incident = r.rows[0];
    if (req.files?.length) {
      for (const f of req.files) {
        const relPath = `/uploads/incidents/${path.basename(f.filename)}`;
        await pool.query('INSERT INTO incident_images (incident_id, url_path) VALUES ($1, $2)', [incident.id, relPath]);
      }
    }
    await logAudit(req.user.id, 'create', 'incident', incident.id, { severity: incident.severity });
    res.status(201).json(incident);
  } catch (e) { next(e); }
});

incidentsRouter.put('/:id/status', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['open', 'under_review', 'resolved'].includes(status)) throw new AppError('Valid status required', 400);
    const r = await pool.query('UPDATE incidents SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    const inc = r.rows[0];
    if (!inc) throw new AppError('Incident not found', 404);
    await logAudit(req.user.id, 'status_change', 'incident', inc.id, { status });
    res.json(inc);
  } catch (e) { next(e); }
});
