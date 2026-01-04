# Docker Quick Start Guide

## ✅ Your App is Now Running in Docker!

### Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Database Admin**: http://localhost:8080 (Adminer)

### Default Login Credentials

- **Admin**: `admin@etec.com` / `password123`
- **Director**: `director@etec.com` / `password123`
- **Engineer**: `faisal@etec.com` / `password123`
- **Engineer**: `abeer@etec.com` / `password123`

## Docker Commands

### View Running Containers
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Stop All Services
```bash
docker compose down
```

### Start Services
```bash
docker compose up -d
```

### Rebuild After Code Changes
```bash
docker compose build
docker compose up -d
```

### Access Database
```bash
docker compose exec postgres psql -U postgres -d task_tracker
```

### Restart a Service
```bash
docker compose restart backend
docker compose restart frontend
```

## What's Running

1. **PostgreSQL Database** (port 5433 externally, 5432 internally)
   - Database: `task_tracker`
   - User: `postgres`
   - Password: `postgres123`

2. **Backend API** (port 3001)
   - Express server
   - Connected to PostgreSQL
   - JWT authentication

3. **Frontend** (port 80)
   - React app served by Nginx
   - Connected to backend API

4. **Adminer** (port 8080)
   - Web-based database administration
   - Login with: postgres / postgres123

## Troubleshooting

### Frontend Not Loading
- Check if container is running: `docker compose ps`
- Check logs: `docker compose logs frontend`
- Verify port 80 is not in use

### Backend Not Responding
- Check logs: `docker compose logs backend`
- Verify database connection
- Check health endpoint: `curl http://localhost:3001/health`

### Database Issues
- Check if PostgreSQL is healthy: `docker compose ps`
- Access database: `docker compose exec postgres psql -U postgres -d task_tracker`
- Check tables: `\dt`

## Next Steps

1. Open http://localhost in your browser
2. Login with one of the default users
3. Start using the Task Tracker!

For more details, see `DOCKER.md`
