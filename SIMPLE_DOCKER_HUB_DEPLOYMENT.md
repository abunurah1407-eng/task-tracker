# Simple Docker Hub Deployment

**Everything uses Docker Hub only!** The script is just downloaded from GitHub once, but all images come from Docker Hub.

## Super Simple Steps

### Step 1: Install Docker (if not installed)

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
```

### Step 2: Run One Command

```bash
curl -fsSL https://raw.githubusercontent.com/abunurah1407-eng/task-tracker/main/deploy-linux-server.sh | bash
```

**That's it!** The script will:
- ✅ Create everything needed
- ✅ Pull all images from **Docker Hub only**
- ✅ Set up the database
- ✅ Start everything

## What Gets Pulled from Docker Hub

- `abunurah1407/task-tracker-backend:latest` (includes SQL files)
- `abunurah1407/task-tracker-frontend:latest`
- `postgres:17-alpine` (official image)
- `adminer:latest` (optional)

**No GitHub needed for the application!** Only the script itself is downloaded from GitHub (one-time).

## What You'll Be Asked

1. Docker Hub Username: Press Enter (defaults to `abunurah1407`)
2. Image Tag: Press Enter (defaults to `latest`)
3. CORS Origin: Enter your domain (e.g., `https://yourdomain.com`)
4. Ports: Press Enter for defaults (or customize)

Everything else is automatic!

## After Deployment

Access your application:
- Frontend: `http://your-server-ip`
- Backend: `http://your-server-ip:3001`
- Health Check: `http://your-server-ip:3001/health`

## That's It!

Everything comes from Docker Hub. Simple and clean! 🚀

