-- Migration: Add soft delete support to tasks table
-- Run this migration to add deleted_at column

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);

-- Update existing queries to exclude deleted tasks
-- (This is handled in the application code)

