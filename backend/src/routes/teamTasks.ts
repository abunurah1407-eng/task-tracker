import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

// Get all team tasks
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM team_tasks ORDER BY category');
    res.json(result.rows);
  } catch (error) {
    console.error('Get team tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

