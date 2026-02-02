import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { hasConflict } from '../services/availabilityService.js';
import { logAudit } from '../services/auditService.js';

export const bookingsRouter = Router();
bookingsRouter.use(authMiddleware);

const bookingSchema = z.object({
  car_id: z.number().int(),
  customer_name: z.string().min(1),
  customer_phone: z.string().optional().nullable(),
  customer_id_passport: z.string().optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['draft', 'reserved', 'confirmed', 'active', 'completed', 'cancelled']).optional(),
  total_price: z.number().min(0).optional(),
  deposit: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
  extras: z.array(z.object({ extra_name: z.string(), extra_price: z.number() })).optional(),
});

bookingsRouter.get('/', async (req, res, next) => {
  try {
    const { status, car_id, from, to } = req.query;
    let q = `SELECT b.*, c.plate_number, c.make, c.model FROM bookings b JOIN cars c ON b.car_id = c.id WHERE 1=1`;
    const params = [];
    let i = 1;
    if (status) { q += ` AND b.status = $${i}`; params.push(status); i++; }
    if (car_id) { q += ` AND b.car_id = $${i}`; params.push(car_id); i++; }
    if (from) { q += ` AND b.end_date >= $${i}`; params.push(from); i++; }
    if (to) { q += ` AND b.start_date <= $${i}`; params.push(to); i++; }
    q += ' ORDER BY b.start_date DESC';
    const r = await pool.query(q, params);
    const bookings = r.rows.map((b) => ({
      ...b,
      total_price: parseFloat(b.total_price),
      deposit: parseFloat(b.deposit),
    }));
    const withExtras = await Promise.all(bookings.map(async (b) => {
      const ex = await pool.query('SELECT extra_name, extra_price FROM booking_extras WHERE booking_id = $1', [b.id]);
      return { ...b, extras: ex.rows };
    }));
    res.json(withExtras);
  } catch (e) { next(e); }
});

bookingsRouter.get('/:id', async (req, res, next) => {
  try {
    const r = await pool.query(
      'SELECT b.*, c.plate_number, c.make, c.model, c.class FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
      [req.params.id]
    );
    const b = r.rows[0];
    if (!b) throw new AppError('Booking not found', 404);
    const ex = await pool.query('SELECT extra_name, extra_price FROM booking_extras WHERE booking_id = $1', [b.id]);
    res.json({ ...b, total_price: parseFloat(b.total_price), deposit: parseFloat(b.deposit), extras: ex.rows });
  } catch (e) { next(e); }
});

bookingsRouter.post('/', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const body = bookingSchema.parse({
      ...req.body,
      car_id: req.body.car_id != null ? Number(req.body.car_id) : undefined,
      total_price: req.body.total_price != null ? Number(req.body.total_price) : 0,
      deposit: req.body.deposit != null ? Number(req.body.deposit) : 0,
    });
    if (new Date(body.start_date) >= new Date(body.end_date)) throw new AppError('end_date must be after start_date', 400);
    const conflict = await hasConflict(body.car_id, body.start_date, body.end_date);
    if (conflict) throw new AppError('Car is not available for this date range', 400);
    const status = body.status || 'draft';
    const r = await pool.query(
      `INSERT INTO bookings (car_id, customer_name, customer_phone, customer_id_passport, start_date, end_date, status, total_price, deposit, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [body.car_id, body.customer_name, body.customer_phone ?? null, body.customer_id_passport ?? null, body.start_date, body.end_date, status, body.total_price ?? 0, body.deposit ?? 0, body.notes ?? null]
    );
    const booking = r.rows[0];
    if (body.extras?.length) {
      for (const e of body.extras) {
        await pool.query('INSERT INTO booking_extras (booking_id, extra_name, extra_price) VALUES ($1, $2, $3)', [booking.id, e.extra_name, e.extra_price]);
      }
    }
    await logAudit(req.user.id, 'create', 'booking', booking.id, { status: booking.status });
    res.status(201).json({ ...booking, total_price: parseFloat(booking.total_price), deposit: parseFloat(booking.deposit) });
  } catch (e) { next(e); }
});

bookingsRouter.put('/:id/status', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['draft', 'reserved', 'confirmed', 'active', 'completed', 'cancelled'].includes(status)) {
      throw new AppError('Valid status required', 400);
    }
    const r = await pool.query('UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    const booking = r.rows[0];
    if (!booking) throw new AppError('Booking not found', 404);
    await logAudit(req.user.id, 'status_change', 'booking', booking.id, { status });
    res.json(booking);
  } catch (e) { next(e); }
});
