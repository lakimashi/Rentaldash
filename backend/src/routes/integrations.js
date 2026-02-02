import { Router } from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const integrationsRouter = Router();
integrationsRouter.use(authMiddleware);
integrationsRouter.use(requireAdmin);

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

integrationsRouter.get('/api-keys', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT id, name, created_at, last_used_at FROM api_keys ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { next(e); }
});

integrationsRouter.post('/api-keys', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') throw new AppError('name required', 400);
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const r = await pool.query(
      'INSERT INTO api_keys (name, token_hash) VALUES ($1, $2) RETURNING id, name, created_at',
      [name.trim(), tokenHash]
    );
    const row = r.rows[0];
    res.status(201).json({ id: row.id, name: row.name, created_at: row.created_at, token: rawToken });
  } catch (e) { next(e); }
});

integrationsRouter.delete('/api-keys/:id', async (req, res, next) => {
  try {
    const r = await pool.query('DELETE FROM api_keys WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) throw new AppError('API key not found', 404);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
