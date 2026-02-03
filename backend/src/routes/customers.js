import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { logAudit } from '../services/auditService.js';

export const customersRouter = Router();
customersRouter.use(authMiddleware);

const customerSchema = z.object({
  email: z.string().email().optional().nullable(),
  phone: z.string().min(10).max(20).optional(),
  name: z.string().min(2).max(100),
  address: z.string().max(500).optional().nullable(),
  id_number: z.string().max(50).optional().nullable(),
  license_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

customersRouter.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    let q = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    let i = 1;
    
    if (search) {
      q += ` AND (name LIKE $${i} OR email LIKE $${i} OR phone LIKE $${i} OR id_number LIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }
    
    q += ' ORDER BY name';
    const r = await pool.query(q, params);
    res.json(r.rows);
  } catch (e) { next(e); }
});

customersRouter.get('/:id', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    const customer = r.rows[0];
    if (!customer) throw new AppError('Customer not found', 404);
    
    const bookings = await pool.query(
      `SELECT b.*, c.plate_number, c.make, c.model 
       FROM bookings b 
       JOIN cars c ON b.car_id = c.id 
       WHERE b.customer_id = $1 
       ORDER BY b.start_date DESC`,
      [req.params.id]
    );
    
    const withExtras = await Promise.all(bookings.rows.map(async (b) => {
      const ex = await pool.query('SELECT extra_name, extra_price FROM booking_extras WHERE booking_id = $1', [b.id]);
      return { ...b, extras: ex.rows };
    }));
    
    res.json({ ...customer, bookings: withExtras });
  } catch (e) { next(e); }
});

customersRouter.post('/', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const body = customerSchema.parse(req.body);
    const r = await pool.query(
      `INSERT INTO customers (email, phone, name, address, id_number, license_expiry) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [body.email ?? null, body.phone ?? null, body.name, body.address ?? null, body.id_number ?? null, body.license_expiry ?? null]
    );
    const customer = r.rows[0];
    await logAudit(req.user.id, 'create', 'customer', customer.id, { name: customer.name });
    res.status(201).json(customer);
  } catch (e) { next(e); }
});

customersRouter.put('/:id', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const body = customerSchema.partial().parse(req.body);
    const updates = [];
    const values = [];
    let i = 1;
    
    if (body.email !== undefined) { updates.push(`email = $${i}`); values.push(body.email); i++; }
    if (body.phone !== undefined) { updates.push(`phone = $${i}`); values.push(body.phone); i++; }
    if (body.name !== undefined) { updates.push(`name = $${i}`); values.push(body.name); i++; }
    if (body.address !== undefined) { updates.push(`address = $${i}`); values.push(body.address); i++; }
    if (body.id_number !== undefined) { updates.push(`id_number = $${i}`); values.push(body.id_number); i++; }
    if (body.license_expiry !== undefined) { updates.push(`license_expiry = $${i}`); values.push(body.license_expiry); i++; }
    
    if (updates.length === 0) throw new AppError('No fields to update', 400);
    
    values.push(req.params.id);
    const r = await pool.query(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    const customer = r.rows[0];
    if (!customer) throw new AppError('Customer not found', 404);
    await logAudit(req.user.id, 'update', 'customer', customer.id, body);
    res.json(customer);
  } catch (e) { next(e); }
});

customersRouter.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const r = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) throw new AppError('Customer not found', 404);
    await logAudit(req.user.id, 'delete', 'customer', req.params.id, {});
    res.json({ ok: true });
  } catch (e) { next(e); }
});
