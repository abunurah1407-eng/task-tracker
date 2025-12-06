@echo off
REM Batch script to push code to GitHub
REM Usage: push-to-github.bat [repository-url]

setlocal

echo === GitHub Push Automation Script ===
echo.

REM Check if git is available
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/download/win
    pause
    exit /b 1
)

echo Git found
echo.

REM Check if .git directory exists
if not exist .git (
    echo Initializing Git repository...
    git init
    echo Repository initialized
) else (
    echo Git repository already initialized
)

REM Get current branch
for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%i
if "%CURRENT_BRANCH%"=="" (
    set CURRENT_BRANCH=main
    git checkout -b main 2>nul
)

echo Current branch: %CURRENT_BRANCH%
echo.

REM Add all files
echo Staging all files...
git add .
echo Files staged
echo.

REM Commit changes
echo Committing changes...
git commit -m "Update app with new color scheme (#4c3c8d) and UI improvements"
if %ERRORLEVEL% NEQ 0 (
    echo No changes to commit or commit failed
) else (
    echo Changes committed successfully
)

echo.

REM Check if remote exists
git remote | findstr /C:"origin" >nul
if %ERRORLEVEL% NEQ 0 (
    if "%~1"=="" (
        echo No remote repository configured.
        echo.
        echo Please provide your GitHub repository URL:
        echo   push-to-github.bat https://github.com/username/repo.git
        echo.
        echo Or add it manually:
        echo   git remote add origin ^<your-repository-url^>
        pause
        exit /b 0
    ) else (
        echo Adding remote repository: %~1
        git remote add origin %~1
        echo Remote added
    )
) else (
    for /f "tokens=*" %%i in ('git remote get-url origin') do set REMOTE_URL=%%i
    echo Remote repository: %REMOTE_URL%
)

echo.
echo Pushing to GitHub...
git push -u origin %CURRENT_BRANCH%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Code pushed successfully to GitHub!
) else (
    echo.
    echo Push failed. You may need to:
    echo   1. Set up authentication (SSH key or Personal Access Token)
    echo   2. Create the repository on GitHub first
    echo   3. Check your remote URL: git remote get-url origin
)

echo.
echo === Script completed ===
pause


