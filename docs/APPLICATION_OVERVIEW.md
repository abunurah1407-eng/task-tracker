# Task Tracker - Application Overview

Complete explanation of functionality, users, and database seeds.

## 🎯 Application Functionality

### Core Purpose
The Task Tracker is a comprehensive task management system designed for tracking security and IT tasks assigned to engineers, organized by weeks, months, and services.

### Main Features

#### 1. **Task Management**
- **Create Tasks**: Assign tasks to engineers with service type, week, month, year
- **Update Tasks**: Change status (Pending → In Progress → Completed), priority, notes
- **Delete Tasks**: Remove tasks (Admin only)
- **View Tasks**: See all tasks with filtering and search capabilities
- **Task Status**: Track progress with 3 states:
  - `pending` - Not started
  - `in-progress` - Currently working on
  - `completed` - Finished

#### 2. **Engineer Tracking**
- View all engineers in the system
- See task count per engineer
- Color-coded engineer cards for visual identification
- Click to filter tasks by engineer
- Expandable task lists per engineer

#### 3. **Service Management**
- **Primary Services**: Core services assigned to specific engineers
- **Secondary Services**: General services available to all
- Service count tracking (how many tasks per service)
- Filter tasks by service type

#### 4. **Weekly View**
- Organize tasks by week (1-4) within each month
- Visual calendar-like interface
- Quick overview of weekly workload
- Status indicators per task

#### 5. **Team Tasks Tracking**
- Track team-level tasks for 2025
- Categories: CAB, BRD/CR, Ticket, Request/Orders/MGT, Cyber Actions, Meetings, Cyber INFRA OPS / TICH
- Total count tracking

#### 6. **Notifications System**
- **Task Reminders**: Engineers get reminders about pending tasks
- **Task Completed Alerts**: Directors notified when engineers complete tasks
- **Task Assigned**: Engineers notified when new tasks are assigned
- Unread notification count badge
- Mark as read functionality

#### 7. **Reporting & Analytics**
- Interactive bar charts showing task distribution per engineer
- Export to CSV functionality (Admin/Director only)
- Real-time statistics dashboard

#### 8. **Search & Filtering**
- Search by service name or engineer name
- Filter by engineer
- Filter by service
- Clear all filters

---

## 👥 User Accounts

### User Roles

The system has **3 user roles** with different permissions:

#### 1. **Admin** (`admin@etec.com`)
**Password**: `password123`

**Capabilities**:
- ✅ **Full system access** - Can manage everything
- ✅ View all tasks (all engineers)
- ✅ Create tasks for any engineer
- ✅ Edit any task
- ✅ **Delete tasks** (only role that can delete)
- ✅ View all engineers and services
- ✅ Export data to CSV
- ✅ View all notifications
- ✅ Manage users (future feature)

**Use Case**: System administrator who needs complete control

---

#### 2. **Director** (`director@etec.com`)
**Password**: `password123`

**Capabilities**:
- ✅ **View and manage all tasks** - See everything
- ✅ Create tasks for any engineer
- ✅ Edit any task
- ✅ View all engineers and services
- ✅ Export data to CSV
- ✅ **Receive notifications** when engineers complete tasks
- ❌ Cannot delete tasks
- ❌ Cannot manage users

**Use Case**: Manager/director who needs oversight of all work but doesn't need delete permissions

---

#### 3. **Engineer** (`faisal@etec.com`, `abeer@etec.com`)
**Password**: `password123`

**Capabilities**:
- ✅ **Add tasks** - But only for themselves
- ✅ **Manage own tasks only** - Can edit/update their own tasks
- ✅ View only their own tasks (filtered automatically)
- ✅ **Receive task reminders** for pending tasks
- ✅ **Receive notifications** when assigned new tasks
- ❌ Cannot see other engineers' tasks
- ❌ Cannot create tasks for other engineers
- ❌ Cannot reassign tasks to others
- ❌ Cannot delete tasks
- ❌ Cannot export data

**Use Case**: Individual contributors who manage their own workload

---

## 📊 Database Seeds

### What Gets Seeded

When you run the database seed, the following data is automatically added:

#### 1. **Engineers** (13 engineers)

