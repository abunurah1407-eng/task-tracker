# Linux Server Deployment Guide

Complete guide for deploying Task Tracker on a Linux server using Docker images from Docker Hub.

## Prerequisites

### Step 1: Install Docker

#### For Ubuntu/Debian:

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
sudo docker --version
```

#### For CentOS/RHEL:

```bash
# Install required packages
sudo yum install -y yum-utils

# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker Engine
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
sudo docker --version
```

### Step 2: Verify Docker Compose

Docker Compose V2 is included with Docker. Verify it's installed:

```bash
docker compose version
```

If not available, install it separately:

```bash
# For Ubuntu/Debian
sudo apt-get install -y docker-compose-plugin

# For CentOS/RHEL
sudo yum install -y docker-compose-plugin
```

### Step 3: Configure Firewall (if applicable)

```bash
# Allow HTTP (port 80)
sudo ufw allow 80/tcp

# Allow HTTPS (port 443) - if using SSL
sudo ufw allow 443/tcp

# Allow backend API (port 3001) - if exposing externally
sudo ufw allow 3001/tcp

# Allow database port (port 5433) - only if needed externally
# sudo ufw allow 5433/tcp

# Enable firewall
sudo ufw enable
```

## Deployment Steps

### Step 1: Create Project Directory

```bash
# Create directory for the application
sudo mkdir -p /opt/task-tracker
cd /opt/task-tracker
```

### Step 2: Create Environment File

Create a `.env` file with your production configuration:

```bash
sudo nano .env
```

Add the following content (replace with your actual values):

```env
# Docker Hub Configuration
DOCKER_HUB_USERNAME=abunurah1407
IMAGE_TAG=latest

# Database Configuration
DB_PASSWORD=your_secure_database_password_here
DB_PORT=5433

# Backend Configuration
BACKEND_PORT=3001
JWT_SECRET=your_very_secure_jwt_secret_key_here_change_this
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com

# Frontend Configuration
FRONTEND_PORT=80

# Adminer Configuration (optional - remove in production)
ADMINER_PORT=8080
```

**Important Security Notes:**
- Generate a strong `DB_PASSWORD` (at least 16 characters)
- Generate a strong `JWT_SECRET` (use: `openssl rand -base64 32`)
- Set `CORS_ORIGIN` to your actual production domain
- Consider removing Adminer in production

### Step 3: Create docker-compose.prod.yml

Create the production docker-compose file:

```bash
sudo nano docker-compose.prod.yml
```

Add the following content:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:17-alpine
    container_name: task-tracker-db
    environment:
      POSTGRES_DB: task_tracker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "${DB_PORT:-5433}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - task-tracker-network
    restart: unless-stopped

  # Backend API
  backend:
    image: ${DOCKER_HUB_USERNAME}/task-tracker-backend:${IMAGE_TAG:-latest}
    container_name: task-tracker-api
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: task_tracker
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      CORS_ORIGIN: ${CORS_ORIGIN}
    ports:
      - "${BACKEND_PORT:-3001}:3001"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - task-tracker-network
    restart: unless-stopped

  # Frontend
  frontend:
    image: ${DOCKER_HUB_USERNAME}/task-tracker-frontend:${IMAGE_TAG:-latest}
    container_name: task-tracker-frontend
    ports:
      - "${FRONTEND_PORT:-80}:80"
    depends_on:
      - backend
    networks:
      - task-tracker-network
    restart: unless-stopped

  # Database Admin (Adminer) - Optional, remove in production
  adminer:
    image: adminer:latest
    container_name: task-tracker-adminer
    ports:
      - "${ADMINER_PORT:-8080}:8080"
    depends_on:
      - postgres
    networks:
      - task-tracker-network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local

networks:
  task-tracker-network:
    driver: bridge
```

### Step 4: Create docker-compose.prod.yml

The database initialization files (schema.sql and seed.sql) are included in the backend Docker image, so no manual download is needed. The docker-compose.prod.yml uses an init container to copy these files from the backend image to a shared volume for PostgreSQL.

### Step 5: Create docker-compose.prod.yml

Create the production docker-compose file (or use the one from the deployment script):

```bash
sudo nano docker-compose.prod.yml
```

The docker-compose.prod.yml will use an init container that copies SQL files from the backend image, so everything comes from Docker Hub - no GitHub downloads needed.

