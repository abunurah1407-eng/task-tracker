# Docker Hub Push Guide

This guide explains how to build and push the Task Tracker application to Docker Hub.

## Prerequisites

1. Docker installed and running
2. Docker Hub account
3. Docker Hub repository created (e.g., `yourusername/task-tracker`)

## Step 1: Login to Docker Hub

```bash
docker login
```

Enter your Docker Hub username and password when prompted.

## Step 2: Build Production Images

### Build Backend Image

```bash
cd backend
docker build -t yourusername/task-tracker-backend:latest .
docker build -t yourusername/task-tracker-backend:v1.0.0 .
```

### Build Frontend Image

```bash
cd ..
docker build -t yourusername/task-tracker-frontend:latest .
docker build -t yourusername/task-tracker-frontend:v1.0.0 .
```

## Step 3: Push Images to Docker Hub

```bash
# Push backend
docker push yourusername/task-tracker-backend:latest
docker push yourusername/task-tracker-backend:v1.0.0

# Push frontend
docker push yourusername/task-tracker-frontend:latest
docker push yourusername/task-tracker-frontend:v1.0.0
```

## Step 4: Update docker-compose.yml for Production

Update the `docker-compose.yml` file to use the Docker Hub images:

```yaml
services:
  backend:
    image: yourusername/task-tracker-backend:latest
    # Remove build section
    
  frontend:
    image: yourusername/task-tracker-frontend:latest
    # Remove build section
```

## Step 5: Deploy

On your production server:

1. Copy `docker-compose.yml` and `.env` file
2. Run:
```bash
docker-compose pull
docker-compose up -d
```

## Environment Variables

Make sure to set these environment variables in production:

- `JWT_SECRET`: Change to a secure random string
- `DB_PASSWORD`: Change to a strong password
- `CORS_ORIGIN`: Set to your production domain

## Default Credentials

**Admin:**
- Email: `admin@etec.gov.sa`
- Password: `password123`

**Director:**
- Email: `N.Saleem@etec.gov.sa`
- Name: Nasser M. Al-Saleem
- Password: `password123`

**Engineers** (all use password `password123`):
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

