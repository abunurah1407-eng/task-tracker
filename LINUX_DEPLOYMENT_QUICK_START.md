# Linux Server Deployment - Quick Start

Quick reference guide for deploying Task Tracker on a Linux server.

## Prerequisites Installation

### Install Docker (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
```

### Install Docker (CentOS/RHEL)

```bash
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
```

## Quick Deployment

### Option 1: Using the Automated Script

```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/abunurah1407-eng/task-tracker/main/deploy-linux-server.sh | bash

# Or clone the repo and run
git clone https://github.com/abunurah1407-eng/task-tracker.git
cd task-tracker
chmod +x deploy-linux-server.sh
./deploy-linux-server.sh
```

### Option 2: Manual Steps

```bash
# 1. Create project directory
sudo mkdir -p /opt/task-tracker
cd /opt/task-tracker

# 2. Create .env file (edit with your values)
cat > .env <<EOF
DOCKER_HUB_USERNAME=abunurah1407
IMAGE_TAG=latest
DB_PASSWORD=your_secure_password
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://yourdomain.com
FRONTEND_PORT=80
BACKEND_PORT=3001
DB_PORT=5433
ADMINER_PORT=8080
EOF

# 3. Download docker-compose.prod.yml
curl -fsSL https://raw.githubusercontent.com/abunurah1407-eng/task-tracker/main/docker-compose.prod.yml -o docker-compose.prod.yml

# Note: Database files (schema.sql, seed.sql) are included in the backend Docker image
# No need to download them - everything comes from Docker Hub!

# 4. Login to Docker Hub (if private)
docker login

# 5. Pull images (all from Docker Hub - no GitHub needed)
docker compose -f docker-compose.prod.yml --env-file .env pull

# 6. Start services (init container will copy SQL files from backend image)
docker compose -f docker-compose.prod.yml --env-file .env up -d

# 8. Check status
docker compose -f docker-compose.prod.yml ps
```

## Essential Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml --env-file .env logs -f

# Stop services
docker compose -f docker-compose.prod.yml --env-file .env down

# Start services
docker compose -f docker-compose.prod.yml --env-file .env up -d

# Restart services
docker compose -f docker-compose.prod.yml --env-file .env restart

# Update to latest images
docker compose -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.prod.yml --env-file .env up -d

# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres task_tracker > backup.sql
```

## Access Points

- **Frontend**: `http://your-server-ip` or `https://yourdomain.com`
- **Backend API**: `http://your-server-ip:3001/api`
- **Health Check**: `http://your-server-ip:3001/health`
- **Database Admin**: `http://your-server-ip:8080` (if enabled)

## Default Login

- **Admin**: `admin@etec.gov.sa` / `password123`
- **Director**: `N.Saleem@etec.gov.sa` / `password123`

**⚠️ Change all passwords in production!**

## Troubleshooting

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs

# Test database connection
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "SELECT 1;"

# Check if ports are in use
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3001
```

## Full Documentation

For complete instructions, see: [LINUX_SERVER_DEPLOYMENT.md](./LINUX_SERVER_DEPLOYMENT.md)

