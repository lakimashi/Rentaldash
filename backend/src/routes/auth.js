import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const authRouter = Router();

authRouter.post(
  '/login',
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
      const cookieMaxAge = parseInt(process.env.COOKIE_MAX_AGE || '604800000'); // 7 days default
      const sameSite = process.env.COOKIE_SAME_SITE || 'lax';
      res.cookie('token', token, { httpOnly: true, maxAge: cookieMaxAge, sameSite });
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

authRouter.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) throw new AppError('Current and new password required', 400);
    if (new_password.length < 6) throw new AppError('New password must be at least 6 characters', 400);

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(current_password, user.password_hash))) {
      throw new AppError('Incorrect current password', 401);
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);

    res.json({ ok: true, message: 'Password updated successfully' });
  } catch (e) {
    next(e);
  }
});
