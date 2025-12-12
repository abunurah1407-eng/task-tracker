# Task Tracker Backend API

Backend API for Task Tracker application built with Node.js, Express, TypeScript, and PostgreSQL.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Setup with Docker

The backend runs automatically as part of the Docker Compose setup. See the main [README.md](../README.md) and [DOCKER.md](../DOCKER.md) for complete setup instructions.

### Quick Start

1. **Start all services:**
   ```bash
   docker compose up -d
   ```

2. **Run database migrations:**
   ```bash
   docker compose exec backend npm run migrate
   ```

3. **Seed the database:**
   ```bash
   docker compose exec backend npm run seed
   ```

The API will be available at `http://localhost:3001`

### Running Commands in Backend Container

```bash
# Access backend container shell
docker compose exec backend sh

# Run migrations
docker compose exec backend npm run migrate

# Run seeds
docker compose exec backend npm run seed

# View logs
docker compose logs -f backend
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/login/ad` - AD login (simulated)

### Tasks
- `GET /api/tasks` - Get all tasks (role-based filtering)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (admin only)

### Engineers
- `GET /api/engineers` - Get all engineers

### Services
- `GET /api/services` - Get all services

### Notifications
- `GET /api/notifications` - Get all notifications for current user
- `GET /api/notifications/unread` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Team Tasks
- `GET /api/team-tasks` - Get all team tasks

## Default Users

- Admin: `admin@etec.com` / `password123`
- Director: `director@etec.com` / `password123`
- Engineer: `faisal@etec.com` / `password123`
- Engineer: `abeer@etec.com` / `password123`

## Environment Variables

See `.env.example` for all required environment variables.

