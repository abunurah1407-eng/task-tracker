-- Complete Production Migration Script
-- This script ensures all schema changes are applied to production
-- Safe to run multiple times (idempotent)

-- ============================================
-- 1. USERS TABLE MIGRATIONS
-- ============================================

-- Add color column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'color') THEN
    ALTER TABLE users ADD COLUMN color VARCHAR(7);
    RAISE NOTICE 'Added color column to users table';
  END IF;
END $$;

-- Add password reset token columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'password_reset_token') THEN
    ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) DEFAULT NULL;
    RAISE NOTICE 'Added password_reset_token column to users table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'password_reset_expires') THEN
    ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP DEFAULT NULL;
    RAISE NOTICE 'Added password_reset_expires column to users table';
  END IF;
END $$;

-- ============================================
-- 2. ENGINEERS TABLE MIGRATIONS
-- ============================================

-- Add user_id column to engineers table
ALTER TABLE engineers 
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'engineers_user_id_fkey'
  ) THEN
    ALTER TABLE engineers
    ADD CONSTRAINT engineers_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint engineers_user_id_fkey';
  END IF;
END $$;

-- Populate user_id by matching engineer name with user engineer_name
UPDATE engineers e
SET user_id = u.id
FROM users u
WHERE e.name = u.engineer_name
  AND u.role = 'engineer'
  AND e.user_id IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_engineers_user_id ON engineers(user_id);

-- ============================================
-- 3. SERVICES TABLE MIGRATIONS
-- ============================================

-- Add id column if it doesn't exist (PRIMARY KEY)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'services' AND column_name = 'id') THEN
    -- Check if there's data first
    IF EXISTS (SELECT 1 FROM services LIMIT 1) THEN
      -- If data exists, we need to add id as SERIAL and populate it
      ALTER TABLE services ADD COLUMN id SERIAL;
      ALTER TABLE services ADD PRIMARY KEY (id);
    ELSE
      -- If no data, just add the column
      ALTER TABLE services ADD COLUMN id SERIAL PRIMARY KEY;
    END IF;
    RAISE NOTICE 'Added id column to services table';
  END IF;
END $$;

-- ============================================
-- 4. REMINDER SETTINGS TABLE MIGRATIONS
-- ============================================

-- Create reminder_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS reminder_settings (
  id SERIAL PRIMARY KEY,
  enabled BOOLEAN DEFAULT TRUE,
  frequency VARCHAR(50) NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  day_of_week INTEGER DEFAULT 0 CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default reminder settings (Sunday, weekly, enabled) if not exists
INSERT INTO reminder_settings (enabled, frequency, day_of_week)
SELECT TRUE, 'weekly', 0
WHERE NOT EXISTS (SELECT 1 FROM reminder_settings);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

-- Create all indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_tasks_engineer ON tasks(engineer);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_month_year ON tasks(month, year);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_engineers_user_id ON engineers(user_id);

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Uncomment these to verify the migration
-- SELECT 'Users table columns:' as info;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
-- 
-- SELECT 'Engineers table columns:' as info;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'engineers' ORDER BY ordinal_position;
-- 
-- SELECT 'Services table columns:' as info;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'services' ORDER BY ordinal_position;
-- 
-- SELECT 'Reminder settings exists:' as info;
-- SELECT COUNT(*) as count FROM reminder_settings;
-- 
-- SELECT 'Indexes on engineers:' as info;
-- SELECT indexname FROM pg_indexes WHERE tablename = 'engineers';

DO $$
BEGIN
  RAISE NOTICE '✅ Production migration completed successfully!';
END $$;

