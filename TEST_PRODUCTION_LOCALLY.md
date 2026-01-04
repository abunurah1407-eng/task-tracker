# Testing Production Build Locally

This guide helps you test the production Docker build locally before pushing to Docker Hub.

## Step 1: Stop Any Running Containers

```bash
docker compose down
```

## Step 2: Remove Old Database Volume (Optional)

If you want to test with a fresh database (to verify seeding works):

```bash
docker volume rm task-tracker_postgres_data
```

**Note:** This will delete all existing data. Only do this if you want a clean test.

## Step 3: Build Production Images

Build the production Docker images:

```bash
# Build backend
cd backend
docker build -t task-tracker-backend:local .
cd ..

# Build frontend
docker build -t task-tracker-frontend:local --build-arg VITE_API_URL=http://localhost:3001/api .
```

Or build both at once:

```bash
docker compose build --no-cache
```

## Step 4: Start Production Containers

```bash
docker compose up -d
```

## Step 5: Check Container Status

```bash
docker compose ps
```

All containers should show "Up" status.

## Step 6: View Logs

Check if everything started correctly:

```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
```

## Step 7: Verify Database Seeding

Check if the database was seeded correctly:

```bash
# Connect to database
docker compose exec postgres psql -U postgres -d task_tracker

# Then run these SQL queries:
SELECT COUNT(*) FROM engineers;
SELECT COUNT(*) FROM services;
SELECT COUNT(*) FROM users;
SELECT email, name, role FROM users;

# Exit with: \q
```

Expected results:
- 13 engineers
- 37 services (13 primary + 24 secondary)
- 15 users (1 admin + 1 director + 13 engineers)

## Step 8: Test the Application

1. **Frontend**: Open http://localhost in your browser
2. **Backend API**: Test http://localhost:3001/health
3. **Database Admin**: Open http://localhost:8080 (Adminer)

### Test Login Credentials

Try logging in with:
- **Admin**: `admin@etec.gov.sa` / `password123`
- **Director**: `N.Saleem@etec.gov.sa` / `password123`
- **Engineer**: `F.Ammaj@etec.gov.sa` / `password123` (Faisal)

## Step 9: Verify All Features

Test these features:
- [ ] Login with different user roles
- [ ] View tasks (engineer should only see their tasks)
- [ ] Create a new task
- [ ] Edit a task
- [ ] Delete a task
- [ ] Import tasks from Excel
- [ ] Export tasks to CSV
- [ ] View engineer dashboard
- [ ] View director/admin dashboard

## Step 10: Clean Up (After Testing)

When done testing:

```bash
# Stop containers
docker compose down

# Remove containers and volumes (optional - deletes all data)
docker compose down -v
```

## Troubleshooting

### Port Already in Use

If port 80 is already in use, change it in `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8081:80"  # Changed from 80:80
```

Then access at http://localhost:8081

### Database Not Seeding

Check the postgres logs:

```bash
docker compose logs postgres
```

Look for messages about running initialization scripts.

### Backend Not Starting

Check backend logs:

```bash
docker compose logs backend
```

Common issues:
- Database connection errors (wait for postgres to be healthy)
- Missing environment variables

### Frontend Not Loading

Check frontend logs:

```bash
docker compose logs frontend
```

Verify the API URL is correct in the build args.

## Next Steps

Once everything works locally:

1. Tag images for Docker Hub:
   ```bash
   docker tag task-tracker-backend:local abunurah1407/task-tracker-backend:latest
   docker tag task-tracker-frontend:local abunurah1407/task-tracker-frontend:latest
   ```

2. Push to Docker Hub (see [DOCKER_HUB_PUSH.md](./DOCKER_HUB_PUSH.md))


