# Production Deployment Commands

## Frontend Deployment (Quick Commands)

```bash
# Pull latest image from Docker Hub
docker pull abunurah1407/task-tracker-frontend:latest

# Restart frontend container
docker compose -f docker-compose.prod.yml up -d --no-deps frontend

# Verify it's running
docker compose -f docker-compose.prod.yml ps frontend
```

## One-Liner

```bash
docker pull abunurah1407/task-tracker-frontend:latest && docker compose -f docker-compose.prod.yml up -d --no-deps frontend
```

## Check Logs (Optional)

```bash
docker compose -f docker-compose.prod.yml logs frontend --tail 20
```

