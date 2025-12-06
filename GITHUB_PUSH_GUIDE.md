# GitHub Push Guide

This guide explains how to push your Task Tracker code to GitHub using the automated scripts.

## Prerequisites

1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/win
   - Or use: `winget install Git.Git` (Windows Package Manager)

2. **Create a GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository (don't initialize with README, .gitignore, or license)
   - Copy the repository URL (e.g., `https://github.com/yourusername/task-tracker.git`)

## Usage

### Option 1: PowerShell Script (Recommended)

1. Open PowerShell in the project directory
2. Run the script with your repository URL:
   ```powershell
   .\push-to-github.ps1 -RepositoryUrl https://github.com/yourusername/task-tracker.git
   ```

   Or run without URL (you'll be prompted to add it manually):
   ```powershell
   .\push-to-github.ps1
   ```

### Option 2: Batch File

1. Open Command Prompt in the project directory
2. Run the batch file with your repository URL:
   ```cmd
   push-to-github.bat https://github.com/yourusername/task-tracker.git
   ```

   Or run without URL:
   ```cmd
   push-to-github.bat
   ```

### Option 3: Manual Git Commands

If you prefer to do it manually:

```bash
# Initialize repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Update app with new color scheme (#4c3c8d) and UI improvements"

# Add remote repository
git remote add origin https://github.com/yourusername/task-tracker.git

# Push to GitHub
git push -u origin main
```

## Authentication

If you encounter authentication issues:

### Option 1: Personal Access Token (Recommended)
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `repo` permissions
3. Use the token as your password when pushing

### Option 2: SSH Key
1. Generate SSH key: `ssh-keygen -t ed25519 -C "your_email@example.com"`
2. Add to GitHub: Settings → SSH and GPG keys → New SSH key
3. Use SSH URL: `git@github.com:username/repo.git`

### Option 3: GitHub CLI
```bash
# Install GitHub CLI
winget install GitHub.cli

# Authenticate
gh auth login

# Then push normally
git push
```

## Troubleshooting

### "Git is not recognized"
- Install Git from https://git-scm.com/download/win
- Restart your terminal after installation
- Verify: `git --version`

### "Repository not found" or "Permission denied"
- Verify the repository URL is correct
- Check your authentication credentials
- Ensure the repository exists on GitHub

### "Nothing to commit"
- Your changes are already committed
- Check: `git status`
- If you have uncommitted changes, they will be staged and committed

### "Remote already exists"
- Remove existing remote: `git remote remove origin`
- Add new remote: `git remote add origin <new-url>`

## What Gets Pushed

The script will push all files except those in `.gitignore`:
- Source code (`src/`)
- Configuration files
- Documentation
- Docker files

Excluded (via .gitignore):
- `node_modules/`
- `dist/`
- Log files
- Editor files

## Next Steps

After pushing:
1. Visit your repository on GitHub
2. Add a README.md if needed
3. Set up GitHub Actions for CI/CD (optional)
4. Configure branch protection rules (optional)

## Need Help?

- Git Documentation: https://git-scm.com/doc
- GitHub Help: https://docs.github.com
- Git Cheat Sheet: https://education.github.com/git-cheat-sheet-education.pdf


