# Task Tracker Backend API

Backend API for Task Tracker application built with Node.js, Express, TypeScript, and PostgreSQL.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up PostgreSQL database:**
   - Create a new database:
   ```sql
   CREATE DATABASE task_tracker;
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`

4. **Run migrations:**
```bash
npm run migrate
```

5. **Seed the database (optional):**
```bash
npm run seed
```

6. **Start the development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

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

