import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { authMiddleware, requireAdmin, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const settingsRouter = Router();
settingsRouter.use(authMiddleware);

const settingsSchema = z.object({
  agency_name: z.string().optional(),
  currency: z.string().optional(),
  vat_percent: z.number().min(0).max(100).optional(),
  logo_path: z.string().optional().nullable(),
});

const lateFeeRuleSchema = z.object({
  hours_from: z.number().int().min(0),
  hours_to: z.number().int().optional().nullable(),
  fee_amount: z.number().min(0),
  fee_type: z.enum(['flat', 'percentage']),
  is_active: z.boolean().optional(),
});

settingsRouter.get('/', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT * FROM settings WHERE id = 1');
    const s = r.rows[0];
    if (!s) throw new AppError('Settings not found', 404);
    res.json({ ...s, vat_percent: parseFloat(s.vat_percent || 0) });
  } catch (e) { next(e); }
});

settingsRouter.put('/', requireAdmin, async (req, res, next) => {
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

settingsRouter.get('/late-fee-rules', requireAdmin, async (req, res, next) => {
  try {
    const r = await pool.query('SELECT * FROM late_fee_rules ORDER BY hours_from');
    res.json(r.rows);
  } catch (e) { next(e); }
});

settingsRouter.post('/late-fee-rules', requireAdmin, async (req, res, next) => {
  try {
    const body = lateFeeRuleSchema.parse({
      ...req.body,
      fee_amount: Number(req.body.fee_amount),
      hours_from: Number(req.body.hours_from),
      hours_to: req.body.hours_to != null ? Number(req.body.hours_to) : null,
      is_active: req.body.is_active !== undefined ? req.body.is_active : true,
    });
    const r = await pool.query(
      `INSERT INTO late_fee_rules (hours_from, hours_to, fee_amount, fee_type, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [body.hours_from, body.hours_to, body.fee_amount, body.fee_type, body.is_active ? 1 : 0]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { next(e); }
});

settingsRouter.put('/late-fee-rules/:id', requireAdmin, async (req, res, next) => {
  try {
    const body = lateFeeRuleSchema.partial().parse({
      ...req.body,
      fee_amount: req.body.fee_amount != null ? Number(req.body.fee_amount) : undefined,
      hours_from: req.body.hours_from != null ? Number(req.body.hours_from) : undefined,
      hours_to: req.body.hours_to != null ? Number(req.body.hours_to) : undefined,
      is_active: req.body.is_active,
    });

    const updates = [];
    const values = [];
    let i = 1;

    if (body.hours_from !== undefined) { updates.push(`hours_from = $${i}`); values.push(body.hours_from); i++; }
    if (body.hours_to !== undefined) { updates.push(`hours_to = $${i}`); values.push(body.hours_to); i++; }
    if (body.fee_amount !== undefined) { updates.push(`fee_amount = $${i}`); values.push(body.fee_amount); i++; }
    if (body.fee_type !== undefined) { updates.push(`fee_type = $${i}`); values.push(body.fee_type); i++; }
    if (body.is_active !== undefined) { updates.push(`is_active = $${i}`); values.push(body.is_active ? 1 : 0); i++; }

    if (updates.length === 0) throw new AppError('No fields to update', 400);

    values.push(req.params.id);
    const r = await pool.query(
      `UPDATE late_fee_rules SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );

    if (!r.rows[0]) throw new AppError('Late fee rule not found', 404);
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

settingsRouter.delete('/late-fee-rules/:id', requireAdmin, async (req, res, next) => {
  try {
    const r = await pool.query('DELETE FROM late_fee_rules WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) throw new AppError('Late fee rule not found', 404);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
