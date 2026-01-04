# PowerShell script to test production build locally
# Run with: .\test-production.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Production Build Locally" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop any running containers
Write-Host "Step 1: Stopping existing containers..." -ForegroundColor Yellow
docker compose down
Write-Host ""

# Step 2: Ask about database volume
Write-Host "Do you want to start with a fresh database? (y/n)" -ForegroundColor Yellow
$freshDb = Read-Host
if ($freshDb -eq "y" -or $freshDb -eq "Y") {
    Write-Host "Removing old database volume..." -ForegroundColor Yellow
    docker volume rm task-tracker_postgres_data -ErrorAction SilentlyContinue
    Write-Host ""
}

# Step 3: Build images
Write-Host "Step 2: Building production images..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
docker compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Check the errors above." -ForegroundColor Red
    exit 1
}
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Start containers
Write-Host "Step 3: Starting containers..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start containers!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Wait for services to be ready
Write-Host "Step 4: Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 6: Check status
Write-Host "Step 5: Checking container status..." -ForegroundColor Yellow
docker compose ps
Write-Host ""

# Step 7: Show logs
Write-Host "Step 6: Showing recent logs..." -ForegroundColor Yellow
Write-Host "--- Backend Logs ---" -ForegroundColor Cyan
docker compose logs --tail=20 backend
Write-Host ""
Write-Host "--- Frontend Logs ---" -ForegroundColor Cyan
docker compose logs --tail=20 frontend
Write-Host ""
Write-Host "--- Postgres Logs ---" -ForegroundColor Cyan
docker compose logs --tail=20 postgres
Write-Host ""

# Step 8: Test endpoints
Write-Host "Step 7: Testing endpoints..." -ForegroundColor Yellow
Write-Host "Testing backend health endpoint..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend is healthy!" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Backend health check failed. It may still be starting..." -ForegroundColor Yellow
}
Write-Host ""

# Step 9: Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Green
Write-Host "  Frontend: http://localhost" -ForegroundColor White
Write-Host "  Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "  Health Check: http://localhost:3001/health" -ForegroundColor White
Write-Host "  Database Admin: http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "Test Login Credentials:" -ForegroundColor Green
Write-Host "  Admin: admin@etec.gov.sa / password123" -ForegroundColor White
Write-Host "  Director: N.Saleem@etec.gov.sa / password123" -ForegroundColor White
Write-Host "  Engineer: F.Ammaj@etec.gov.sa / password123" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  docker compose logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop containers:" -ForegroundColor Yellow
Write-Host "  docker compose down" -ForegroundColor Gray
Write-Host ""


