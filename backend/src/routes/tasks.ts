import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth';
import { sendTaskAssignedEmail } from '../utils/email';

const router = Router();

// Get all tasks (with role-based filtering)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Optimized query with proper index usage
    let query = 'SELECT * FROM tasks';
    let params: any[] = [];
    
    // Check if user wants to see all tasks (for engineers viewing all engineers' tasks)
    const viewAll = req.query.viewAll === 'true';
    
    // Engineers can only see their own tasks by default, unless viewAll=true
    if (req.user?.role === 'engineer' && !viewAll) {
      if (req.user?.engineerName) {
        // Use indexed column first for better performance (matches composite index)
        query = 'SELECT * FROM tasks WHERE engineer = $1';
        params.push(req.user.engineerName);
      } else {
        // Return empty array if engineer has no engineerName
        return res.json([]);
      }
    }
    
    // Order by created_at DESC (indexed)
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    // Map notes to description for frontend compatibility
    const tasks = result.rows.map(task => ({
      ...task,
      description: task.notes || task.description || '',
    }));
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single task
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = result.rows[0];
    
    // Check permissions
    if (req.user?.role === 'engineer' && task.engineer !== req.user?.engineerName) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Map notes to description for frontend compatibility
    const taskWithDescription = {
      ...task,
      description: task.notes || task.description || '',
    };
    
    res.json(taskWithDescription);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create task
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { service, engineer, week, month, year, status, priority, notes, description } = req.body;
    
    // Validate required fields
    if (!service || !engineer || !week || !month || !year || !status || !priority) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Engineers can only create tasks for themselves
    if (req.user?.role === 'engineer' && engineer !== req.user?.engineerName) {
      return res.status(403).json({ error: 'Engineers can only create tasks for themselves' });
    }
    
    // Use description if provided, otherwise fall back to notes for backward compatibility
    const taskDescription = description || notes || null;
    
    const result = await pool.query(
      `INSERT INTO tasks (service, engineer, week, month, year, status, priority, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [service, engineer, week, month, year, status, priority, taskDescription]
    );
    
    // Update engineer task count
    await pool.query(
      'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1) WHERE name = $1',
      [engineer]
    );
    
    // Update service count
    await pool.query(
      'UPDATE services SET count = (SELECT COUNT(*) FROM tasks WHERE service = $1) WHERE name = $1',
      [service]
    );
    
    // Send email notification if task is assigned by admin or director
    if ((req.user?.role === 'admin' || req.user?.role === 'director') && engineer) {
      try {
        // Get engineer's email from users table
        const engineerResult = await pool.query(
          `SELECT u.email, u.name 
           FROM users u 
           WHERE u.engineer_name = $1 AND u.role = 'engineer' AND u.email IS NOT NULL 
           LIMIT 1`,
          [engineer]
        );
        
        if (engineerResult.rows.length > 0) {
          const engineerEmail = engineerResult.rows[0].email;
          const engineerName = engineerResult.rows[0].name || engineer;
          const assignedBy = req.user.name || (req.user.role === 'admin' ? 'Administrator' : 'Director');
          const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          
          await sendTaskAssignedEmail({
            engineerName,
            engineerEmail,
            taskDetails: {
              service,
              week,
              month,
              year,
              status,
              priority,
              description: taskDescription || undefined,
            },
            assignedBy,
            portalUrl,
          });
        }
      } catch (emailError) {
        // Log error but don't fail the task creation
        console.error('Error sending task assignment email:', emailError);
      }
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create multiple tasks (bulk)
router.post('/bulk', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { tasks } = req.body;
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }
    
    // Validate all tasks
    for (const task of tasks) {
      if (!task.service || !task.engineer || !task.week || !task.month || !task.year || !task.status || !task.priority) {
        return res.status(400).json({ error: 'All tasks must have required fields' });
      }
      
      // Engineers can only create tasks for themselves
      if (req.user?.role === 'engineer' && task.engineer !== req.user?.engineerName) {
        return res.status(403).json({ error: 'Engineers can only create tasks for themselves' });
      }
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const createdTasks = [];
      const engineers = new Set<string>();
      const services = new Set<string>();
      
      for (const task of tasks) {
        const taskDescription = task.description || task.notes || null;
        
        const result = await client.query(
          `INSERT INTO tasks (service, engineer, week, month, year, status, priority, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [task.service, task.engineer, task.week, task.month, task.year, task.status, task.priority, taskDescription]
        );
        
        createdTasks.push(result.rows[0]);
        engineers.add(task.engineer);
        services.add(task.service);
      }
      
      // Update engineer task counts
      for (const engineer of engineers) {
        await client.query(
          'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1) WHERE name = $1',
          [engineer]
        );
      }
      
      // Update service counts
      for (const service of services) {
        await client.query(
          'UPDATE services SET count = (SELECT COUNT(*) FROM tasks WHERE service = $1) WHERE name = $1',
          [service]
        );
      }
      
      // Send email notifications if tasks are assigned by admin or director
      if (req.user?.role === 'admin' || req.user?.role === 'director') {
        const assignedBy = req.user.name || (req.user.role === 'admin' ? 'Administrator' : 'Director');
        const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        
        // Group tasks by engineer to send one email per engineer
        const tasksByEngineer = new Map<string, any[]>();
        for (const task of createdTasks) {
          if (!tasksByEngineer.has(task.engineer)) {
            tasksByEngineer.set(task.engineer, []);
          }
          tasksByEngineer.get(task.engineer)!.push(task);
        }
        
        // Send emails after commit
        for (const [engineerName, tasks] of tasksByEngineer.entries()) {
          try {
            // Get engineer's email from users table
            const engineerResult = await pool.query(
              `SELECT u.email, u.name 
               FROM users u 
               WHERE u.engineer_name = $1 AND u.role = 'engineer' AND u.email IS NOT NULL 
               LIMIT 1`,
              [engineerName]
            );
            
            if (engineerResult.rows.length > 0) {
              const engineerEmail = engineerResult.rows[0].email;
              const engineerDisplayName = engineerResult.rows[0].name || engineerName;
              
              // Send email for each task (or could combine into one email with multiple tasks)
              for (const task of tasks) {
                await sendTaskAssignedEmail({
                  engineerName: engineerDisplayName,
                  engineerEmail,
                  taskDetails: {
                    service: task.service,
                    week: task.week,
                    month: task.month,
                    year: task.year,
                    status: task.status,
                    priority: task.priority,
                    description: task.notes || undefined,
                  },
                  assignedBy,
                  portalUrl,
                });
              }
            }
          } catch (emailError) {
            // Log error but don't fail the bulk creation
            console.error(`Error sending task assignment email for ${engineerName}:`, emailError);
          }
        }
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({ 
        success: true,
        count: createdTasks.length,
        tasks: createdTasks 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk create tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { service, engineer, week, month, year, status, priority, notes, description } = req.body;
    
    // Check if task exists and get old status
    const oldTask = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    
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
    
    // Use description if provided, otherwise fall back to notes for backward compatibility
    const taskDescription = description !== undefined ? description : (notes || null);
    
    const result = await pool.query(
      `UPDATE tasks 
       SET service = $1, engineer = $2, week = $3, month = $4, year = $5, 
           status = $6, priority = $7, notes = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [service, engineer, week, month, year, status, priority, taskDescription, req.params.id]
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
    
    // Send email notification if engineer was changed (task reassigned) by admin or director
    if ((req.user?.role === 'admin' || req.user?.role === 'director') && engineer && oldTask.rows[0].engineer !== engineer) {
      try {
        // Get engineer's email from users table
        const engineerResult = await pool.query(
          `SELECT u.email, u.name 
           FROM users u 
           WHERE u.engineer_name = $1 AND u.role = 'engineer' AND u.email IS NOT NULL 
           LIMIT 1`,
          [engineer]
        );
        
        if (engineerResult.rows.length > 0) {
          const engineerEmail = engineerResult.rows[0].email;
          const engineerName = engineerResult.rows[0].name || engineer;
          const assignedBy = req.user.name || (req.user.role === 'admin' ? 'Administrator' : 'Director');
          const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          
          await sendTaskAssignedEmail({
            engineerName,
            engineerEmail,
            taskDetails: {
              service,
              week,
              month,
              year,
              status,
              priority,
              description: taskDescription || undefined,
            },
            assignedBy,
            portalUrl,
          });
        }
      } catch (emailError) {
        // Log error but don't fail the task update
        console.error('Error sending task assignment email:', emailError);
      }
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete task (engineers can delete their own tasks, admins/directors can delete any)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if task exists
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = taskResult.rows[0];
    
    // Check permissions - engineers can only delete their own tasks
    if (req.user?.role === 'engineer' && task.engineer !== req.user?.engineerName) {
      return res.status(403).json({ error: 'You can only delete your own tasks' });
    }
    
    // Hard delete - remove task from database
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    
    // Update engineer task count
    await pool.query(
      'UPDATE engineers SET tasks_total = (SELECT COUNT(*) FROM tasks WHERE engineer = $1) WHERE name = $1',
      [task.engineer]
    );
    
    // Update service count
    await pool.query(
      'UPDATE services SET count = (SELECT COUNT(*) FROM tasks WHERE service = $1) WHERE name = $1',
      [task.service]
    );
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

