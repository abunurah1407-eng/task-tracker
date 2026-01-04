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

// Create new service
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can create
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, assignedTo, category } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    if (category !== 'primary' && category !== 'secondary') {
      return res.status(400).json({ error: 'Category must be "primary" or "secondary"' });
    }

    const result = await pool.query(
      'INSERT INTO services (name, assigned_to, category) VALUES ($1, $2, $3) RETURNING *',
      [name, assignedTo || null, category]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Service with this name already exists' });
    }
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update service
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can update
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const { name, assignedTo, category } = req.body;

    // Get current service to find old name
    const currentService = await pool.query('SELECT name FROM services WHERE id = $1', [id]);
    if (currentService.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const oldServiceName = currentService.rows[0].name;

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (name) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    if (assignedTo !== undefined) {
      updateFields.push(`assigned_to = $${paramIndex++}`);
      updateValues.push(assignedTo || null);
    }
    if (category) {
      if (category !== 'primary' && category !== 'secondary') {
        return res.status(400).json({ error: 'Category must be "primary" or "secondary"' });
      }
      updateFields.push(`category = $${paramIndex++}`);
      updateValues.push(category);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const result = await pool.query(
      `UPDATE services SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    // If name changed, update all tasks referencing the old service name
    if (name && name !== oldServiceName) {
      await pool.query('UPDATE tasks SET service = $1 WHERE service = $2', [name, oldServiceName]);
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Service with this name already exists' });
    }
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete service
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can delete
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    // Check if service exists
    const serviceResult = await pool.query('SELECT name FROM services WHERE id = $1', [id]);
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const serviceName = serviceResult.rows[0].name;

    // Check if service has tasks
    const tasksResult = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE service = $1', [serviceName]);
    const taskCount = parseInt(tasksResult.rows[0].count);

    if (taskCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete service. It has ${taskCount} associated task(s). Please delete or reassign tasks first.` 
      });
    }

    await pool.query('DELETE FROM services WHERE id = $1', [id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

