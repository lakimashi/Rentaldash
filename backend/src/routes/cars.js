import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { z } from 'zod';
import pool from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { logAudit } from '../services/auditService.js';

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const carImagesDir = path.join(uploadDir, 'cars');
const vehicleDocsDir = path.join(uploadDir, 'vehicles');
if (!fs.existsSync(carImagesDir)) fs.mkdirSync(carImagesDir, { recursive: true });
if (!fs.existsSync(vehicleDocsDir)) fs.mkdirSync(vehicleDocsDir, { recursive: true });
const carUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, carImagesDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const documentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, vehicleDocsDir),
    filename: (req, file, cb) => cb(null, `${req.params.id}_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const carsRouter = Router();
carsRouter.use(authMiddleware);

// Validation constraints from environment
const CAR_YEAR_MIN = parseInt(process.env.CAR_YEAR_MIN || '1900');
const CAR_YEAR_MAX = parseInt(process.env.CAR_YEAR_MAX || '2100');

const carSchema = z.object({
  plate_number: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(CAR_YEAR_MIN).max(CAR_YEAR_MAX),
  class: z.string().min(1),
  branch_id: z.number().int().optional().nullable(),
  status: z.enum(['active', 'maintenance', 'inactive']).optional(),
  base_daily_rate: z.number().min(0),
  vin: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  current_mileage: z.number().int().min(0).optional(),
  registration_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  insurance_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

carsRouter.get('/', async (req, res, next) => {
  try {
    const { status, class: carClass, branch_id } = req.query;
    let q = 'SELECT c.*, b.name AS branch_name, COUNT(vd.id) as doc_count FROM cars c LEFT JOIN branches b ON c.branch_id = b.id LEFT JOIN vehicle_documents vd ON c.id = vd.car_id WHERE 1=1';
    const params = [];
    let i = 1;
    if (status) { q += ` AND c.status = $${i}`; params.push(status); i++; }
    if (carClass) { q += ` AND c.class = $${i}`; params.push(carClass); i++; }
    if (branch_id) { q += ` AND c.branch_id = $${i}`; params.push(branch_id); i++; }
    q += ' GROUP BY c.id ORDER BY c.plate_number';
    const r = await pool.query(q, params);
    const cars = r.rows.map((c) => ({ ...c, base_daily_rate: parseFloat(c.base_daily_rate), doc_count: c.doc_count || 0 }));
    const withImages = await Promise.all(cars.map(async (car) => {
      const imgs = await pool.query('SELECT id, url_path FROM car_images WHERE car_id = $1', [car.id]);
      return { ...car, images: imgs.rows };
    }));
    res.json(withImages);
  } catch (e) { next(e); }
});

carsRouter.get('/:id', async (req, res, next) => {
  try {
    const r = await pool.query(
      'SELECT c.*, b.name AS branch_name FROM cars c LEFT JOIN branches b ON c.branch_id = b.id WHERE c.id = $1',
      [req.params.id]
    );
    const car = r.rows[0];
    if (!car) throw new AppError('Car not found', 404);
    const imgs = await pool.query('SELECT id, url_path FROM car_images WHERE car_id = $1', [car.id]);
    res.json({ ...car, base_daily_rate: parseFloat(car.base_daily_rate), images: imgs.rows });
  } catch (e) { next(e); }
});

carsRouter.post('/', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const body = carSchema.parse({
      ...req.body,
      year: req.body.year != null ? Number(req.body.year) : undefined,
      current_mileage: req.body.current_mileage != null ? Number(req.body.current_mileage) : undefined,
    });
    const existing = await pool.query('SELECT 1 FROM cars WHERE plate_number = $1', [body.plate_number]);
    if (existing.rows.length) throw new AppError('Plate number already exists', 400);
    const r = await pool.query(
      `INSERT INTO cars (plate_number, make, model, year, class, branch_id, status, base_daily_rate, vin, notes, current_mileage, registration_expiry, insurance_expiry)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [body.plate_number, body.make, body.model, body.year, body.class, body.branch_id ?? null, body.status ?? 'active', body.base_daily_rate, body.vin ?? null, body.notes ?? null, body.current_mileage ?? 0, body.registration_expiry ?? null, body.insurance_expiry ?? null]
    );
    const car = r.rows[0];
    await logAudit(req.user.id, 'create', 'car', car.id, { plate_number: car.plate_number });
    res.status(201).json({ ...car, base_daily_rate: parseFloat(car.base_daily_rate) });
  } catch (e) { next(e); }
});

