import { Router, Response } from 'express';
import { pool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendFollowUpEmail, FollowUpEmailData } from '../utils/email';

const router = Router();

// Helper function to get engineers and their tasks
async function getEngineersAndTasks(engineerIds?: number[]) {
  const client = await pool.connect();
  try {
    // Get all engineers with their email addresses
    let engineerQuery = `
      SELECT DISTINCT e.name, u.email
      FROM engineers e
      LEFT JOIN users u ON u.engineer_name = e.name AND u.role = 'engineer'
      WHERE u.email IS NOT NULL
    `;
    
    const params: any[] = [];
    if (engineerIds && Array.isArray(engineerIds) && engineerIds.length > 0) {
      engineerQuery += ` AND e.id = ANY($1)`;
      params.push(engineerIds);
    }

    const engineerResult = await client.query(engineerQuery, params);
    const engineers = engineerResult.rows;

    // Get pending and in-progress tasks
    const tasksResult = await client.query(
      `SELECT id, service, engineer, week, month, year, status, priority, notes as description
       FROM tasks
       WHERE status IN ('pending', 'in-progress')
       ORDER BY engineer, status, priority DESC, year DESC, month, week`
    );

    const tasks = tasksResult.rows;

    // Group tasks by engineer
    const tasksByEngineer = new Map<string, { pending: any[]; inProgress: any[] }>();
    
    tasks.forEach((task) => {
      if (!tasksByEngineer.has(task.engineer)) {
        tasksByEngineer.set(task.engineer, { pending: [], inProgress: [] });
      }
      const engineerTasks = tasksByEngineer.get(task.engineer)!;
      if (task.status === 'pending') {
        engineerTasks.pending.push(task);
      } else if (task.status === 'in-progress') {
        engineerTasks.inProgress.push(task);
      }
    });

    return { engineers, tasksByEngineer };
  } finally {
    client.release();
  }
}

// Preview follow-up emails (returns summary without sending)
router.post('/follow-up/preview', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only director and admin can preview follow-up emails
    if (req.user?.role !== 'director' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only directors and admins can preview follow-up emails' });
    }

    const { engineerIds } = req.body;

    const { engineers, tasksByEngineer } = await getEngineersAndTasks(engineerIds);

    if (engineers.length === 0) {
      return res.status(404).json({ error: 'No engineers found with email addresses' });
    }

    // Build preview summary
    const preview = [];
    let totalEmails = 0;
    let totalPendingTasks = 0;
    let totalInProgressTasks = 0;

    for (const engineer of engineers) {
      const engineerTasks = tasksByEngineer.get(engineer.name);
      
      if (engineerTasks && (engineerTasks.pending.length > 0 || engineerTasks.inProgress.length > 0)) {
        const pendingCount = engineerTasks.pending.length;
        const inProgressCount = engineerTasks.inProgress.length;
        
        preview.push({
          engineer: engineer.name,
          email: engineer.email,
          pendingCount,
          inProgressCount,
          totalTasks: pendingCount + inProgressCount,
        });
        
        totalEmails++;
        totalPendingTasks += pendingCount;
        totalInProgressTasks += inProgressCount;
      }
    }

    res.json({
      summary: {
        totalEngineers: engineers.length,
        engineersWithTasks: totalEmails,
        totalPendingTasks,
        totalInProgressTasks,
        totalTasks: totalPendingTasks + totalInProgressTasks,
      },
      preview,
    });
  } catch (error: any) {
    console.error('Error previewing follow-up emails:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Send follow-up emails for pending and in-progress tasks
router.post('/follow-up', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only director and admin can send follow-up emails
    if (req.user?.role !== 'director' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only directors and admins can send follow-up emails' });
    }

    const { engineerIds, confirm } = req.body;

    // Require confirmation
    if (confirm !== true) {
      return res.status(400).json({ error: 'Confirmation required. Please set confirm: true to send emails.' });
    }

    const { engineers, tasksByEngineer } = await getEngineersAndTasks(engineerIds);

    if (engineers.length === 0) {
      return res.status(404).json({ error: 'No engineers found with email addresses' });
    }

    // Send emails to each engineer
    const results = [];
    console.log(`[Email] Found ${engineers.length} engineers with email addresses`);
    
    for (const engineer of engineers) {
      const engineerTasks = tasksByEngineer.get(engineer.name);
      
      // Only send email if engineer has pending or in-progress tasks
      if (engineerTasks && (engineerTasks.pending.length > 0 || engineerTasks.inProgress.length > 0)) {
        console.log(`[Email] Preparing email for ${engineer.name} (${engineer.email}): ${engineerTasks.pending.length} pending, ${engineerTasks.inProgress.length} in-progress`);
        
        const emailData: FollowUpEmailData = {
          engineerName: engineer.name,
          engineerEmail: engineer.email,
          pendingTasks: engineerTasks.pending,
          inProgressTasks: engineerTasks.inProgress,
        };

        try {
          const success = await sendFollowUpEmail(emailData);
          console.log(`[Email] Email ${success ? 'sent successfully' : 'failed'} to ${engineer.email}`);
          results.push({
            engineer: engineer.name,
            email: engineer.email,
            success,
            pendingCount: engineerTasks.pending.length,
            inProgressCount: engineerTasks.inProgress.length,
          });
        } catch (error: any) {
          console.error(`[Email] Error sending email to ${engineer.email}:`, error);
          results.push({
            engineer: engineer.name,
            email: engineer.email,
            success: false,
            error: error.message,
            pendingCount: engineerTasks.pending.length,
            inProgressCount: engineerTasks.inProgress.length,
          });
        }
      } else {
        console.log(`[Email] Skipping ${engineer.name} - no pending/in-progress tasks`);
      }
    }

    console.log(`[Email] Email sending completed. Results: ${JSON.stringify(results, null, 2)}`);

    res.json({
      message: `Follow-up emails processed for ${results.length} engineer(s)`,
      results,
    });
  } catch (error: any) {
    console.error('Error sending follow-up emails:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;

