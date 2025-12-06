# Architecture Documentation

## System Overview

The Task Tracker application follows a **client-server architecture** with a React frontend and Node.js/Express backend, connected to a PostgreSQL database.

## Architecture Diagram

```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
│  Port: 5173     │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│  Express API    │
│  (Backend)      │
│  Port: 3001     │
└────────┬────────┘
         │ SQL
         │
┌────────▼────────┐
│  PostgreSQL     │
│  (Database)     │
│  Port: 5432     │
└─────────────────┘
```

## Frontend Architecture

### Component Structure

```
App
├── AuthProvider (Context)
│   └── AppContent
│       ├── LandingPage (if not authenticated)
│       └── Dashboard (if authenticated)
│           ├── EngineerCard
│           ├── ServicesList
│           ├── WeeklyView
│           ├── TaskChart
│           ├── TeamTasksSection
│           ├── TaskModal
│           ├── SearchBar
│           └── NotificationPanel
```

### State Management

- **React Context**: Authentication state
- **Local State**: Component-specific state (useState)
- **API Service**: Centralized API calls

### Data Flow

1. User action → Component
2. Component → API Service
3. API Service → Backend API
4. Backend API → Database
5. Response flows back through the chain

## Backend Architecture

### Layer Structure

```
Routes (API Endpoints)
    ↓
Middleware (Auth, Validation)
    ↓
Database Layer (PostgreSQL)
```

### Route Organization

- `/api/auth` - Authentication
- `/api/tasks` - Task CRUD operations
- `/api/engineers` - Engineer data
- `/api/services` - Service data
- `/api/notifications` - Notifications
- `/api/team-tasks` - Team tasks

### Authentication Flow

1. User submits credentials
2. Backend validates against database
3. JWT token generated
4. Token stored in localStorage (frontend)
5. Token sent with each API request
6. Middleware validates token

## Database Architecture

### Entity Relationship

```
users
  ├── id (PK)
  └── engineer_name → engineers.name

engineers
  ├── id (PK)
  └── name (UNIQUE)

services
  ├── id (PK)
  └── assigned_to → engineers.name

tasks
  ├── id (PK)
  ├── engineer → engineers.name (FK)
  └── service → services.name

notifications
  ├── id (PK)
  ├── user_id → users.id (FK)
  └── task_id → tasks.id (FK)

team_tasks
  └── id (PK)
```

### Indexes

- `idx_tasks_engineer` - Fast engineer lookups
- `idx_tasks_status` - Fast status filtering
- `idx_notifications_user_id` - Fast user notifications
- `idx_users_email` - Fast email lookups

## Security Architecture

### Authentication

- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcrypt with salt rounds
- **Token Expiration**: 7 days

### Authorization

- **Role-Based Access Control (RBAC)**
- **Middleware**: `authenticate` and `requireRole`
- **Frontend Guards**: Permission checks in components

### Data Protection

- **SQL Injection**: Parameterized queries
- **XSS**: React's built-in escaping
- **CORS**: Configured origins only

## API Design

### RESTful Principles

- **GET**: Retrieve resources
- **POST**: Create resources
- **PUT**: Update resources
- **DELETE**: Remove resources
- **PATCH**: Partial updates

### Response Format

```json
{
  "data": {...},
  "error": "Error message" // if error
}
```

### Error Handling

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

## Performance Considerations

### Frontend

- **Code Splitting**: Vite automatic code splitting
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components

### Backend

- **Connection Pooling**: PostgreSQL connection pool
- **Indexes**: Database indexes for fast queries
- **Query Optimization**: Efficient SQL queries

### Database

- **Indexes**: On frequently queried columns
- **Foreign Keys**: Data integrity
- **Constraints**: Data validation at DB level

## Scalability

### Current Limitations

- Single server instance
- Single database instance
- No caching layer
- No load balancing

### Future Improvements

- **Horizontal Scaling**: Multiple API instances
- **Database Replication**: Read replicas
- **Caching**: Redis for frequently accessed data
- **CDN**: Static asset delivery
- **Microservices**: Split into smaller services

## Deployment Architecture

### Development

```
Local Machine
├── Frontend (Vite Dev Server)
├── Backend (Node.js)
└── PostgreSQL (Local)
```

### Production (Recommended)

```
Load Balancer
├── Frontend (Static Files - CDN)
├── API Server 1
├── API Server 2
└── Database
    ├── Primary (Write)
    └── Replica (Read)
```

## Technology Choices

### Why React?

- Component-based architecture
- Large ecosystem
- Strong TypeScript support
- Fast development

### Why Express?

- Minimal and flexible
- Large middleware ecosystem
- Easy to learn
- Good TypeScript support

### Why PostgreSQL?

- ACID compliance
- Strong data integrity
- Excellent performance
- Rich feature set
- Open source

### Why JWT?

- Stateless authentication
- Scalable
- Works across domains
- Industry standard

## Development Workflow

1. **Feature Development**
   - Create database migration (if needed)
   - Add backend route
   - Add frontend component
   - Update API service
   - Test end-to-end

2. **Testing**
   - Manual testing
   - API testing (Postman/Thunder Client)
   - Browser testing

3. **Deployment**
   - Build frontend
   - Build backend
   - Run migrations
   - Start services