| Name | Color | Purpose |
|------|-------|---------|
| Faisal | Blue (#3b82f6) | Primary engineer |
| Abeer | Purple (#8b5cf6) | Primary engineer |
| M. Shahrani | Pink (#ec4899) | Engineer |
| Wed | Orange (#f59e0b) | Engineer |
| S. Dossari | Green (#10b981) | Engineer |
| Abdullah | Red (#ef4444) | Engineer |
| Milaf | Cyan (#06b6d4) | Engineer |
| M. Aqily | Lime (#84cc16) | Engineer |
| Ghaida | Orange (#f97316) | Engineer |
| Amani | Indigo (#6366f1) | Engineer |
| Menwer | Teal (#14b8a6) | Engineer |
| A. Driwesh | Purple (#a855f7) | Engineer |
| Aryam | Yellow (#eab308) | Engineer |

**Fields**:
- `name`: Engineer's name (unique)
- `color`: Hex color code for UI display
- `tasks_total`: Auto-calculated count (starts at 0)

---

#### 2. **Services** (37 services)

**Primary Services** (13) - Assigned to specific engineers:

| Service Name | Assigned To | Category |
|--------------|-------------|----------|
| FCR | Faisal | primary |
| VPN | Abeer | primary |
| SOC Alerts | M. Shahrani | primary |
| USB/CD | Wed | primary |
| URL Filtering | S. Dossari | primary |
| IoCs | Abdullah | primary |
| CTI Feeds | Milaf | primary |
| Threat Analysis | M. Aqily | primary |
| Vulnerabilities | Ghaida | primary |
| Sec Support | Amani | primary |
| Ticket | Menwer | primary |
| Technical Meeting | A. Driwesh | primary |
| Sec Investigations | Aryam | primary |

**Secondary Services** (24) - Available to all:

- Sec Policy Changes
- Sec Solution Administration
- Sec Troubleshooting
- Sec Implement
- Cyber Infra
- IT Infra Review
- Sec Control Modifications
- Architect Review
- Review Cyber Control
- Sec Comparison
- Health Check
- New HLD
- New LLD
- GAP Analysis
- RFP
- CAB
- Projects
- Reporting
- Compliance
- CR
- BRD
- Encrypted FLASH
- HASEEN
- OTHER

**Fields**:
- `name`: Service name (unique)
- `assigned_to`: Engineer name (for primary services)
- `category`: 'primary' or 'secondary'
- `count`: Auto-calculated task count (starts at 0)

---

#### 3. **Team Tasks** (7 categories for 2025)

| Category | Year |
|----------|------|
| CAB | 2025 |
| BRD/CR | 2025 |
| Ticket | 2025 |
| Request/Orders/MGT | 2025 |
| Cyber Actions | 2025 |
| Meetings | 2025 |
| Cyber INFRA OPS / TICH | 2025 |

**Fields**:
- `category`: Task category name
- `year`: Year (2025)
- `count`: Auto-calculated task count (starts at 0)

---

#### 4. **Users** (4 default users)

| Email | Name | Role | Engineer Link | Password |
|-------|------|------|---------------|----------|
| admin@etec.com | Admin User | admin | None | password123 |
| director@etec.com | Director User | director | None | password123 |
| faisal@etec.com | Faisal | engineer | Faisal | password123 |
| abeer@etec.com | Abeer | engineer | Abeer | password123 |

**Fields**:
- `email`: Login email (unique)
- `name`: Display name
- `password_hash`: Bcrypt hashed password
- `role`: 'admin', 'director', or 'engineer'
- `engineer_name`: Links engineer users to their engineer profile

**Security Note**: 
- Passwords are hashed using bcrypt (10 salt rounds)
- Plain password for all: `password123` (change in production!)

---

## 🔄 How It All Works Together

### Data Flow Example

1. **Engineer logs in** → `faisal@etec.com` / `password123`
2. **Creates a task**:
   - Service: "FCR"
   - Engineer: "Faisal" (auto-selected, can't change)
   - Week: 1
   - Month: January
   - Year: 2025
   - Status: Pending
   - Priority: High
3. **Task is saved** → Stored in `tasks` table
4. **Counts update automatically**:
   - Faisal's `tasks_total` increases
   - FCR service `count` increases
5. **Notifications sent**:
   - Engineer receives "Task Assigned" notification
   - Directors receive notification about new task
6. **Director logs in** → Sees the new task in dashboard
7. **Engineer completes task** → Status changes to "completed"
8. **Directors notified** → "Faisal has completed task: FCR"

### Automatic Calculations

- **Engineer Task Totals**: Automatically calculated from tasks table
- **Service Counts**: Automatically calculated from tasks table
- **Team Task Counts**: Automatically calculated from tasks table

### Relationships

```
Users (login accounts)
  └── engineer_name → Engineers (profiles)
        └── name ← Tasks.engineer
              └── service → Services.name
```

---

## 📈 What You Can Track

### Per Task:
- Which service it belongs to
- Which engineer is assigned
- Which week of the month (1-4)
- Which month and year
- Current status (pending/in-progress/completed)
- Priority level (low/medium/high)
- Additional notes

### Per Engineer:
- Total number of tasks
- List of all their tasks
- Task distribution visualization

### Per Service:
- How many tasks exist for that service
- Which engineer it's primarily assigned to (if primary)

### Per Week:
- All tasks scheduled for that week
- Status overview
- Quick access to task details

### Team Level:
- Total tasks across all categories for 2025
- Category-based tracking

---

## 🎨 Visual Features

- **Color-coded engineers**: Each engineer has a unique color
- **Status indicators**: Visual badges for task status
- **Interactive charts**: Bar chart showing task distribution
- **Responsive design**: Works on desktop, tablet, mobile
- **Modern UI**: Gradient backgrounds, smooth animations
- **Notification badges**: Red badge showing unread count

---

## 🔐 Security Features

- **Password Hashing**: All passwords hashed with bcrypt
- **JWT Tokens**: Secure authentication tokens
- **Role-Based Access**: Permissions enforced at API level
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Restricted API access

---

This system provides a complete solution for tracking security and IT tasks with proper user management, notifications, and reporting capabilities!