carsRouter.put('/:id', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const body = carSchema.partial().parse({
      ...req.body,
      year: req.body.year != null ? Number(req.body.year) : undefined,
      current_mileage: req.body.current_mileage != null ? Number(req.body.current_mileage) : undefined,
    });
    const updates = [];
    const values = [];
    let i = 1;
    if (body.plate_number !== undefined) { updates.push(`plate_number = $${i}`); values.push(body.plate_number); i++; }
    if (body.make !== undefined) { updates.push(`make = $${i}`); values.push(body.make); i++; }
    if (body.model !== undefined) { updates.push(`model = $${i}`); values.push(body.model); i++; }
    if (body.year !== undefined) { updates.push(`year = $${i}`); values.push(body.year); i++; }
    if (body.class !== undefined) { updates.push(`class = $${i}`); values.push(body.class); i++; }
    if (body.branch_id !== undefined) { updates.push(`branch_id = $${i}`); values.push(body.branch_id); i++; }
    if (body.status !== undefined) { updates.push(`status = $${i}`); values.push(body.status); i++; }
    if (body.base_daily_rate !== undefined) { updates.push(`base_daily_rate = $${i}`); values.push(body.base_daily_rate); i++; }
    if (body.vin !== undefined) { updates.push(`vin = $${i}`); values.push(body.vin); i++; }
    if (body.notes !== undefined) { updates.push(`notes = $${i}`); values.push(body.notes); i++; }
    if (body.current_mileage !== undefined) { updates.push(`current_mileage = $${i}`); values.push(body.current_mileage); i++; }
    if (body.registration_expiry !== undefined) { updates.push(`registration_expiry = $${i}`); values.push(body.registration_expiry); i++; }
    if (body.insurance_expiry !== undefined) { updates.push(`insurance_expiry = $${i}`); values.push(body.insurance_expiry); i++; }
    if (updates.length === 0) throw new AppError('No fields to update', 400);
    values.push(req.params.id);
    const r = await pool.query(
      `UPDATE cars SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    const car = r.rows[0];
    if (!car) throw new AppError('Car not found', 404);
    await logAudit(req.user.id, 'update', 'car', car.id, body);
    res.json({ ...car, base_daily_rate: parseFloat(car.base_daily_rate) });
  } catch (e) { next(e); }
});



carsRouter.post('/bulk-delete', requireRole('admin'), async (req, res, next) => {
  try {
    const { ids } = z.object({ ids: z.array(z.number()) }).parse(req.body);
    if (!ids.length) return res.json({ ok: true });

    // Check if any car has active bookings
    const placeholders = ids.map(() => '?').join(',');
    const active = await pool.query(
      `SELECT DISTINCT car_id FROM bookings WHERE car_id IN (${placeholders}) AND status IN ('active', 'confirmed', 'reserved')`,
      ids
    );
    if (active.rows.length > 0) {
      throw new AppError('Some selected cars have active or confirmed bookings and cannot be deleted.', 400);
    }

    await pool.query(`UPDATE cars SET status = 'inactive' WHERE id IN (${placeholders})`, ids);
    await logAudit(req.user.id, 'bulk_archive', 'car', null, { ids });
    res.json({ ok: true });
  } catch (e) { next(e); }
});


carsRouter.post('/:id/images', requireRole('admin', 'staff'), carUpload.array('images', 10), async (req, res, next) => {
  try {
    const carId = req.params.id;
    const r = await pool.query('SELECT 1 FROM cars WHERE id = $1', [carId]);
    if (!r.rows[0]) throw new AppError('Car not found', 404);
    const inserted = [];
    for (const f of req.files || []) {
      const urlPath = `/uploads/cars/${path.basename(f.filename)}`;
      const ins = await pool.query('INSERT INTO car_images (car_id, url_path) VALUES ($1, $2) RETURNING id, url_path', [carId, urlPath]);
      inserted.push(ins.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (e) { next(e); }
});

carsRouter.get('/:id/documents', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const r = await pool.query('SELECT * FROM vehicle_documents WHERE car_id = $1 ORDER BY created_at DESC', [req.params.id]);
    res.json(r.rows);
  } catch (e) { next(e); }
});

carsRouter.post('/:id/documents', requireRole('admin', 'staff'), documentUpload.single('document'), async (req, res, next) => {
  try {
    const carId = req.params.id;
    const r = await pool.query('SELECT 1 FROM cars WHERE id = $1', [carId]);
    if (!r.rows[0]) throw new AppError('Car not found', 404);

    if (!req.file) throw new AppError('No file uploaded', 400);

    const urlPath = `/uploads/vehicles/${path.basename(req.file.filename)}`;
    const ins = await pool.query(
      `INSERT INTO vehicle_documents (car_id, document_type, title, expiry_date, url_path, file_size, uploaded_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [carId, req.body.document_type, req.body.title, req.body.expiry_date || null, urlPath, req.file.size, req.user.id]
    );
    res.status(201).json(ins.rows[0]);
  } catch (e) { next(e); }
});

carsRouter.delete('/documents/:docId', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const r = await pool.query('DELETE FROM vehicle_documents WHERE id = $1 RETURNING url_path', [req.params.docId]);
    if (!r.rows[0]) throw new AppError('Document not found', 404);
    const urlPath = r.rows[0].url_path;
    const filePath = path.join(uploadDir, urlPath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
