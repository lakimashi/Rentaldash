import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';
import { AppError } from './errorHandler.js';

function hashApiToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-api-key'] || req.cookies?.token;
  if (!token) {
    return next(new AppError('Unauthorized', 401));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!result.rows[0]) return next(new AppError('Unauthorized', 401));
    req.user = result.rows[0];
    return next();
  } catch {
    const tokenHash = hashApiToken(token);
    const keyResult = await pool.query(
      'SELECT id, name FROM api_keys WHERE token_hash = $1',
      [tokenHash]
    );
    if (keyResult.rows[0]) {
      await pool.query("UPDATE api_keys SET last_used_at = datetime('now') WHERE id = $1", [keyResult.rows[0].id]);
      req.user = { id: 0, email: `api:${keyResult.rows[0].name}`, role: 'staff' };
      return next();
    }
    next(new AppError('Unauthorized', 401));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Unauthorized', 401));
    if (roles.includes(req.user.role)) return next();
    next(new AppError('Forbidden', 403));
  };
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return next(new AppError('Forbidden', 403));
  next();
}
