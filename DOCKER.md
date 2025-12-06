# Docker Guide

Complete guide for running Task Tracker with Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

### Production Mode

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Run database setup:**
   ```bash
   # Wait a few seconds for PostgreSQL to start, then:
   docker-compose exec backend npm run migrate
   docker-compose exec backend npm run seed
   ```

   Or use the setup script:
   ```powershell
   .\docker-setup.ps1
   ```

3. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

### Development Mode

1. **Start all services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:5173 (with hot reload)
   - Backend API: http://localhost:3001 (with hot reload)

## Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild Containers
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Stop and Remove Everything (including volumes)
```bash
docker-compose down -v
```

### Execute Commands in Containers
```bash
# Backend
docker-compose exec backend sh

# Database
docker-compose exec postgres psql -U postgres -d task_tracker

# Frontend
docker-compose exec frontend sh
```

## Services

### PostgreSQL Database
- **Container**: `task-tracker-db`
- **Port**: `5432`
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
- **URL**: http://localhost

## Environment Variables

### Production (docker-compose.yml)

The following environment variables are set in `docker-compose.yml`:

```yaml
DB_HOST: postgres
DB_PORT: 5432
DB_NAME: task_tracker
DB_USER: postgres
DB_PASSWORD: postgres123
JWT_SECRET: task_tracker_super_secret_key_change_in_production_2024
CORS_ORIGIN: http://localhost
```

**⚠️ Change these values for production!**

### Custom Environment Variables

Create a `.env` file in the root directory:

```env
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_secret_key
```

Then update `docker-compose.yml` to use these variables.

## Database Management

### Access PostgreSQL
```bash
docker-compose exec postgres psql -U postgres -d task_tracker
```

### Run Migrations
```bash
docker-compose exec backend npm run migrate
```

### Seed Database
```bash
docker-compose exec backend npm run seed
```

### Backup Database
```bash
docker-compose exec postgres pg_dump -U postgres task_tracker > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U postgres task_tracker < backup.sql
```

## Troubleshooting

### Containers Won't Start

1. **Check Docker is running:**
   ```bash
   docker ps
   ```

2. **Check logs:**
   ```bash
   docker-compose logs
   ```

3. **Check port conflicts:**
   - Port 80 (frontend)
   - Port 3001 (backend)
   - Port 5432 (database)

### Database Connection Errors

1. **Wait for PostgreSQL to be ready:**
   ```bash
   docker-compose logs postgres
   ```
   Look for: "database system is ready to accept connections"

2. **Check database is running:**
   ```bash
   docker-compose ps
   ```

### Frontend Can't Connect to Backend

1. **Check backend is running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check CORS settings** in `docker-compose.yml`

3. **Check network:**
   ```bash
   docker network ls
   docker network inspect task-tracker_task-tracker-network
   ```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Rebuild all
docker-compose build
docker-compose up -d
```

## Production Deployment

### Security Checklist

- [ ] Change `POSTGRES_PASSWORD` in docker-compose.yml
- [ ] Change `JWT_SECRET` in docker-compose.yml
- [ ] Update `CORS_ORIGIN` to your domain
- [ ] Use environment variables file (`.env`)
- [ ] Enable HTTPS (use reverse proxy)
- [ ] Set up firewall rules
- [ ] Regular backups

### Using Environment File

1. Create `.env` file:
   ```env
   POSTGRES_PASSWORD=secure_password_here
   JWT_SECRET=very_secure_secret_key
   CORS_ORIGIN=https://yourdomain.com
   ```

2. Update `docker-compose.yml`:
   ```yaml
   environment:
     DB_PASSWORD: ${POSTGRES_PASSWORD}
     JWT_SECRET: ${JWT_SECRET}
     CORS_ORIGIN: ${CORS_ORIGIN}
   ```

### With Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:80;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

## Volumes

Data is persisted in Docker volumes:

- `postgres_data`: Database data
- `postgres_data_dev`: Development database data

To remove all data:
```bash
docker-compose down -v
```

## Health Checks

All services have health checks configured:

- **PostgreSQL**: Checks if database is ready
- **Backend**: Checks `/health` endpoint
- **Frontend**: Checks if nginx is serving

View health status:
```bash
docker-compose ps
```

## Development vs Production

### Development Mode
- Hot reload enabled
- Source code mounted as volumes
- Development dependencies included
- More verbose logging

### Production Mode
- Optimized builds
- No source code in containers
- Production dependencies only
- Nginx for static file serving

## Useful Commands

```bash
# View running containers
docker-compose ps

# View resource usage
docker stats

# Clean up unused resources
docker system prune

# View container details
docker inspect task-tracker-api

# Execute command in running container
docker-compose exec backend npm run migrate

# Copy file from container
docker cp task-tracker-api:/app/dist ./local-dist
```

## Next Steps

1. Start the application: `docker-compose up -d`
2. Run setup script: `.\docker-setup.ps1`
3. Access: http://localhost
4. Login with default credentials
5. Start using the application!

