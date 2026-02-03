# Frontend Production Deployment Guide

## ✅ What Was Done

1. **Frontend Docker Image Built**: Successfully built the frontend application using the Dockerfile
2. **Pushed to Docker Hub**: Image pushed to `abunurah1407/task-tracker-frontend:latest`
   - Image digest: `sha256:5137322943b22dae6982ef8736eb678d04d767994c7521cd735a590ddc72e1de`
   - Also tagged with timestamp: `abunurah1407/task-tracker-frontend:20260202-223737`

## 📋 Production Deployment Steps

### Prerequisites

- SSH access to your production server
- Docker and Docker Compose installed on the server
- Access to the project directory (typically `/opt/task-tracker`)

### Step 1: SSH into Production Server

```bash
ssh your-user@task-tracker.etec.gov.sa
# Or your production server address
```

### Step 2: Navigate to Project Directory

```bash
cd /opt/task-tracker
# Or wherever your project is located
```

### Step 3: Pull the Latest Frontend Image

```bash
docker pull abunurah1407/task-tracker-frontend:latest
```

**Expected Output:**
```
latest: Pulling from abunurah1407/task-tracker-frontend
...
Status: Downloaded newer image for abunurah1407/task-tracker-frontend:latest
```

### Step 4: Verify Environment Variables

Make sure your `.env` file (or environment variables) are properly configured:

```bash
# Check if .env file exists
cat .env

# Required variables (if using docker-compose.prod.yml):
# - DOCKER_HUB_USERNAME=abunurah1407 (or your username)
# - IMAGE_TAG=latest
# - FRONTEND_PORT=80 (or your desired port)
# - CORS_ORIGIN=https://your-domain.com
# - FRONTEND_URL=https://your-domain.com
```

### Step 5: Update Frontend Container

Restart the frontend container with the new image:

```bash
# Using docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d --no-deps frontend
```

The `--no-deps` flag ensures only the frontend container is restarted without affecting other services (backend, database, etc.).

### Step 6: Verify Deployment

#### Check Container Status

```bash
docker compose -f docker-compose.prod.yml ps
```

You should see the frontend container running:
```
CONTAINER ID   IMAGE                                          STATUS
xxxxxxxxxxxx   abunurah1407/task-tracker-frontend:latest     Up X seconds
```

#### Check Frontend Logs

```bash
docker compose -f docker-compose.prod.yml logs frontend | tail -20
```

Look for:
- No error messages
- Nginx started successfully
- Health check endpoint responding

#### Test Health Endpoint

```bash
curl http://localhost/health
# Should return: healthy
```

#### Test Frontend in Browser

1. Open your browser and navigate to your production URL (e.g., `https://task-tracker.etec.gov.sa`)
2. Verify the application loads correctly
3. Test key functionality:
   - Login
   - Dashboard loads
   - Navigation works
   - API calls succeed

### Step 7: Verify Image Version

To confirm you're running the latest image:

```bash
docker compose -f docker-compose.prod.yml exec frontend cat /usr/share/nginx/html/index.html | head -5
```

Or check the image digest:

```bash
docker images abunurah1407/task-tracker-frontend:latest
```

## 🔄 Quick Deployment (One-Liner)

For quick updates, you can combine all steps:

```bash
cd /opt/task-tracker && \
docker pull abunurah1407/task-tracker-frontend:latest && \
docker compose -f docker-compose.prod.yml up -d --no-deps frontend && \
docker compose -f docker-compose.prod.yml logs frontend --tail 20
```

## 🐛 Troubleshooting

### Issue: Container fails to start

**Check logs:**
```bash
docker compose -f docker-compose.prod.yml logs frontend
```

**Common causes:**
- Port 80 already in use: Check if another service is using port 80
- Nginx configuration error: Verify `nginx.conf` is correct
- Missing files: Ensure build completed successfully

### Issue: Frontend shows old version

