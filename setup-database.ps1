# PostgreSQL Database Setup Script
# Run this script to create the database for Task Tracker

Write-Host "=== Task Tracker Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Get PostgreSQL password
$password = Read-Host "Enter PostgreSQL 'postgres' user password (set during installation)" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# Set environment variable for password
$env:PGPASSWORD = $passwordPlain

Write-Host ""
Write-Host "Creating database 'task_tracker'..." -ForegroundColor Yellow

# Create database
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE task_tracker;" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database 'task_tracker' created successfully!" -ForegroundColor Green
} else {
    # Check if database already exists
    $checkDb = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -lqt 2>&1 | Select-String "task_tracker"
    if ($checkDb) {
        Write-Host "⚠️  Database 'task_tracker' already exists. Skipping creation." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to create database. Please check your password." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Update backend/.env file with your PostgreSQL password:" -ForegroundColor White
Write-Host "   DB_PASSWORD=$passwordPlain" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Navigate to backend folder and run:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host "   npm run migrate" -ForegroundColor Gray
Write-Host "   npm run seed" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""

# Clear password from environment
Remove-Item Env:\PGPASSWORD


