-- Migration: Add reminder_settings table
-- This migration adds a table to store reminder email settings

-- Reminder settings table
CREATE TABLE IF NOT EXISTS reminder_settings (
  id SERIAL PRIMARY KEY,
  enabled BOOLEAN DEFAULT TRUE,
  frequency VARCHAR(50) NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  day_of_week INTEGER DEFAULT 0 CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default reminder settings (Sunday, weekly, enabled)
INSERT INTO reminder_settings (enabled, frequency, day_of_week)
VALUES (TRUE, 'weekly', 0)
ON CONFLICT DO NOTHING;

