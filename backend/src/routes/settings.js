import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const settingsRouter = Router();
settingsRouter.use(authMiddleware);
settingsRouter.use(requireAdmin);

const settingsSchema = z.object({
  agency_name: z.string().optional(),
  currency: z.string().optional(),
  vat_percent: z.number().min(0).max(100).optional(),
  logo_path: z.string().optional().nullable(),
});

settingsRouter.get('/', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT * FROM settings WHERE id = 1');
    const s = r.rows[0];
    if (!s) throw new AppError('Settings not found', 404);
    res.json({ ...s, vat_percent: parseFloat(s.vat_percent || 0) });
  } catch (e) { next(e); }
});

settingsRouter.put('/', async (req, res, next) => {
  try {
    const body = settingsSchema.parse(req.body);
    const updates = [];
    const values = [];
    let i = 1;
    if (body.agency_name !== undefined) { updates.push(`agency_name = $${i}`); values.push(body.agency_name); i++; }
    if (body.currency !== undefined) { updates.push(`currency = $${i}`); values.push(body.currency); i++; }
    if (body.vat_percent !== undefined) { updates.push(`vat_percent = $${i}`); values.push(body.vat_percent); i++; }
    if (body.logo_path !== undefined) { updates.push(`logo_path = $${i}`); values.push(body.logo_path); i++; }
    if (updates.length === 0) throw new AppError('No fields to update', 400);
    const r = await pool.query(`UPDATE settings SET ${updates.join(', ')} WHERE id = 1 RETURNING *`, values);
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});
