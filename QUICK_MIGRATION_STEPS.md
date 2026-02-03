# Quick Production Migration Steps

## One-Command Migration

Run this on your production server:

```bash
cd /opt/task-tracker && \
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker < <(cat <<'EOF'
-- Complete Production Migration Script
DO $$ BEGIN
  -- Add color column to users if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'color') THEN
    ALTER TABLE users ADD COLUMN color VARCHAR(7);
  END IF;
  
  -- Add password reset columns to users if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_reset_token') THEN
    ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_reset_expires') THEN
    ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP DEFAULT NULL;
  END IF;
END $$;

-- Engineers: Add user_id column and foreign key
ALTER TABLE engineers ADD COLUMN IF NOT EXISTS user_id INTEGER;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engineers_user_id_fkey') THEN
    ALTER TABLE engineers ADD CONSTRAINT engineers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
UPDATE engineers e SET user_id = u.id FROM users u WHERE e.name = u.engineer_name AND u.role = 'engineer' AND e.user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_engineers_user_id ON engineers(user_id);

-- Services: Ensure id column exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'id') THEN
    IF EXISTS (SELECT 1 FROM services LIMIT 1) THEN
      ALTER TABLE services ADD COLUMN id SERIAL;
      ALTER TABLE services ADD PRIMARY KEY (id);
    ELSE
      ALTER TABLE services ADD COLUMN id SERIAL PRIMARY KEY;
    END IF;
  END IF;
END $$;

-- Reminder settings table
CREATE TABLE IF NOT EXISTS reminder_settings (
  id SERIAL PRIMARY KEY,
  enabled BOOLEAN DEFAULT TRUE,
  frequency VARCHAR(50) NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  day_of_week INTEGER DEFAULT 0 CHECK (day_of_week >= 0 AND day_of_week <= 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO reminder_settings (enabled, frequency, day_of_week)
SELECT TRUE, 'weekly', 0 WHERE NOT EXISTS (SELECT 1 FROM reminder_settings);

-- Performance indexes
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
EOF
)
```

## Alternative: Using Migration File from Backend Image

The migration file is included in the backend Docker image. You can extract and run it:

```bash
# Extract migration file from backend container
docker compose -f docker-compose.prod.yml exec backend cat /app/db/migration_production_complete.sql | \
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d task_tracker
```

Or if the file is in the backend image at `/app/db/`:

```bash
# Copy from backend container to postgres container
docker compose -f docker-compose.prod.yml exec backend cat /app/db/migration_production_complete.sql | \
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d task_tracker
```

## Verify Migration

```bash
# Check users table has all columns
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "\d users"

# Check engineers has user_id
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "\d engineers"

# Check reminder_settings exists
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "SELECT * FROM reminder_settings;"
```

## After Migration

Restart the backend to ensure it picks up all changes:

```bash
docker compose -f docker-compose.prod.yml restart backend
```

