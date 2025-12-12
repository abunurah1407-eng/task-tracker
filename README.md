# Task Tracker - Enhanced Dashboard

A modern, full-stack task tracking and management system built with React, TypeScript, Node.js, Express, and PostgreSQL.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [User Roles & Permissions](#user-roles--permissions)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

## ✨ Features

### Core Features
- **Task Management**: Create, update, delete, and track tasks
- **Engineer Tracking**: Monitor tasks assigned to each engineer
- **Service Management**: Track primary and secondary services
- **Weekly View**: Organize tasks by week and month
- **Team Tasks**: Track team-level tasks for 2025
- **Interactive Charts**: Visual representation of task distribution

### Enhanced Features
- **User Authentication**: Email/password and AD login support
- **Role-Based Access Control**: Admin, Director, and Engineer roles
- **Real-time Notifications**: Task reminders, completion alerts, and assignments
- **Advanced Filtering**: Filter by engineer, service, or search query
- **Export Functionality**: Export tasks to CSV
- **Responsive Design**: Works on desktop, tablet, and mobile
- **PostgreSQL Database**: Persistent data storage with proper relationships

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Recharts** - Chart library
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📁 Project Structure

```
Task Tracker/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── db/             # Database migrations and seeds
│   │   ├── middleware/      # Authentication middleware
│   │   ├── routes/         # API routes
│   │   └── index.ts        # Server entry point
│   ├── .env                # Environment variables
│   └── package.json
├── src/                     # Frontend application
│   ├── components/         # React components
│   ├── context/            # React context (Auth)
│   ├── services/           # API service layer
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── public/                 # Static assets
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

### Quick Start with Docker

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
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:3001
   - **Database Admin**: http://localhost:8080

For detailed Docker instructions, see [DOCKER.md](./DOCKER.md) or [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md)

## 📖 Usage Guide

### Login

1. Open `http://localhost`
2. Choose login method:
   - **Email Login**: Use email and password
   - **AD Login**: Use username (simulated)

### Default Users

- **Admin**: `admin@etec.com` / `password123`
- **Director**: `director@etec.com` / `password123`
- **Engineer**: `faisal@etec.com` / `password123`
- **Engineer**: `abeer@etec.com` / `password123`

### Creating Tasks

1. Click **"Add Task"** button
2. Fill in task details:
   - Service
   - Engineer
   - Week (1-4)
   - Month and Year
   - Status (Pending, In Progress, Completed)
   - Priority (Low, Medium, High)
   - Notes (optional)
3. Click **"Create Task"**

### Filtering Tasks

- Use the **search bar** to search by service or engineer
- Use **dropdown filters** to filter by specific engineer or service
- Click **"Clear Filters"** to reset

### Viewing Notifications

- Click the **bell icon** in the header
- View all notifications
- Mark individual notifications as read
- Mark all as read

### Exporting Data

- Click **"Export CSV"** button (Admin/Director only)
- Downloads all tasks as a CSV file

## 📡 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication

**POST** `/auth/login`
- Login with email and password
- Body: `{ email: string, password: string }`
- Returns: `{ token: string, user: object }`

**POST** `/auth/login/ad`
- AD login (simulated)
- Body: `{ username: string }`
- Returns: `{ token: string, user: object }`

#### Tasks

**GET** `/tasks`
- Get all tasks (role-based filtering)
- Engineers see only their tasks
- Returns: `Task[]`

**GET** `/tasks/:id`
- Get single task
- Returns: `Task`

**POST** `/tasks`
- Create new task
- Body: `{ service, engineer, week, month, year, status, priority, notes? }`
- Returns: `Task`

**PUT** `/tasks/:id`
- Update task
- Body: `{ service, engineer, week, month, year, status, priority, notes? }`
- Returns: `Task`

**DELETE** `/tasks/:id`
- Delete task (Admin only)
- Returns: `{ message: string }`

#### Engineers

**GET** `/engineers`
- Get all engineers
- Returns: `Engineer[]`

#### Services

**GET** `/services`
- Get all services
- Returns: `Service[]`

#### Notifications

**GET** `/notifications`
- Get all notifications for current user
- Returns: `Notification[]`

**GET** `/notifications/unread`
- Get unread notification count
- Returns: `{ count: number }`

**PATCH** `/notifications/:id/read`
- Mark notification as read
- Returns: `Notification`

**PATCH** `/notifications/read-all`
- Mark all notifications as read
- Returns: `{ message: string }`

#### Team Tasks

**GET** `/team-tasks`
- Get all team tasks
- Returns: `TeamTask[]`

## 👥 User Roles & Permissions

### Admin
- ✅ Full access to all features
- ✅ Can manage everything
- ✅ Can delete tasks
- ✅ Can view all tasks
- ✅ Can export data

### Director
- ✅ Can view and manage all tasks
- ✅ Can create tasks for any engineer
- ✅ Can view all engineers and services
- ✅ Receives notifications when engineers complete tasks
- ✅ Can export data
- ❌ Cannot delete tasks

### Engineer
- ✅ Can add tasks (only for themselves)
- ✅ Can manage only their own tasks
- ✅ Can view only their own tasks
- ✅ Receives task reminders
- ✅ Receives notifications for new assignments
- ❌ Cannot view other engineers' tasks
- ❌ Cannot delete tasks
- ❌ Cannot export data

## 🔧 Troubleshooting

### Docker Issues

**Containers Won't Start**
- Check Docker is running: `docker ps`
- Check logs: `docker compose logs`
- Verify ports are not in use

**Database Connection Error**
- Verify PostgreSQL container is healthy: `docker compose ps`
- Check database logs: `docker compose logs postgres`
- Restart containers: `docker compose restart`

**Port Conflicts**
- Modify ports in `docker-compose.yml` if needed
- Stop conflicting services

**Rebuild Everything**
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
docker compose exec backend npm run migrate
docker compose exec backend npm run seed
```

## 💻 Development

### Running in Development Mode with Docker

```bash
docker compose -f docker-compose.dev.yml up -d
```

### Database Migrations

```bash
docker compose exec backend npm run migrate
docker compose exec backend npm run seed
```

### Adding New Features

1. **Backend**: Add routes in `backend/src/routes/`
2. **Frontend**: Add components in `src/components/`
3. **API Service**: Update `src/services/api.ts`
4. **Types**: Update `src/types.ts`

## 📝 Database Schema

### Tables

- **users**: User accounts and authentication
- **engineers**: Engineer profiles
- **services**: Service definitions
- **tasks**: Task records
- **team_tasks**: Team-level task tracking
- **notifications**: User notifications

See `backend/src/db/schema.sql` for full schema.

## 🔐 Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- Role-based access control enforced
- SQL injection protection via parameterized queries
- CORS configured for specific origins

## 📄 License

MIT

## 🤝 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the API documentation
3. Check browser console and server logs

---

**Built with ❤️ for efficient task tracking and management**
