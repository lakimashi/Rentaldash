import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

export const auditRouter = Router();
auditRouter.use(authMiddleware);
auditRouter.use(requireAdmin);

auditRouter.get('/', async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;
    const r = await pool.query(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.metadata_json, a.created_at, u.email AS user_email
       FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC LIMIT $1`,
      [Math.min(Number(limit) || 100, 500)]
    );
    res.json(r.rows);
  } catch (e) { next(e); }
});
