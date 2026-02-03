import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import pool from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const usersRouter = Router();
usersRouter.use(authMiddleware);
usersRouter.use(requireAdmin);

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'staff', 'readonly']),
});

usersRouter.get('/', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { next(e); }
});

usersRouter.post('/', async (req, res, next) => {
  try {
    const body = userSchema.parse(req.body);
    const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [body.email]);
    if (existing.rows.length) throw new AppError('Email already registered', 400);
    const hash = await bcrypt.hash(body.password, 10);
    const r = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [body.email, hash, body.role]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { next(e); }
});
