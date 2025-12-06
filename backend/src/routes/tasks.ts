import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Get all tasks (with role-based filtering)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let query = 'SELECT * FROM tasks WHERE deleted_at IS NULL';
    let params: any[] = [];
    
    // Check if user wants to see all tasks (for engineers viewing all engineers' tasks)
    const viewAll = req.query.viewAll === 'true';
    
    // Engineers can only see their own tasks by default, unless viewAll=true
    if (req.user?.role === 'engineer' && req.user?.engineerName && !viewAll) {
      query += ' AND engineer = $1';
      params.push(req.user.engineerName);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single task
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = result.rows[0];
    
    // Check permissions
    if (req.user?.role === 'engineer' && task.engineer !== req.user?.engineerName) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create task
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { service, engineer, week, month, year, status, priority, notes } = req.body;
    
    // Validate required fields
    if (!service || !engineer || !week || !month || !year || !status || !priority) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Engineers can only create tasks for themselves
    if (req.user?.role === 'engineer' && engineer !== req.user?.engineerName) {
      return res.status(403).json({ error: 'Engineers can only create tasks for themselves' });
    }
    
    const result = await pool.query(
      `INSERT INTO tasks (service, engineer, week, month, year, status, priority, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [service, engineer, week, month, year, status, priority, notes || null]
    );
    
    // Update engineer task count (excluding deleted)
    await pool.query(
      'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1 AND deleted_at IS NULL) WHERE name = $1',
      [engineer]
    );
    
    // Update service count (excluding deleted)
    await pool.query(
      'UPDATE services SET count = (SELECT COUNT(*) FROM tasks WHERE service = $1 AND deleted_at IS NULL) WHERE name = $1',
      [service]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { service, engineer, week, month, year, status, priority, notes } = req.body;
    
    // Check if task exists and get old status (excluding deleted)
    const oldTask = await pool.query('SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
    
    if (oldTask.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check permissions
    if (req.user?.role === 'engineer') {
      if (oldTask.rows[0].engineer !== req.user?.engineerName) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      // Engineers can't change engineer assignment
      if (engineer && engineer !== req.user?.engineerName) {
        return res.status(403).json({ error: 'Engineers cannot reassign tasks' });
      }
    }
    
    const result = await pool.query(
      `UPDATE tasks 
       SET service = $1, engineer = $2, week = $3, month = $4, year = $5, 
           status = $6, priority = $7, notes = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [service, engineer, week, month, year, status, priority, notes || null, req.params.id]
    );
    
    // Update counts
    await pool.query(
      'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1) WHERE name = $1',
      [engineer]
    );
    
    await pool.query(
      'UPDATE services SET count = (SELECT COUNT(*) FROM tasks WHERE service = $1) WHERE name = $1',
      [service]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Soft delete task (engineers can delete their own tasks, admins/directors can delete any)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if task exists
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
    
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = taskResult.rows[0];
    
    // Check permissions - engineers can only delete their own tasks
    if (req.user?.role === 'engineer' && task.engineer !== req.user?.engineerName) {
      return res.status(403).json({ error: 'You can only delete your own tasks' });
    }
    
    // Soft delete - set deleted_at timestamp
    const result = await pool.query(
      'UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    // Update engineer task count (excluding deleted)
    await pool.query(
      'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1 AND deleted_at IS NULL) WHERE name = $1',
      [task.engineer]
    );
    
    // Update service count (excluding deleted)
    await pool.query(
      'UPDATE services SET count = (SELECT COUNT(*) FROM tasks WHERE service = $1 AND deleted_at IS NULL) WHERE name = $1',
      [task.service]
    );
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

