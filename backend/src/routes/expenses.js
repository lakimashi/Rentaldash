import { Router } from 'express';
import { z } from 'zod';
import pool from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { logAudit } from '../services/auditService.js';

export const expensesRouter = Router();
expensesRouter.use(authMiddleware);

const expenseSchema = z.object({
  car_id: z.number().int(),
  category: z.enum(['maintenance', 'insurance', 'registration', 'cleaning', 'misc', 'fuel']),
  amount: z.number().min(0),
  description: z.string().optional().nullable(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

expensesRouter.get('/', async (req, res, next) => {
  try {
    const { car_id, category, from, to } = req.query;
    let q = `
      SELECT e.*, c.plate_number, c.make, c.model 
      FROM expenses e 
      LEFT JOIN cars c ON e.car_id = c.id 
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    
    if (car_id) { q += ` AND e.car_id = $${i}`; params.push(car_id); i++; }
    if (category) { q += ` AND e.category = $${i}`; params.push(category); i++; }
    if (from) { q += ` AND e.expense_date >= $${i}`; params.push(from); i++; }
    if (to) { q += ` AND e.expense_date <= $${i}`; params.push(to); i++; }
    
    q += ' ORDER BY e.expense_date DESC';
    const r = await pool.query(q, params);
    const expenses = r.rows.map((e) => ({ ...e, amount: parseFloat(e.amount) }));
    res.json(expenses);
  } catch (e) { next(e); }
});

expensesRouter.get('/:id', async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT e.*, c.plate_number, c.make, c.model 
       FROM expenses e 
       LEFT JOIN cars c ON e.car_id = c.id 
       WHERE e.id = $1`,
      [req.params.id]
    );
    const expense = r.rows[0];
    if (!expense) throw new AppError('Expense not found', 404);
    res.json({ ...expense, amount: parseFloat(expense.amount) });
  } catch (e) { next(e); }
});

expensesRouter.post('/', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const body = expenseSchema.parse({
      ...req.body,
      car_id: req.body.car_id != null ? Number(req.body.car_id) : undefined,
      amount: Number(req.body.amount),
      expense_date: req.body.expense_date || new Date().toISOString().slice(0, 10),
    });
    
    const r = await pool.query(
      `INSERT INTO expenses (car_id, category, amount, description, expense_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [body.car_id, body.category, body.amount, body.description ?? null, body.expense_date]
    );
    
    const expense = r.rows[0];
    await logAudit(req.user.id, 'create', 'expense', expense.id, { 
      category: expense.category, 
      amount: expense.amount 
    });
    res.status(201).json({ ...expense, amount: parseFloat(expense.amount) });
  } catch (e) { next(e); }
});

expensesRouter.put('/:id', requireRole('admin', 'staff'), async (req, res, next) => {
  try {
    const body = expenseSchema.partial().parse({
      ...req.body,
      amount: req.body.amount != null ? Number(req.body.amount) : undefined,
    });
    
    const updates = [];
    const values = [];
    let i = 1;
    
    if (body.car_id !== undefined) { updates.push(`car_id = $${i}`); values.push(body.car_id); i++; }
    if (body.category !== undefined) { updates.push(`category = $${i}`); values.push(body.category); i++; }
    if (body.amount !== undefined) { updates.push(`amount = $${i}`); values.push(body.amount); i++; }
    if (body.description !== undefined) { updates.push(`description = $${i}`); values.push(body.description); i++; }
    if (body.expense_date !== undefined) { updates.push(`expense_date = $${i}`); values.push(body.expense_date); i++; }
    
    if (updates.length === 0) throw new AppError('No fields to update', 400);
    
    values.push(req.params.id);
    const r = await pool.query(
      `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    
    const expense = r.rows[0];
    if (!expense) throw new AppError('Expense not found', 404);
    await logAudit(req.user.id, 'update', 'expense', expense.id, body);
    res.json({ ...expense, amount: parseFloat(expense.amount) });
  } catch (e) { next(e); }
});

expensesRouter.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const r = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) throw new AppError('Expense not found', 404);
    await logAudit(req.user.id, 'delete', 'expense', req.params.id, {});
    res.json({ ok: true });
  } catch (e) { next(e); }
});