**Solutions:**
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Verify you pulled the latest image:
   ```bash
   docker pull abunurah1407/task-tracker-frontend:latest
   ```
3. Force recreate the container:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --force-recreate frontend
   ```

### Issue: API calls failing

**Check:**
1. Backend is running:
   ```bash
   docker compose -f docker-compose.prod.yml ps backend
   ```
2. Network connectivity:
   ```bash
   docker compose -f docker-compose.prod.yml exec frontend ping backend
   ```
3. Nginx proxy configuration in `nginx.conf`:
   ```bash
   docker compose -f docker-compose.prod.yml exec frontend cat /etc/nginx/conf.d/default.conf
   ```

### Issue: 502 Bad Gateway

This usually means the frontend can't reach the backend:

1. Check backend is running:
   ```bash
   docker compose -f docker-compose.prod.yml ps backend
   ```
2. Check backend logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs backend | tail -20
   ```
3. Verify network:
   ```bash
   docker network ls
   docker network inspect task-tracker_task-tracker-network
   ```

### Issue: 404 Not Found for routes

This is normal for SPAs. Verify nginx.conf has:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Set strong `JWT_SECRET` environment variable
- [ ] Set strong `DB_PASSWORD` environment variable
- [ ] Configure proper `CORS_ORIGIN` for your domain
- [ ] Set up SSL/TLS certificates (HTTPS)
- [ ] Review and update `nginx.conf` security headers
- [ ] Remove or secure Adminer if not needed
- [ ] Set up firewall rules
- [ ] Enable Docker security best practices

## 📊 Monitoring

### Check Container Health

```bash
docker compose -f docker-compose.prod.yml ps
```

### Monitor Logs in Real-Time

```bash
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Check Resource Usage

```bash
docker stats task-tracker-frontend
```

## 🔙 Rollback Procedure

If you need to rollback to a previous version:

### Option 1: Use a specific tag (if you have one)

```bash
# Update docker-compose.prod.yml to use a specific tag
# Then:
docker compose -f docker-compose.prod.yml pull frontend
docker compose -f docker-compose.prod.yml up -d --no-deps frontend
```

### Option 2: Rebuild from previous commit

```bash
# On your local machine, checkout previous commit
git checkout <previous-commit-hash>
# Rebuild and push
docker build -t abunurah1407/task-tracker-frontend:rollback .
docker push abunurah1407/task-tracker-frontend:rollback
# Then on production:
docker pull abunurah1407/task-tracker-frontend:rollback
# Update docker-compose.prod.yml to use :rollback tag
docker compose -f docker-compose.prod.yml up -d --no-deps frontend
```

## 📝 Notes

- The frontend image uses Nginx Alpine (lightweight)
- Frontend serves static files and proxies API requests to the backend
- The build process compiles TypeScript and bundles assets with Vite
- Static assets are cached for 1 year (configured in nginx.conf)
- Health check endpoint is available at `/health`

## 🔗 Related Documentation

- `DEPLOYMENT_STEPS.md` - Complete deployment guide (frontend + backend)
- `DOCKER_HUB_PUSH.md` - Docker Hub push instructions
- `docker-compose.prod.yml` - Production Docker Compose configuration
- `nginx.conf` - Nginx configuration for frontend

## ✅ Deployment Checklist

- [ ] Pulled latest frontend image
- [ ] Verified environment variables
- [ ] Restarted frontend container
- [ ] Checked container status
- [ ] Reviewed logs for errors
- [ ] Tested health endpoint
- [ ] Tested frontend in browser
- [ ] Verified API connectivity
- [ ] Tested key functionality
- [ ] Monitored for issues

---

**Last Updated:** February 2, 2025
**Image Tag:** `abunurah1407/task-tracker-frontend:latest`
**Image Digest:** `sha256:5137322943b22dae6982ef8736eb678d04d767994c7521cd735a590ddc72e1de`

