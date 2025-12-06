# API Reference

Complete API documentation for Task Tracker backend.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### POST /auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "admin@etec.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@etec.com",
    "name": "Admin User",
    "role": "admin",
    "engineerName": null
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing email or password
- `401` - Invalid credentials

---

### POST /auth/login/ad

AD login (simulated - replace with real AD integration in production).

**Request Body:**
```json
{
  "username": "admin"
}
```

**Response:**
Same as `/auth/login`

**Status Codes:**
- `200` - Success
- `400` - Missing username
- `401` - User not found

---

## Task Endpoints

### GET /tasks

Get all tasks. Returns different results based on user role:
- **Admin/Director**: All tasks
- **Engineer**: Only their own tasks

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "service": "FCR",
    "engineer": "Faisal",
    "week": 1,
    "month": "January",
    "year": 2025,
    "status": "pending",
    "priority": "high",
    "notes": "Important task",
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
]
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

### GET /tasks/:id

Get a single task by ID.

**Parameters:**
- `id` (path) - Task ID

**Response:**
```json
{
  "id": 1,
  "service": "FCR",
  "engineer": "Faisal",
  "week": 1,
  "month": "January",
  "year": 2025,
  "status": "pending",
  "priority": "high",
  "notes": "Important task",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-15T10:00:00.000Z"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (engineer trying to access another engineer's task)
- `404` - Task not found

---

### POST /tasks

Create a new task.

**Request Body:**
```json
{
  "service": "FCR",
  "engineer": "Faisal",
  "week": 1,
  "month": "January",
  "year": 2025,
  "status": "pending",
  "priority": "high",
  "notes": "Important task"
}
```

**Validation:**
- All fields except `notes` are required
- `week` must be 1-4
- `status` must be: `pending`, `in-progress`, or `completed`
- `priority` must be: `low`, `medium`, or `high`
- Engineers can only create tasks for themselves

**Response:**
```json
{
  "id": 1,
  "service": "FCR",
  "engineer": "Faisal",
  "week": 1,
  "month": "January",
  "year": 2025,
  "status": "pending",
  "priority": "high",
  "notes": "Important task",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-15T10:00:00.000Z"
}
```

**Status Codes:**
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (engineer trying to create task for another engineer)

---

### PUT /tasks/:id

Update an existing task.

**Parameters:**
- `id` (path) - Task ID

**Request Body:**
```json
{
  "service": "FCR",
  "engineer": "Faisal",
  "week": 2,
  "month": "January",
  "year": 2025,
  "status": "in-progress",
  "priority": "high",
  "notes": "Updated notes"
}
```

**Validation:**
- Same as POST /tasks
- Engineers can only update their own tasks
- Engineers cannot reassign tasks to other engineers

**Response:**
Updated task object

**Status Codes:**
- `200` - Success
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Task not found

---

### DELETE /tasks/:id

Delete a task (Admin only).

**Parameters:**
- `id` (path) - Task ID

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Task not found

---

## Engineer Endpoints

### GET /engineers

Get all engineers.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Faisal",
    "color": "#3b82f6",
    "tasks_total": 5,
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
]
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

## Service Endpoints

### GET /services

Get all services.

**Response:**
```json
[
  {
    "id": 1,
    "name": "FCR",
    "assigned_to": "Faisal",
    "category": "primary",
    "count": 5,
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
]
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

## Notification Endpoints

### GET /notifications

Get all notifications for the current user.

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "type": "task_reminder",
    "title": "Task Reminder",
    "message": "You have 3 pending tasks to complete.",
    "read": false,
    "task_id": null,
    "created_at": "2025-01-15T10:00:00.000Z"
  }
]
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

### GET /notifications/unread

Get unread notification count.

**Response:**
```json
{
  "count": 3
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

### PATCH /notifications/:id/read

Mark a notification as read.

**Parameters:**
- `id` (path) - Notification ID

**Response:**
Updated notification object

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Notification not found

---

### PATCH /notifications/read-all

Mark all notifications as read for the current user.

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

## Team Task Endpoints

### GET /team-tasks

Get all team tasks.

**Response:**
```json
[
  {
    "id": 1,
    "category": "CAB",
    "count": 10,
    "year": 2025,
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
]
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized

---

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message description"
}
```

### Common Error Codes

- `400` - Bad Request (validation errors, missing fields)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (server error)

---

## Rate Limiting

Currently, there is no rate limiting implemented. For production, consider adding rate limiting middleware.

---

## Pagination

Currently, all list endpoints return all results. For production with large datasets, consider implementing pagination:

```
GET /tasks?page=1&limit=20
```

---

## Filtering & Sorting

Currently, filtering and sorting are handled on the frontend. For production, consider adding query parameters:

```
GET /tasks?engineer=Faisal&status=pending&sort=created_at&order=desc
```

