import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export const reportsRouter = Router();
reportsRouter.use(authMiddleware);

reportsRouter.get('/', async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [carsTotal, availableToday, bookingsToday, activeRentals, pendingIncidents, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) AS c FROM cars WHERE status = $1', ['active']),
      pool.query(
        `SELECT COUNT(DISTINCT c.id) AS c FROM cars c
         WHERE c.status = 'active'
         AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.car_id = c.id AND b.status IN ('reserved','confirmed','active') AND b.start_date < $1 AND b.end_date > $1)
         AND NOT EXISTS (SELECT 1 FROM maintenance_blocks m WHERE m.car_id = c.id AND m.start_date < $1 AND m.end_date > $1)`,
        [today]
      ),
      pool.query(
        "SELECT COUNT(*) AS c FROM bookings WHERE status IN ('reserved','confirmed','active') AND start_date <= $1 AND end_date >= $1",
        [today]
      ),
      pool.query("SELECT COUNT(*) AS c FROM bookings WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) AS c FROM incidents WHERE status = 'open'"),
      pool.query(
        "SELECT COALESCE(SUM(total_price), 0) AS total FROM bookings WHERE status = 'completed'"
      ),
    ]);
    const utilization = carsTotal.rows[0]?.c > 0
      ? Math.round((activeRentals.rows[0]?.c / carsTotal.rows[0].c) * 100)
      : 0;
    res.json({
      cars_total: Number(carsTotal.rows[0]?.c),
      available_today: Number(availableToday.rows[0]?.c),
      bookings_today: Number(bookingsToday.rows[0]?.c),
      active_rentals: Number(activeRentals.rows[0]?.c),
      pending_incidents: Number(pendingIncidents.rows[0]?.c),
      revenue_total: parseFloat(revenue.rows[0]?.total || 0),
      utilization_percent: utilization,
    });
  } catch (e) { next(e); }
});

reportsRouter.get('/export/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    if (!['bookings', 'cars', 'incidents'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Use bookings, cars, or incidents.' });
    }
    let rows = [];
    let headers = [];
    if (type === 'bookings') {
      const r = await pool.query(
        'SELECT b.id, b.customer_name, b.customer_phone, b.start_date, b.end_date, b.status, b.total_price, b.deposit, c.plate_number FROM bookings b JOIN cars c ON b.car_id = c.id ORDER BY b.start_date DESC'
      );
      rows = r.rows;
      headers = ['id', 'customer_name', 'customer_phone', 'start_date', 'end_date', 'status', 'total_price', 'deposit', 'plate_number'];
    } else if (type === 'cars') {
      const r = await pool.query('SELECT id, plate_number, make, model, year, class, status, base_daily_rate FROM cars ORDER BY plate_number');
      rows = r.rows;
      headers = ['id', 'plate_number', 'make', 'model', 'year', 'class', 'status', 'base_daily_rate'];
    } else {
      const r = await pool.query('SELECT i.id, i.incident_date, i.severity, i.description, i.estimated_cost, i.status, c.plate_number FROM incidents i JOIN cars c ON i.car_id = c.id ORDER BY i.incident_date DESC');
      rows = r.rows;
      headers = ['id', 'incident_date', 'severity', 'description', 'estimated_cost', 'status', 'plate_number'];
    }
    const csvRows = rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(','));
    const csv = [headers.join(','), ...csvRows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
});

reportsRouter.get('/profit', async (req, res, next) => {
  try {
    const { car_id, from, to } = req.query;
    let whereClause = 'WHERE b.status IN (\'completed\', \'active\')';
    const params = [];
    let i = 1;
    
    if (car_id) { whereClause += ` AND b.car_id = $${i}`; params.push(car_id); i++; }
    if (from) { whereClause += ` AND b.start_date >= $${i}`; params.push(from); i++; }
    if (to) { whereClause += ` AND b.start_date <= $${i}`; params.push(to); i++; }
    
    const r = await pool.query(
      `SELECT 
        b.car_id,
        c.plate_number,
        c.make,
        c.model,
        SUM(b.total_price - b.deposit) as revenue,
        COALESCE(SUM(e.amount), 0) as expenses,
        SUM(b.total_price - b.deposit) - COALESCE(SUM(e.amount), 0) as profit,
        COUNT(b.id) as bookings_count
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       LEFT JOIN expenses e ON e.car_id = c.id
       ${whereClause}
       GROUP BY b.car_id
       ORDER BY profit DESC`,
      params
    );
    
    const profitData = r.rows.map((row) => ({
      car_id: row.car_id,
      plate_number: row.plate_number,
      make: row.make,
      model: row.model,
      revenue: parseFloat(row.revenue || 0),
      expenses: parseFloat(row.expenses || 0),
      profit: parseFloat(row.profit || 0),
      bookings_count: row.bookings_count,
    }));
    
    const totals = await pool.query(
      `SELECT 
        SUM(b.total_price - b.deposit) as total_revenue,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        SUM(b.total_price - b.deposit) - COALESCE(SUM(e.amount), 0) as total_profit
       FROM bookings b
       LEFT JOIN expenses e ON e.car_id = b.car_id
       ${whereClause}`,
      params
    );
    
    const categoryBreakdown = await pool.query(
      `SELECT 
        category,
        COALESCE(SUM(amount), 0) as total
       FROM expenses e
       WHERE 1=1
       GROUP BY category
       ORDER BY total DESC`
    );
    
    res.json({
      by_vehicle: profitData,
      totals: {
        revenue: parseFloat(totals.rows[0]?.total_revenue || 0),
        expenses: parseFloat(totals.rows[0]?.total_expenses || 0),
        profit: parseFloat(totals.rows[0]?.total_profit || 0),
      },
      by_category: categoryBreakdown.rows.map((row) => ({
        category: row.category,
        total: parseFloat(row.total || 0),
      })),
    });
  } catch (e) { next(e); }
});
