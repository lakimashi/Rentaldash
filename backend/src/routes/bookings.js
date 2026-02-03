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
  customer_id: z.number().int().optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['draft', 'reserved', 'confirmed', 'active', 'completed', 'cancelled']).optional(),
  total_price: z.number().min(0).optional(),
  deposit: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
  extras: z.array(z.object({ extra_name: z.string(), extra_price: z.number() })).optional(),
  start_mileage: z.number().int().optional().nullable(),
  end_mileage: z.number().int().optional().nullable(),
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
      customer_id: req.body.customer_id != null ? Number(req.body.customer_id) : undefined,
      total_price: req.body.total_price != null ? Number(req.body.total_price) : 0,
      deposit: req.body.deposit != null ? Number(req.body.deposit) : 0,
      start_mileage: req.body.start_mileage != null ? Number(req.body.start_mileage) : undefined,
      end_mileage: req.body.end_mileage != null ? Number(req.body.end_mileage) : undefined,
    });
    if (new Date(body.start_date) >= new Date(body.end_date)) throw new AppError('end_date must be after start_date', 400);
    const conflict = await hasConflict(body.car_id, body.start_date, body.end_date);
    if (conflict) throw new AppError('Car is not available for this date range', 400);
    const status = body.status || 'draft';
    
    const r = await pool.query(
      `INSERT INTO bookings (car_id, customer_name, customer_phone, customer_id_passport, customer_id, start_date, end_date, status, total_price, deposit, notes, start_mileage, end_mileage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [body.car_id, body.customer_name, body.customer_phone ?? null, body.customer_id_passport ?? null, body.customer_id ?? null, body.start_date, body.end_date, status, body.total_price ?? 0, body.deposit ?? 0, body.notes ?? null, body.start_mileage ?? null, body.end_mileage ?? null]
    );
    const booking = r.rows[0];
    
    if (body.extras?.length) {
      for (const e of body.extras) {
        await pool.query('INSERT INTO booking_extras (booking_id, extra_name, extra_price) VALUES ($1, $2, $3)', [booking.id, e.extra_name, e.extra_price]);
      }
    }
    
    if (booking.start_mileage) {
      await pool.query('UPDATE cars SET current_mileage = $1 WHERE id = $2', [booking.start_mileage, booking.car_id]);
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

bookingsRouter.put('/:id', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const existing = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) throw new AppError('Booking not found', 404);
    if (['completed', 'cancelled'].includes(existing.rows[0].status)) {
      throw new AppError('Cannot edit completed or cancelled bookings', 400);
    }
    
    const body = bookingSchema.partial().parse({
      ...req.body,
      car_id: req.body.car_id != null ? Number(req.body.car_id) : undefined,
      customer_id: req.body.customer_id != null ? Number(req.body.customer_id) : undefined,
      total_price: req.body.total_price != null ? Number(req.body.total_price) : undefined,
      deposit: req.body.deposit != null ? Number(req.body.deposit) : undefined,
      start_mileage: req.body.start_mileage != null ? Number(req.body.start_mileage) : undefined,
      end_mileage: req.body.end_mileage != null ? Number(req.body.end_mileage) : undefined,
    });
    
    const updates = [];
    const values = [];
    let i = 1;
    
    if (body.car_id !== undefined) { updates.push(`car_id = $${i}`); values.push(body.car_id); i++; }
    if (body.customer_name !== undefined) { updates.push(`customer_name = $${i}`); values.push(body.customer_name); i++; }
    if (body.customer_phone !== undefined) { updates.push(`customer_phone = $${i}`); values.push(body.customer_phone); i++; }
    if (body.customer_id_passport !== undefined) { updates.push(`customer_id_passport = $${i}`); values.push(body.customer_id_passport); i++; }
    if (body.customer_id !== undefined) { updates.push(`customer_id = $${i}`); values.push(body.customer_id); i++; }
    if (body.start_date !== undefined) { updates.push(`start_date = $${i}`); values.push(body.start_date); i++; }
    if (body.end_date !== undefined) { updates.push(`end_date = $${i}`); values.push(body.end_date); i++; }
    if (body.status !== undefined) { updates.push(`status = $${i}`); values.push(body.status); i++; }
    if (body.total_price !== undefined) { updates.push(`total_price = $${i}`); values.push(body.total_price); i++; }
    if (body.deposit !== undefined) { updates.push(`deposit = $${i}`); values.push(body.deposit); i++; }
    if (body.notes !== undefined) { updates.push(`notes = $${i}`); values.push(body.notes); i++; }
    if (body.start_mileage !== undefined) { updates.push(`start_mileage = $${i}`); values.push(body.start_mileage); i++; }
    if (body.end_mileage !== undefined) { updates.push(`end_mileage = $${i}`); values.push(body.end_mileage); i++; }
    
    if (updates.length === 0) throw new AppError('No fields to update', 400);
    
    values.push(req.params.id);
    const r = await pool.query(
      `UPDATE bookings SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    
    const booking = r.rows[0];
    
    if (body.start_date || body.end_date || body.car_id) {
      const conflict = await hasConflict(booking.car_id, booking.start_date, booking.end_date, booking.id);
      if (conflict) throw new AppError('Car is not available for this date range', 400);
    }
    
    if (body.extras !== undefined) {
      await pool.query('DELETE FROM booking_extras WHERE booking_id = $1', [booking.id]);
      if (body.extras.length) {
        for (const e of body.extras) {
          await pool.query('INSERT INTO booking_extras (booking_id, extra_name, extra_price) VALUES ($1, $2, $3)', [booking.id, e.extra_name, e.extra_price]);
        }
      }
    }
    
    if (body.end_mileage && body.start_mileage) {
      const milesDriven = body.end_mileage - body.start_mileage;
      await pool.query('UPDATE bookings SET miles_driven = $1 WHERE id = $2', [milesDriven, booking.id]);
      await pool.query('UPDATE cars SET current_mileage = $1 WHERE id = $2', [body.end_mileage, booking.car_id]);
    }
    
    await logAudit(req.user.id, 'update', 'booking', booking.id, body);
    res.json(booking);
  } catch (e) { next(e); }
});
