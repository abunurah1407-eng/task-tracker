# Quick Start Guide - PostgreSQL Setup

PostgreSQL has been installed successfully! ✅

## Step 1: Create the Database

Run the setup script to create the database:

```powershell
.\setup-database.ps1
```

When prompted, enter the password you set during PostgreSQL installation.

**Note:** If you don't remember the password, you can:
- Check if you saved it during installation
- Or reset it using pgAdmin (comes with PostgreSQL)

## Step 2: Configure Backend

1. Open `backend/.env` file
2. Update the `DB_PASSWORD` with your PostgreSQL password:
   ```env
   DB_PASSWORD=your_password_here
   ```

## Step 3: Set Up Backend

```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

## Step 4: Start Frontend

In a new terminal (root directory):
```bash
npm run dev
```

## Troubleshooting

### Can't remember PostgreSQL password?

1. Open **pgAdmin 4** (installed with PostgreSQL)
2. Connect to PostgreSQL server
3. Right-click on server → Properties → Change password

### Database already exists?

If you see "database already exists" error, that's fine! Just continue with the next steps.

### Connection refused?

Make sure PostgreSQL service is running:
```powershell
Get-Service postgresql-x64-17
```

If it's not running, start it:
```powershell
Start-Service postgresql-x64-17
```

## Default Login Credentials

Once everything is set up, you can login with:
- **Admin:** `admin@etec.com` / `password123`
- **Director:** `director@etec.com` / `password123`
- **Engineer:** `faisal@etec.com` / `password123`


