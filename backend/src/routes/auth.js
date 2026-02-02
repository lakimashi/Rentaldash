import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts' },
});

export const authRouter = Router();

authRouter.post(
  '/login',
  loginLimiter,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new AppError('Email and password required', 400);
      const result = await pool.query(
        'SELECT id, email, password_hash, role FROM users WHERE email = $1',
        [email]
      );
      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw new AppError('Invalid email or password', 401);
      }
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (e) {
      next(e);
    }
  }
);

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

authRouter.get('/me', authMiddleware, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, role: req.user.role });
});
