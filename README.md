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

- Node.js (v18 or higher) ✅
- PostgreSQL (v12 or higher) ✅
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**

2. **Set up PostgreSQL Database**
   ```powershell
   # Run the database setup script
   .\setup-database.ps1
   ```
   Enter your PostgreSQL password when prompted.

3. **Configure Backend**
   ```bash
   cd backend
   npm install
   ```
   
   Edit `backend/.env` and set your PostgreSQL password:
   ```env
   DB_PASSWORD=your_postgres_password
   ```

4. **Run Database Migrations**
   ```bash
   npm run migrate
   ```

5. **Seed the Database**
   ```bash
   npm run seed
   ```

6. **Start Backend Server**
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:3001`

7. **Set up Frontend** (in root directory)
   ```bash
   npm install
   ```

8. **Start Frontend**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_tracker
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables (Optional)

Create `.env` in root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

## 📖 Usage Guide

### Login

1. Open `http://localhost:5173`
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

### Backend Issues

**Database Connection Error**
```
Error: password authentication failed
```
- Solution: Check `DB_PASSWORD` in `backend/.env`
- Verify PostgreSQL service is running: `Get-Service postgresql-x64-17`

**Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::3001
```
- Solution: Change `PORT` in `backend/.env` or stop the process using port 3001

**Migration Errors**
```
Error: relation already exists
```
- Solution: Database tables already exist, this is normal. Continue with seeding.

### Frontend Issues

**API Connection Error**
```
Failed to fetch
```
- Solution: 
  - Verify backend is running on `http://localhost:3001`
  - Check `VITE_API_URL` in `.env`
  - Check CORS settings in backend

**Login Not Working**
- Solution:
  - Verify backend is running
  - Check database is seeded (users exist)
  - Check browser console for errors

**Notifications Not Showing**
- Solution:
  - Check user is logged in
  - Verify notifications exist in database
  - Check browser console for API errors

### Database Issues

**PostgreSQL Service Not Running**
```powershell
Start-Service postgresql-x64-17
```

**Reset Database**
```sql
DROP DATABASE task_tracker;
CREATE DATABASE task_tracker;
```
Then run migrations and seed again.

## 💻 Development

### Running in Development Mode

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
npm run dev
```

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
npm run build
```

### Database Migrations

Create new migration:
```bash
cd backend
# Edit src/db/schema.sql
npm run migrate
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