### Step 6: Login to Docker Hub (if images are private)

If your Docker Hub images are private, login first:

```bash
docker login
```

Enter your Docker Hub username and password (or access token).

### Step 7: Pull Docker Images

Pull the images from Docker Hub:

```bash
# Pull all images
docker compose -f docker-compose.prod.yml --env-file .env pull

# Or pull individually
docker pull abunurah1407/task-tracker-backend:latest
docker pull abunurah1407/task-tracker-frontend:latest
docker pull postgres:17-alpine
docker pull adminer:latest
```

### Step 8: Start the Application

Start all services:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

### Step 9: Verify Deployment

Check container status:

```bash
docker compose -f docker-compose.prod.yml ps
```

All containers should show "Up" status.

Check logs:

```bash
# All services
docker compose -f docker-compose.prod.yml logs

# Specific service
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs postgres
```

Test the health endpoint:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","message":"Task Tracker API is running"}
```

## Post-Deployment Configuration

### Step 1: Verify Database Seeding

Check if the database was seeded correctly:

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "SELECT COUNT(*) FROM users;"
```

Expected: 15 users

### Step 2: Test Login

Access the application:
- Frontend: `http://your-server-ip` or `https://yourdomain.com`
- Backend API: `http://your-server-ip:3001` or `https://yourdomain.com:3001`

Test login with:
- Email: `admin@etec.gov.sa`
- Password: `password123`

**⚠️ IMPORTANT:** Change all default passwords in production!

### Step 3: Configure Reverse Proxy (Recommended)

For production, use Nginx as a reverse proxy:

#### Install Nginx:

```bash
sudo apt-get install -y nginx
```

#### Create Nginx Configuration:

```bash
sudo nano /etc/nginx/sites-available/task-tracker
```

Add configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/task-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Set Up SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
```

## Management Commands

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
```

### Stop Services

```bash
docker compose -f docker-compose.prod.yml down
```

### Start Services

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Restart Services

```bash
docker compose -f docker-compose.prod.yml restart
```

### Update Images

```bash
# Pull latest images
docker compose -f docker-compose.prod.yml --env-file .env pull

# Restart services
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

### Backup Database

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres task_tracker > backup_$(date +%Y%m%d_%H%M%S).sql

# Or backup the volume
docker run --rm -v task-tracker_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup_$(date +%Y%m%d_%H%M%S).tar.gz /data
```

### Restore Database

```bash
# Restore from SQL file
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d task_tracker < backup_file.sql
```

## Troubleshooting

### Containers Not Starting

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check container status
docker compose -f docker-compose.prod.yml ps

# Check Docker system
docker system df
```

### Port Already in Use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3001

# Stop conflicting service or change port in .env
```

### Database Connection Issues

```bash
# Check if PostgreSQL is healthy
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Test connection
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d task_tracker -c "SELECT 1;"
```

### Images Not Found

```bash
# Verify Docker Hub username and image names
docker pull ${DOCKER_HUB_USERNAME}/task-tracker-backend:latest

# Check if you're logged in
docker login

# Verify image exists on Docker Hub
```

### Permission Issues

```bash
# Add user to docker group (to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Fix file permissions
sudo chown -R $USER:$USER /opt/task-tracker
```

## Security Checklist

- [ ] Changed default database password
- [ ] Changed JWT_SECRET to a strong random value
- [ ] Set CORS_ORIGIN to production domain
- [ ] Removed or secured Adminer (change port, add authentication)
- [ ] Set up SSL/HTTPS
- [ ] Configured firewall rules
- [ ] Changed all default user passwords
- [ ] Set up regular database backups
- [ ] Configured log rotation
- [ ] Set up monitoring and alerts

## Maintenance

### Regular Updates

```bash
# Pull latest images
docker compose -f docker-compose.prod.yml --env-file .env pull

# Restart with new images
docker compose -f docker-compose.prod.yml --env-file .env up -d

# Clean up old images
docker image prune -a
```

### Monitor Resources

```bash
# Check container resource usage
docker stats

# Check disk usage
docker system df
df -h
```

## Support

For issues or questions:
- Check logs: `docker compose -f docker-compose.prod.yml logs`
- Review this guide
- Check GitHub repository: https://github.com/abunurah1407-eng/task-tracker

