# PowerShell script to push code to GitHub
# Usage: .\push-to-github.ps1 [repository-url]

param(
    [string]$RepositoryUrl = ""
)

Write-Host "=== GitHub Push Automation Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if git is available
Write-Host "Checking for Git..." -ForegroundColor Yellow
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if ($gitCheck) {
    $gitVersion = git --version 2>&1
    Write-Host "✓ Git found: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Check if .git directory exists
$gitExists = Test-Path .git
if (-not $gitExists) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Repository initialized" -ForegroundColor Green
} else {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
}

# Check current branch
$currentBranch = git branch --show-current 2>$null
if (-not $currentBranch) {
    $currentBranch = "main"
    Write-Host "Creating initial branch: $currentBranch" -ForegroundColor Yellow
    git checkout -b $currentBranch 2>$null
}

Write-Host ""
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

# Add all files
Write-Host ""
Write-Host "Staging all files..." -ForegroundColor Yellow
git add .
$stagedFiles = git diff --cached --name-only
if ($stagedFiles) {
    Write-Host "✓ Files staged:" -ForegroundColor Green
    $stagedFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
} else {
    Write-Host "ℹ No changes to commit" -ForegroundColor Yellow
}

# Check if there are changes to commit
$status = git status --porcelain
if (-not $status) {
    Write-Host ""
    Write-Host "ℹ Working directory is clean. Nothing to commit." -ForegroundColor Yellow
    
    # Check if remote exists
    $remoteExists = git remote | Select-String -Pattern "origin"
    if (-not $remoteExists) {
        Write-Host ""
        Write-Host "No remote repository configured." -ForegroundColor Yellow
        if ($RepositoryUrl) {
            Write-Host "Adding remote: $RepositoryUrl" -ForegroundColor Yellow
            git remote add origin $RepositoryUrl
            Write-Host "✓ Remote added" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "To add a remote repository, run:" -ForegroundColor Cyan
            Write-Host '  git remote add origin <your-repository-url>' -ForegroundColor White
            Write-Host ""
            Write-Host "Or run this script with the repository URL:" -ForegroundColor Cyan
            Write-Host "  .\push-to-github.ps1 -RepositoryUrl https://github.com/username/repo.git" -ForegroundColor White
        }
    } else {
        Write-Host ""
        Write-Host "Pushing to remote..." -ForegroundColor Yellow
        git push -u origin $currentBranch
        Write-Host "✓ Code pushed successfully!" -ForegroundColor Green
    }
    exit 0
}

# Commit changes
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
$commitMessage = "Update app with new color scheme (#4c3c8d) and UI improvements

- Updated all buttons and interactive elements to use main color #4c3c8d
- Removed all gradients, using light backgrounds throughout
- Enhanced landing page with modern design
- Updated all dashboard components with consistent color scheme
- Improved UI/UX across all pages"

git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Changes committed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to commit changes" -ForegroundColor Red
    exit 1
}

# Check if remote exists
Write-Host ""
$remoteExists = git remote | Select-String -Pattern "origin"
if (-not $remoteExists) {
    if ($RepositoryUrl) {
        Write-Host "Adding remote repository: $RepositoryUrl" -ForegroundColor Yellow
        git remote add origin $RepositoryUrl
        Write-Host "✓ Remote added" -ForegroundColor Green
    } else {
        Write-Host "No remote repository configured." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please provide your GitHub repository URL:" -ForegroundColor Cyan
        Write-Host "  .\push-to-github.ps1 -RepositoryUrl https://github.com/username/repo.git" -ForegroundColor White
        Write-Host ""
        Write-Host "Or add it manually:" -ForegroundColor Cyan
        Write-Host '  git remote add origin <your-repository-url>' -ForegroundColor White
        Write-Host ""
        Write-Host "Your changes have been committed locally." -ForegroundColor Green
        Write-Host "Run 'git push -u origin $currentBranch' after adding the remote." -ForegroundColor Yellow
        exit 0
    }
} else {
    $remoteUrl = git remote get-url origin
    Write-Host "Remote repository: $remoteUrl" -ForegroundColor Cyan
}

# Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "Branch: $currentBranch" -ForegroundColor Gray

git push -u origin $currentBranch 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Code pushed successfully to GitHub!" -ForegroundColor Green
    Write-Host ""
    $remoteUrl = git remote get-url origin 2>&1
    Write-Host "Repository URL: $remoteUrl" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Push failed. You may need to:" -ForegroundColor Red
    Write-Host "  1. Set up authentication (SSH key or Personal Access Token)" -ForegroundColor Yellow
    Write-Host "  2. Create the repository on GitHub first" -ForegroundColor Yellow
    Write-Host "  3. Check your remote URL: git remote get-url origin" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Script completed ===" -ForegroundColor Cyan

