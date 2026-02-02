import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export const branchesRouter = Router();
branchesRouter.use(authMiddleware);

branchesRouter.get('/', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT id, name, address, phone FROM branches ORDER BY name');
    res.json(r.rows);
  } catch (e) { next(e); }
});
