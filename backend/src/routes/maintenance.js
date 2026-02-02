import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const maintenanceRouter = Router();
maintenanceRouter.use(authMiddleware);

const maintenanceSchema = z.object({
  car_id: z.number().int(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional().nullable(),
});

maintenanceRouter.get('/', async (req, res, next) => {
  try {
    const { car_id } = req.query;
    let q = 'SELECT m.*, c.plate_number, c.make, c.model FROM maintenance_blocks m JOIN cars c ON m.car_id = c.id WHERE 1=1';
    const params = car_id ? [car_id] : [];
    if (car_id) q += ' AND m.car_id = $1';
    q += ' ORDER BY m.start_date DESC';
    const r = await pool.query(q, params);
    res.json(r.rows);
  } catch (e) { next(e); }
});

maintenanceRouter.post('/', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const body = maintenanceSchema.parse({
      ...req.body,
      car_id: req.body.car_id != null ? Number(req.body.car_id) : undefined,
    });
    if (new Date(body.start_date) >= new Date(body.end_date)) throw new AppError('end_date must be after start_date', 400);
    const r = await pool.query(
      'INSERT INTO maintenance_blocks (car_id, start_date, end_date, reason) VALUES ($1, $2, $3, $4) RETURNING *',
      [body.car_id, body.start_date, body.end_date, body.reason ?? null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { next(e); }
});
