# Task Tracker - Docker Edition

A modern, full-stack task tracking and management system that runs entirely in Docker.

## 🐳 Docker-Only Application

This application is designed to **build and run using Docker only**. All services (frontend, backend, database) are containerized and managed through Docker Compose.

## 📋 Prerequisites

- **Docker Desktop** installed and running
- **Docker Compose** (included with Docker Desktop)

## 🚀 Quick Start

### Production Mode

1. **Start all services:**
   ```bash
   docker compose up -d
   ```
   
   The database is automatically seeded on first startup with all engineers, services, and users.

2. **Access the application:**
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:3001
   - **Health Check**: http://localhost:3001/health
   - **Database Admin**: http://localhost:8080 (Adminer)

### Development Mode

```bash
docker compose -f docker-compose.dev.yml up -d
```

- **Frontend**: http://localhost:5173 (with hot reload)
- **Backend API**: http://localhost:3001 (with hot reload)

## 🔐 Default Login Credentials

- **Admin**: `admin@etec.gov.sa` / `password123`
- **Director**: `N.Saleem@etec.gov.sa` (Nasser M. Al-Saleem) / `password123`
- **Engineers** (all use password `password123`):
  - `F.Ammaj@etec.gov.sa` (Faisal AlAmmaj)
  - `A.Osaimi@etec.gov.sa` (Abeer M. Al-Osaimi)
  - `m.shahrani@etec.gov.sa` (Mohammed AlShahrani)
  - `W.rashed@etec.gov.sa` (Wed N Alrashed)
  - `s.dossari@etec.gov.sa` (Sultan Aldossari)
  - `A.Tfaleh@etec.gov.sa` (Abdullah T. Al-Faleh)
  - `M.Sahli@etec.gov.sa` (Milaf S. Al-Sahli)
  - `m.ageeli@etec.gov.sa` (Mohammed Ageeli)
  - `g.omair@etec.gov.sa` (Ghaida AlOmair)
  - `a.nswailem@etec.gov.sa` (Amani AL-Swailem)
  - `M.Hshammari@etec.gov.sa` (Menwer AlShammari)
  - `a.derwish@etec.gov.sa` (Abdulrahman Alderwish)
  - `A.AAAhmari@etec.gov.sa` (Aryam Al-Ahmari)

**⚠️ IMPORTANT:** Change all default passwords in production!

## 📚 Documentation

- **[DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md)** - Quick reference guide
- **[DOCKER.md](./DOCKER.md)** - Complete Docker guide with all commands and troubleshooting
- **[DOCKER_HUB_PUSH.md](./DOCKER_HUB_PUSH.md)** - Guide for pushing to Docker Hub
- **[TEST_PRODUCTION_LOCALLY.md](./TEST_PRODUCTION_LOCALLY.md)** - Guide for testing production build locally

## 🛠 Common Docker Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Rebuild containers
docker compose build --no-cache
docker compose up -d

# Access database
docker compose exec postgres psql -U postgres -d task_tracker

# Run migrations
docker compose exec backend npm run migrate

# Seed database
docker compose exec backend npm run seed
```

## 🏗 Services

- **PostgreSQL Database** - Port 5433 (external), 5432 (internal)
- **Backend API** - Port 3001
- **Frontend** - Port 80 (production) or 5173 (development)
- **Adminer** - Port 8080 (Database administration UI)

## 🔧 Troubleshooting

See [DOCKER.md](./DOCKER.md) for detailed troubleshooting steps.

**Quick fixes:**
- **Containers won't start**: Check Docker is running with `docker ps`
- **Port conflicts**: Modify ports in `docker-compose.yml`
- **Database issues**: Check logs with `docker compose logs postgres`

## 📝 Notes

- All environment variables are configured in `docker-compose.yml`
- Database data persists in Docker volumes
- For production, change default passwords and set strong JWT_SECRET

---

**Built with ❤️ for efficient task tracking and management**

