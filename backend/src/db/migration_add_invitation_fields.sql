-- Add invitation fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS invitation_expires TIMESTAMP DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);

