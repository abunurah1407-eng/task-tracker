import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

// Get all services
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM services ORDER BY category, name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

