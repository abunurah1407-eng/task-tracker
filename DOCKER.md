# Docker Guide

Complete guide for running Task Tracker with Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

### Production Mode

1. **Start all services:**
   ```bash
   docker compose up -d
   ```

2. **Run database setup:**
   ```bash
   # Wait a few seconds for PostgreSQL to start, then:
   docker compose exec backend npm run migrate
   docker compose exec backend npm run seed
   ```

3. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health
   - Database Admin: http://localhost:8080

### Development Mode

1. **Start all services:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:5173 (with hot reload)
   - Backend API: http://localhost:3001 (with hot reload)

## Docker Commands

### Start Services
```bash
docker compose up -d
```

### Stop Services
```bash
docker compose down
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

### Rebuild Containers
```bash
docker compose build --no-cache
docker compose up -d
```

### Stop and Remove Everything (including volumes)
```bash
docker compose down -v
```

### Execute Commands in Containers
```bash
# Backend
docker compose exec backend sh

# Database
docker compose exec postgres psql -U postgres -d task_tracker

# Frontend
docker compose exec frontend sh
```

## Services

### PostgreSQL Database
- **Container**: `task-tracker-db`
- **Port**: `5433` (external), `5432` (internal)
- **Database**: `task_tracker`
- **User**: `postgres`
- **Password**: `postgres123` (change in production!)

### Backend API
- **Container**: `task-tracker-api`
- **Port**: `3001`
- **Health Check**: http://localhost:3001/health

### Frontend
- **Container**: `task-tracker-frontend`
- **Port**: `80` (production) or `5173` (development)

### Adminer (Database Admin)
- **Container**: `task-tracker-adminer`
- **Port**: `8080`
- **Access**: http://localhost:8080
- **Login**: System: PostgreSQL, Server: postgres, User: postgres, Password: postgres123, Database: task_tracker

## Environment Variables

All environment variables are configured in `docker-compose.yml`. To modify:

1. Edit `docker-compose.yml`
2. Rebuild containers: `docker compose build`
3. Restart: `docker compose up -d`

## Database Management

### Access Database via Command Line
```bash
docker compose exec postgres psql -U postgres -d task_tracker
```

### Access Database via Adminer
1. Open http://localhost:8080
2. Login with:
   - System: PostgreSQL
   - Server: postgres
   - Username: postgres
   - Password: postgres123
   - Database: task_tracker

### Run Migrations
```bash
docker compose exec backend npm run migrate
```

### Seed Database
```bash
docker compose exec backend npm run seed
```

## Troubleshooting

### Port Conflicts
If ports are already in use, modify `docker-compose.yml` to use different ports.

### Container Won't Start
- Check logs: `docker compose logs <service-name>`
- Verify Docker is running
- Check disk space: `docker system df`

### Database Connection Issues
- Verify PostgreSQL container is healthy: `docker compose ps`
- Check database logs: `docker compose logs postgres`
- Verify network connectivity between containers

### Rebuild Everything
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## Production Deployment

For production:
1. Change default passwords in `docker-compose.yml`
2. Set strong JWT_SECRET
3. Configure proper CORS_ORIGIN
4. Use environment variables or secrets management
5. Set up SSL/HTTPS
6. Configure backups for database volume
