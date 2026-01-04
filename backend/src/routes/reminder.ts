import { Router, Response } from 'express';
import { pool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { startReminderScheduler, stopReminderScheduler } from '../services/scheduler';

const router = Router();

// Day names in English
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Get reminder settings
router.get('/settings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can view settings
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(
      'SELECT enabled, frequency, day_of_week FROM reminder_settings ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      // Return default settings
      return res.json({
        enabled: true,
        frequency: 'weekly',
        dayOfWeek: 0,
        dayName: dayNames[0],
      });
    }

    const settings = result.rows[0];
    res.json({
      enabled: settings.enabled,
      frequency: settings.frequency,
      dayOfWeek: settings.day_of_week,
      dayName: dayNames[settings.day_of_week] || dayNames[0],
    });
  } catch (error: any) {
    console.error('Get reminder settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update reminder settings
router.put('/settings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can update settings
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { enabled, frequency, dayOfWeek } = req.body;

    // Validate inputs
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    if (frequency && !['daily', 'weekly', 'biweekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({ error: 'frequency must be one of: daily, weekly, biweekly, monthly' });
    }

    if (dayOfWeek !== undefined && (dayOfWeek < 0 || dayOfWeek > 6)) {
      return res.status(400).json({ error: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' });
    }

    // Check if settings exist
    const existingResult = await pool.query(
      'SELECT id FROM reminder_settings ORDER BY id DESC LIMIT 1'
    );

    let result;
    if (existingResult.rows.length === 0) {
      // Insert new settings
      result = await pool.query(
        `INSERT INTO reminder_settings (enabled, frequency, day_of_week) 
         VALUES ($1, $2, $3) 
         RETURNING enabled, frequency, day_of_week`,
        [
          enabled !== undefined ? enabled : true,
          frequency || 'weekly',
          dayOfWeek !== undefined ? dayOfWeek : 0,
        ]
      );
    } else {
      // Update existing settings
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (enabled !== undefined) {
        updateFields.push(`enabled = $${paramIndex++}`);
        updateValues.push(enabled);
      }
      if (frequency) {
        updateFields.push(`frequency = $${paramIndex++}`);
        updateValues.push(frequency);
      }
      if (dayOfWeek !== undefined) {
        updateFields.push(`day_of_week = $${paramIndex++}`);
        updateValues.push(dayOfWeek);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      result = await pool.query(
        `UPDATE reminder_settings 
         SET ${updateFields.join(', ')} 
         WHERE id = $${paramIndex}
         RETURNING enabled, frequency, day_of_week`,
        [...updateValues, existingResult.rows[0].id]
      );
    }

    const updatedSettings = result.rows[0];

    // Restart scheduler with new settings
    if (updatedSettings.enabled) {
      await startReminderScheduler();
    } else {
      stopReminderScheduler();
    }

    res.json({
      enabled: updatedSettings.enabled,
      frequency: updatedSettings.frequency,
      dayOfWeek: updatedSettings.day_of_week,
      dayName: dayNames[updatedSettings.day_of_week] || dayNames[0],
      message: 'Reminder settings updated successfully',
    });
  } catch (error: any) {
    console.error('Update reminder settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test send reminder email (for testing purposes)
router.post('/test', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can test
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { sendWeeklyReminderEmail } = await import('../utils/email');
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Send test email to m.ageeli@etec.gov.sa
    const testEmail = 'm.ageeli@etec.gov.sa';
    const success = await sendWeeklyReminderEmail({ 
      portalUrl,
      testEmail
    });
    
    if (success) {
      res.json({ message: `Test reminder email sent successfully to ${testEmail}` });
    } else {
      res.status(500).json({ error: 'Failed to send test reminder email' });
    }
  } catch (error: any) {
    console.error('Test reminder email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

