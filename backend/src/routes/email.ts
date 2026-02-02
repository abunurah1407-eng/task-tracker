import { Router, Response } from 'express';
import { pool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendFollowUpEmail, FollowUpEmailData, sendInvitationEmail, sendPasswordResetEmail, sendWeeklyReminderEmail, sendTaskAssignedEmail } from '../utils/email';
import crypto from 'crypto';

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

// Test email templates (admin only)
router.post('/test', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can test emails
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { template, testEmail } = req.body;

    if (!template || !testEmail) {
      return res.status(400).json({ error: 'Template type and test email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    let result: any = { success: false, message: '', template };

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let secureUrl = frontendUrl;
    // Ensure HTTPS in production
    if (!secureUrl.includes('localhost') && !secureUrl.includes('127.0.0.1')) {
      secureUrl = secureUrl.replace(/^http:\/\//, 'https://');
    }

    switch (template) {
      case 'invitation': {
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const invitationLink = `${secureUrl}/invite/${invitationToken}`;

        const emailSent = await sendInvitationEmail({
          engineerName: 'Test User',
          engineerEmail: testEmail,
          invitationLink,
          expiresAt: invitationExpires,
        });

        result = {
          success: emailSent,
          message: emailSent 
            ? 'Invitation email sent successfully' 
            : 'Invitation email failed to send (check SMTP configuration)',
          template: 'invitation',
          invitationLink,
        };
        break;
      }

      case 'password-reset': {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        const resetLink = `${secureUrl}/reset-password/${resetToken}`;

        const emailSent = await sendPasswordResetEmail({
          userName: 'Test User',
          userEmail: testEmail,
          resetLink,
          expiresAt: resetExpires,
        });

        result = {
          success: emailSent,
          message: emailSent 
            ? 'Password reset email sent successfully' 
            : 'Password reset email failed to send (check SMTP configuration)',
          template: 'password-reset',
          resetLink,
        };
        break;
      }

      case 'weekly-reminder': {
        const emailSent = await sendWeeklyReminderEmail({
          portalUrl: secureUrl,
          testEmail, // Send only to test email
        });

        result = {
          success: emailSent,
          message: emailSent 
            ? 'Weekly reminder email sent successfully' 
            : 'Weekly reminder email failed to send (check SMTP configuration)',
          template: 'weekly-reminder',
        };
        break;
      }

      case 'follow-up': {
        // Create sample tasks for testing
        const samplePendingTasks = [
          {
            id: 1,
            service: 'Sample Service 1',
            engineer: 'Test Engineer',
            week: 1,
            month: 'January',
            year: 2026,
            status: 'pending' as const,
            priority: 'high' as const,
            description: 'This is a test pending task',
          },
        ];

        const sampleInProgressTasks = [
          {
            id: 2,
            service: 'Sample Service 2',
            engineer: 'Test Engineer',
            week: 2,
            month: 'January',
            year: 2026,
            status: 'in-progress' as const,
            priority: 'medium' as const,
            description: 'This is a test in-progress task',
          },
        ];

        const emailSent = await sendFollowUpEmail({
          engineerName: 'Test Engineer',
          engineerEmail: testEmail,
          pendingTasks: samplePendingTasks,
          inProgressTasks: sampleInProgressTasks,
        });

        result = {
          success: emailSent,
          message: emailSent 
            ? 'Follow-up email sent successfully' 
            : 'Follow-up email failed to send (check SMTP configuration)',
          template: 'follow-up',
        };
        break;
      }

      case 'task-assigned': {
        let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        // Ensure HTTPS in production
        if (!frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1')) {
          frontendUrl = frontendUrl.replace(/^http:\/\//, 'https://');
        }

        const emailSent = await sendTaskAssignedEmail({
          engineerName: 'Test Engineer',
          engineerEmail: testEmail,
          taskDetails: {
            service: 'Sample Service',
            week: 1,
            month: 'January',
            year: 2026,
            status: 'pending',
            priority: 'high',
            description: 'This is a test task assignment email with sample task details.',
          },
          assignedBy: 'Test Administrator',
          portalUrl: frontendUrl,
        });

        result = {
          success: emailSent,
          message: emailSent 
            ? 'Task assigned email sent successfully' 
            : 'Task assigned email failed to send (check SMTP configuration)',
          template: 'task-assigned',
        };
        break;
      }

      default:
        return res.status(400).json({ error: 'Invalid template type. Valid types: invitation, password-reset, weekly-reminder, follow-up, task-assigned' });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error testing email template:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;

