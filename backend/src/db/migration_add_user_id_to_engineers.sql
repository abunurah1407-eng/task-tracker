-- Migration: Add user_id reference to engineers table
-- This migration adds a user_id column to the engineers table and populates it
-- by matching engineer names with user engineer_name fields

-- Step 1: Add user_id column to engineers table
ALTER TABLE engineers 
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Step 2: Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'engineers_user_id_fkey'
  ) THEN
    ALTER TABLE engineers
    ADD CONSTRAINT engineers_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 3: Populate user_id by matching engineer name with user engineer_name
UPDATE engineers e
SET user_id = u.id
FROM users u
WHERE e.name = u.engineer_name
  AND u.role = 'engineer'
  AND e.user_id IS NULL;

-- Step 4: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_engineers_user_id ON engineers(user_id);

