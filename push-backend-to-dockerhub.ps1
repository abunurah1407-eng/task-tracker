# PowerShell script to push backend image to Docker Hub

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Push Backend Image to Docker Hub" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get Docker Hub username
$dockerHubUsername = Read-Host "Enter your Docker Hub username"

if ([string]::IsNullOrWhiteSpace($dockerHubUsername)) {
    Write-Host "Docker Hub username is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Checking Docker..." -ForegroundColor Yellow

# Check if Docker is running
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker is running" -ForegroundColor Green
} else {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Try to login if not already logged in
Write-Host ""
Write-Host "Step 2: Logging in to Docker Hub..." -ForegroundColor Yellow
docker login

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker Hub login failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Logged in to Docker Hub" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Tagging backend image..." -ForegroundColor Yellow

# Tag the image
docker tag task-tracker-backend:latest "${dockerHubUsername}/task-tracker-backend:latest"
$tag1 = $LASTEXITCODE

docker tag task-tracker-backend:latest "${dockerHubUsername}/task-tracker-backend:v1.0.0"
$tag2 = $LASTEXITCODE

if (($tag1 -eq 0) -and ($tag2 -eq 0)) {
    Write-Host "✓ Image tagged successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to tag image" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Pushing images to Docker Hub..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

# Push latest
Write-Host ""
Write-Host "Pushing latest tag..." -ForegroundColor Cyan
docker push "${dockerHubUsername}/task-tracker-backend:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to push latest tag" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Latest tag pushed successfully" -ForegroundColor Green

# Push version tag
Write-Host ""
Write-Host "Pushing v1.0.0 tag..." -ForegroundColor Cyan
docker push "${dockerHubUsername}/task-tracker-backend:v1.0.0"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to push v1.0.0 tag" -ForegroundColor Red
    exit 1
}

Write-Host "✓ v1.0.0 tag pushed successfully" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✓ Successfully pushed backend image!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Image URLs:"
Write-Host "  - ${dockerHubUsername}/task-tracker-backend:latest"
Write-Host "  - ${dockerHubUsername}/task-tracker-backend:v1.0.0"
Write-Host ""
Write-Host "You can now use this image in your deployment!" -ForegroundColor Yellow
Write-Host ""
