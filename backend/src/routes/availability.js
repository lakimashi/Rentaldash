import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAvailableCars } from '../services/availabilityService.js';
import { AppError } from '../middleware/errorHandler.js';

export const availabilityRouter = Router();
availabilityRouter.use(authMiddleware);

availabilityRouter.get('/', async (req, res, next) => {
  try {
    const { start, end, class: carClass, branch_id } = req.query;
    if (!start || !end) throw new AppError('start and end query params required (YYYY-MM-DD)', 400);
    const list = await getAvailableCars({
      start: String(start),
      end: String(end),
      class: carClass || undefined,
      branch_id: branch_id ? Number(branch_id) : undefined,
    });
    res.json(list);
  } catch (e) { next(e); }
});
