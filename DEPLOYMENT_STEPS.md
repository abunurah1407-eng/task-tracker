# Complete Deployment Steps (Frontend + Backend + Database)

## What's New

### Frontend
- ✅ Added pagination to "All Tasks" section for Director and Admin views
- ✅ Shows 20 tasks per page with navigation controls
- ✅ Only applies when "Group by: None" is selected in the All Tasks tab

### Backend
- ✅ Fixed SQL queries to remove references to `u.color` (uses `e.color` from engineers table instead)
- ✅ Migration script included in backend image: `migration_production_complete.sql`

### Database
- ⚠️ **Migration needs to be run** to ensure schema is up to date

## Complete Deployment Steps

### 1. SSH into Your Production Server
```bash
ssh your-user@task-tracker.etec.gov.sa
```

### 2. Navigate to Your Project Directory
```bash
cd /opt/task-tracker
```

### 3. Pull the Latest Images
```bash
# Pull frontend image
docker pull abunurah1407/task-tracker-frontend:latest

# Pull backend image (if not already up to date)
docker pull abunurah1407/task-tracker-backend:latest
```

### 4. Run Database Migration (IMPORTANT - Do this first!)

The migration script is already included in the backend image. Run it using one of these methods:

#### Option A: Using the migration file from backend container (Recommended)
```bash
docker compose -f docker-compose.prod.yml exec backend cat /app/db/migration_production_complete.sql | \
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d task_tracker
```

#### Option B: Direct SQL execution (if Option A doesn't work)
```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d task_tracker <<'EOF'
-- Add color column to users if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'color') THEN
    ALTER TABLE users ADD COLUMN color VARCHAR(7);
  END IF;
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

-- Create indexes
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
EOF
```

**Expected Output:** You should see messages like:
- `NOTICE: Added color column to users table` (if column was missing)
- `✅ Production migration completed successfully!`

### 5. Restart Backend Container (to use latest image)
```bash
docker compose -f docker-compose.prod.yml up -d --no-deps backend
```

### 6. Restart Frontend Container
```bash
docker compose -f docker-compose.prod.yml up -d --no-deps frontend
```

The `--no-deps` flag ensures only the specified container is restarted without affecting other services.

### 7. Verify the Deployment
```bash
# Check if containers are running
docker compose -f docker-compose.prod.yml ps

# Check backend logs for any errors
docker compose -f docker-compose.prod.yml logs backend | tail -20

# Check frontend logs for any errors
docker compose -f docker-compose.prod.yml logs frontend | tail -20
```

### 8. Test the Features
1. Open your browser and navigate to `https://task-tracker.etec.gov.sa`
2. Log in as Director or Admin
3. Navigate to the "All Tasks" tab
4. Make sure "Group by: None" is selected
5. You should see pagination controls at the bottom if there are more than 20 tasks
6. Test the Previous/Next buttons and page numbers

## Rollback (If Needed)

If you encounter any issues and need to rollback:

```bash
# Stop the frontend container
docker compose -f docker-compose.prod.yml stop frontend

# Pull a previous version (if you have one tagged)
docker pull abunurah1407/task-tracker-frontend:previous-tag

# Update docker-compose.prod.yml to use the previous tag, then restart
docker compose -f docker-compose.prod.yml up -d frontend
```

## Quick Deployment Commands

### Frontend Only (if you only need pagination):
```bash
cd /opt/task-tracker && docker pull abunurah1407/task-tracker-frontend:latest && docker compose -f docker-compose.prod.yml up -d --no-deps frontend
```

### Complete Deployment (Frontend + Backend + Migration):
```bash
cd /opt/task-tracker && \
docker pull abunurah1407/task-tracker-frontend:latest && \
docker pull abunurah1407/task-tracker-backend:latest && \
docker compose -f docker-compose.prod.yml exec backend cat /app/db/migration_production_complete.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d task_tracker && \
docker compose -f docker-compose.prod.yml up -d --no-deps backend frontend
```

## Notes

### Frontend (Pagination)
- The pagination feature only appears in the "All Tasks" tab when "Group by: None" is selected
- Other views (grouped by engineer, service, or status) are not affected
- The feature works with all existing filters (search, status, engineer, priority, etc.)

### Backend
- Backend fixes remove SQL errors related to `u.color` column
- Backend now correctly uses `e.color` from the engineers table
- Migration script is included in the backend image at `/app/db/migration_production_complete.sql`

### Database Migration
- **IMPORTANT:** The migration script is idempotent (safe to run multiple times)
- It adds missing columns and creates necessary indexes
- Run it even if you think your database is up to date - it will skip existing columns

## Troubleshooting

### Frontend Issues (Pagination not appearing):
1. Make sure you're on the "All Tasks" tab
2. Ensure "Group by: None" is selected
3. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for any JavaScript errors
5. Verify the frontend container is running the latest image:
   ```bash
   docker compose -f docker-compose.prod.yml exec frontend cat /usr/share/nginx/html/index.html | head -20
   ```

### Backend Issues (SQL errors about color column):
1. Verify the migration was run successfully:
   ```bash
   docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "\d users"
   ```
   You should see the `color` column listed.

2. Check backend logs for errors:
   ```bash
   docker compose -f docker-compose.prod.yml logs backend | grep -i error
   ```

3. If migration file is not found in backend container:
   ```bash
   # Check if file exists
   docker compose -f docker-compose.prod.yml exec backend ls -la /app/db/
   ```
   If it doesn't exist, pull the latest backend image again.

### Database Migration Issues:
- If the migration command fails, try Option B (direct SQL execution) instead
- Check PostgreSQL logs:
  ```bash
  docker compose -f docker-compose.prod.yml logs postgres | tail -50
  ```
- Verify database connection:
  ```bash
  docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "SELECT version();"
  ```

