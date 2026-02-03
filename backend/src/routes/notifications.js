import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const notificationsRouter = Router();
notificationsRouter.use(authMiddleware);

notificationsRouter.get('/', async (req, res, next) => {
  try {
    const { unread } = req.query;
    let q = `SELECT * FROM notifications WHERE user_id = $1`;
    const params = [req.user.id];
    
    if (unread) {
      q += ` AND is_read = 0`;
    }
    
    q += ` ORDER BY created_at DESC LIMIT 50`;
    const r = await pool.query(q, params);
    
    const notifications = r.rows.map((n) => ({
      ...n,
      is_read: n.is_read === 1,
    }));
    
    res.json(notifications);
  } catch (e) { next(e); }
});

notificationsRouter.get('/unread-count', async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = 0`,
      [req.user.id]
    );
    res.json({ count: r.rows[0].count });
  } catch (e) { next(e); }
});

notificationsRouter.put('/:id/read', async (req, res, next) => {
  try {
    const r = await pool.query(
      `UPDATE notifications SET is_read = 1 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    
    if (!r.rows[0]) throw new AppError('Notification not found', 404);
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

notificationsRouter.put('/read-all', async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE user_id = $1 AND is_read = 0`,
      [req.user.id]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export async function createNotification(data) {
  const { user_id, type, title, message, entity_type, entity_id } = data;
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [user_id, type, title, message, entity_type, entity_id]
  );
}

export async function getOverdueBookings() {
  const r = await pool.query(
    `SELECT b.*, c.plate_number, c.make, c.model, u.email as user_email
     FROM bookings b 
     JOIN cars c ON b.car_id = c.id
     JOIN users u ON b.customer_name = u.name
     WHERE b.status IN ('active', 'reserved')
       AND b.end_date < date('now')
       AND NOT EXISTS (
         SELECT 1 FROM notifications 
         WHERE entity_id = b.id 
           AND type = 'overdue'
           AND created_at > datetime(b.end_date)
       )
     ORDER BY b.end_date`
  );
  return r.rows;
}

export async function getExpiringCars(daysAhead = 30) {
  const r = await pool.query(
    `SELECT c.*, julianday(c.registration_expiry) - julianday(date('now')) as reg_days_left,
            julianday(c.insurance_expiry) - julianday(date('now')) as ins_days_left
     FROM cars c
     WHERE c.registration_expiry <= date('now', '+${daysAhead} days')
        OR c.insurance_expiry <= date('now', '+${daysAhead} days')
     ORDER BY c.registration_expiry, c.insurance_expiry`
  );
  return r.rows;
}
