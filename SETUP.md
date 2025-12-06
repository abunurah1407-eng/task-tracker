# Task Tracker - Backend Setup Guide

This guide will help you set up the PostgreSQL backend for the Task Tracker application.

## Prerequisites

1. **PostgreSQL** - Download and install from [postgresql.org](https://www.postgresql.org/download/)
2. **Node.js** (v18 or higher) - Already installed ✅

## Step 1: Install PostgreSQL

1. Download PostgreSQL for Windows
2. Install with default settings
3. Remember the password you set for the `postgres` user
4. PostgreSQL will run on port `5432` by default

## Step 2: Create Database

1. Open **pgAdmin** (comes with PostgreSQL) or use **psql** command line
2. Create a new database:
   ```sql
   CREATE DATABASE task_tracker;
   ```

Or using psql command line:
```bash
psql -U postgres
CREATE DATABASE task_tracker;
\q
```

## Step 3: Configure Backend

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update the `.env` file with your PostgreSQL password:
   ```env
   DB_PASSWORD=your_postgres_password_here
   ```

## Step 4: Run Migrations

Create the database tables:
```bash
npm run migrate
```

You should see: `✅ Database migrations completed successfully!`

## Step 5: Seed the Database

Add default data (engineers, services, users):
```bash
npm run seed
```

You should see: `✅ Database seeded successfully!`

## Step 6: Start the Backend Server

```bash
npm run dev
```

The API will be running at `http://localhost:3001`

## Step 7: Update Frontend (Optional)

The frontend is already configured to use the API. If you need to change the API URL, create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

## Testing the Setup

1. **Check API health:**
   - Open: `http://localhost:3001/health`
   - Should return: `{"status":"ok","message":"Task Tracker API is running"}`

2. **Test login:**
   - Use: `admin@etec.com` / `password123`
   - Or: `director@etec.com` / `password123`

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify password in `.env` file
- Check database name is `task_tracker`

### Port Already in Use
- Change `PORT` in `.env` file
- Or stop the process using port 3001

### Migration Errors
- Make sure database exists
- Check database credentials
- Try dropping and recreating the database

## Default Users

- **Admin:** `admin@etec.com` / `password123`
- **Director:** `director@etec.com` / `password123`
- **Engineer:** `faisal@etec.com` / `password123`
- **Engineer:** `abeer@etec.com` / `password123`

## Next Steps

Once the backend is running:
1. Start the frontend: `npm run dev` (in root directory)
2. Open `http://localhost:5173`
3. Login with one of the default users
4. Start using the Task Tracker!

## Production Deployment

For production:
1. Change `JWT_SECRET` to a strong random string
2. Use environment variables for all sensitive data
3. Set up proper CORS origins
4. Use a production database (not localhost)
5. Enable SSL for database connections

