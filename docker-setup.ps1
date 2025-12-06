# Docker Setup Script for Task Tracker (PowerShell)

Write-Host "🐳 Setting up Task Tracker with Docker..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker and Docker Compose are installed" -ForegroundColor Green
Write-Host ""

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run database migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Yellow
docker-compose exec backend npm run migrate

# Seed the database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
docker-compose exec backend npm run seed

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access the application at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost" -ForegroundColor White
Write-Host "   Backend API: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Default login credentials:" -ForegroundColor Cyan
Write-Host "   Admin: admin@etec.com / password123" -ForegroundColor White
Write-Host "   Director: director@etec.com / password123" -ForegroundColor White
Write-Host "   Engineer: faisal@etec.com / password123" -ForegroundColor White

