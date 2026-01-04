import cron from 'node-cron';
import { pool } from '../config/database';
import { sendWeeklyReminderEmail } from '../utils/email';

let currentCronJob: ReturnType<typeof cron.schedule> | null = null;

// Day names in English for logging
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Get cron expression based on frequency and day of week
const getCronExpression = (frequency: string, dayOfWeek: number): string => {
  switch (frequency) {
    case 'daily':
      // Every day at 9 AM
      return '0 9 * * *';
    case 'weekly':
      // Every week on specified day at 9 AM
      return `0 9 * * ${dayOfWeek}`;
    case 'biweekly':
      // Every 2 weeks on specified day at 9 AM (using day of month as approximation)
      // This is a simplified approach - for true biweekly, we'd need to track last sent date
      return `0 9 */14 * ${dayOfWeek}`;
    case 'monthly':
      // First day of month on specified day of week at 9 AM
      return `0 9 1 * ${dayOfWeek}`;
    default:
      // Default to weekly on Sunday
      return '0 9 * * 0';
  }
};

// Start or restart the cron job based on current settings
export const startReminderScheduler = async (): Promise<void> => {
  try {
    // Stop existing job if any
    stopReminderScheduler();

    // Get current reminder settings
    const result = await pool.query(
      'SELECT enabled, frequency, day_of_week FROM reminder_settings ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.log('[Scheduler] No reminder settings found, using defaults');
      // Create default settings
      await pool.query(
        `INSERT INTO reminder_settings (enabled, frequency, day_of_week) 
         VALUES (TRUE, 'weekly', 0) 
         ON CONFLICT DO NOTHING`
      );
      return startReminderScheduler(); // Retry with default settings
    }

    const settings = result.rows[0];
    const { enabled, frequency, day_of_week } = settings;

    if (!enabled) {
      console.log('[Scheduler] Reminder emails are disabled');
      return;
    }

    const cronExpression = getCronExpression(frequency, day_of_week);
    const dayName = dayNames[day_of_week] || 'Sunday';

    console.log(`[Scheduler] Starting reminder scheduler: ${frequency} on ${dayName} (day ${day_of_week})`);
    console.log(`[Scheduler] Cron expression: ${cronExpression}`);

    currentCronJob = cron.schedule(cronExpression, async () => {
      console.log(`[Scheduler] Running scheduled reminder email job...`);
      try {
        const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        await sendWeeklyReminderEmail({ portalUrl });
        console.log('[Scheduler] Reminder email job completed successfully');
      } catch (error: any) {
        console.error('[Scheduler] Error in reminder email job:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Riyadh', // Saudi Arabia timezone
    });

    console.log('[Scheduler] Reminder scheduler started successfully');
  } catch (error: any) {
    console.error('[Scheduler] Error starting reminder scheduler:', error);
  }
};

// Stop the cron job
export const stopReminderScheduler = () => {
  if (currentCronJob) {
    currentCronJob.stop();
    currentCronJob = null;
    console.log('[Scheduler] Reminder scheduler stopped');
  }
};

// Initialize scheduler on module load
startReminderScheduler().catch(console.error);

