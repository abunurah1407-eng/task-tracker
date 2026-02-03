# Production Database Migration Guide

This guide ensures all database schema changes are applied to your production database.

## Migration Script

A comprehensive migration script has been created: `backend/src/db/migration_production_complete.sql`

This script is **idempotent** (safe to run multiple times) and includes:

1. **Users Table:**
   - ✅ Add `color` column (if missing)
   - ✅ Add `password_reset_token` column (if missing)
   - ✅ Add `password_reset_expires` column (if missing)

2. **Engineers Table:**
   - ✅ Add `user_id` column (if missing)
   - ✅ Add foreign key constraint to users table
   - ✅ Populate `user_id` by matching engineer names
   - ✅ Create index on `user_id`

3. **Services Table:**
   - ✅ Ensure `id` column exists (PRIMARY KEY)

4. **Reminder Settings Table:**
   - ✅ Create table if it doesn't exist
   - ✅ Insert default settings if none exist

5. **Performance Indexes:**
   - ✅ Create all necessary indexes for optimal performance

## How to Apply Migration

### Option 1: Using Docker Compose (Recommended)

```bash
# SSH into your production server
ssh user@your-production-server

# Navigate to project directory
cd /opt/task-tracker

# Copy the migration file to the postgres container and run it
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -f /tmp/migration_production_complete.sql

# Or if you need to copy the file first:
docker cp backend/src/db/migration_production_complete.sql task-tracker-db:/tmp/migration_production_complete.sql
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -f /tmp/migration_production_complete.sql
```

### Option 2: Direct Database Connection

```bash
# If you have direct database access
psql -h your-db-host -U postgres -d task_tracker -f backend/src/db/migration_production_complete.sql
```

### Option 3: Using Adminer (Web Interface)

1. Access Adminer at `http://your-server:8080`
2. Connect to your database
3. Go to "SQL command"
4. Copy and paste the contents of `migration_production_complete.sql`
5. Execute

### Option 4: Copy SQL Content Directly

```bash
# Copy the migration SQL content
cat backend/src/db/migration_production_complete.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d task_tracker
```

## Verification

After running the migration, verify it was successful:

```bash
# Check users table columns
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "\d users"

# Check engineers table columns
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "\d engineers"

# Check if reminder_settings table exists
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "SELECT COUNT(*) FROM reminder_settings;"

# Check indexes
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "SELECT indexname FROM pg_indexes WHERE tablename = 'engineers';"
```

## Expected Results

After migration, you should see:

- ✅ `users` table has `color`, `password_reset_token`, `password_reset_expires` columns
- ✅ `engineers` table has `user_id` column with foreign key constraint
- ✅ `reminder_settings` table exists with at least one row
- ✅ All performance indexes are created
- ✅ `services` table has `id` PRIMARY KEY column

## Troubleshooting

### If migration fails:

1. **Check database connection:**
   ```bash
   docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "SELECT 1;"
   ```

2. **Check current schema:**
   ```bash
   docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "\d users"
   ```

3. **View migration errors:**
   The migration script uses `RAISE NOTICE` which will show what's being applied. Check the output for any errors.

### Rollback

The migration script is designed to be safe and only adds missing columns/tables. If you need to rollback:

- **Remove color column from users (if needed):**
  ```sql
  ALTER TABLE users DROP COLUMN IF EXISTS color;
  ```

- **Remove password reset columns (if needed):**
  ```sql
  ALTER TABLE users DROP COLUMN IF EXISTS password_reset_token;
  ALTER TABLE users DROP COLUMN IF EXISTS password_reset_expires;
  ```

**Note:** Only rollback if absolutely necessary. These columns are used by the application.

## Next Steps

After migration:

1. ✅ Restart backend service to ensure it picks up schema changes
2. ✅ Verify application is working correctly
3. ✅ Test user management features
4. ✅ Test reminder settings functionality

```bash
# Restart backend
docker compose -f docker-compose.prod.yml restart backend

# Check logs
docker compose -f docker-compose.prod.yml logs -f backend
```

