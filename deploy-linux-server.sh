#!/bin/bash

# Task Tracker Linux Server Deployment Script
# This script automates the deployment process on a Linux server

set -e  # Exit on error

echo "=========================================="
echo "Task Tracker - Linux Server Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run this script as root${NC}"
   echo "Run as a regular user (Docker commands will use sudo when needed)"
   exit 1
fi

# Configuration
PROJECT_DIR="/opt/task-tracker"

# Function to run docker commands (with sudo if needed)
DOCKER_CMD="docker"
if ! docker info &>/dev/null; then
    if sudo docker info &>/dev/null; then
        DOCKER_CMD="sudo docker"
        echo -e "${YELLOW}Note: Using sudo for Docker commands${NC}"
        echo -e "${YELLOW}Tip: Add user to docker group to avoid sudo: sudo usermod -aG docker $USER${NC}"
        echo ""
    else
        echo -e "${RED}✗ Cannot access Docker. Please check Docker installation.${NC}"
        exit 1
    fi
fi

echo "Step 1: Checking prerequisites..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker is not installed. Please install Docker first.${NC}"
    echo "See LINUX_SERVER_DEPLOYMENT.md for installation instructions."
    exit 1
else
    echo -e "${GREEN}✓ Docker is installed${NC}"
    $DOCKER_CMD --version
fi

# Check if Docker Compose is installed
if ! $DOCKER_CMD compose version &> /dev/null; then
    echo -e "${YELLOW}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Docker Compose is installed${NC}"
    $DOCKER_CMD compose version
fi

echo ""
echo "Step 2: Creating project directory..."
sudo mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"
echo -e "${GREEN}✓ Project directory created: $PROJECT_DIR${NC}"

echo ""
echo "Step 3: Creating docker-compose.prod.yml..."

sudo tee docker-compose.prod.yml > /dev/null <<'EOF'
services:
  # Database Init Container - Copies SQL files from backend image
  db-init:
    image: ${DOCKER_HUB_USERNAME}/task-tracker-backend:${IMAGE_TAG:-latest}
    container_name: task-tracker-db-init
    command: sh -c "cp /app/db/schema.sql /shared/01-schema.sql && cp /app/db/seed.sql /shared/02-seed.sql && echo 'SQL files copied successfully'"
    volumes:
      - db_init_scripts:/shared
    networks:
      - task-tracker-network
    restart: "no"

  # PostgreSQL Database
  postgres:
    image: postgres:17-alpine
    container_name: task-tracker-db
    environment:
      POSTGRES_DB: task_tracker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "${DB_PORT:-5433}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - db_init_scripts:/docker-entrypoint-initdb.d
    depends_on:
      - db-init
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - task-tracker-network
    restart: unless-stopped

  # Backend API
  backend:
    image: ${DOCKER_HUB_USERNAME}/task-tracker-backend:${IMAGE_TAG:-latest}
    container_name: task-tracker-api
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: task_tracker
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
    ports:
      - "${BACKEND_PORT:-3001}:3001"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - task-tracker-network
    restart: unless-stopped

  # Frontend
  frontend:
    image: ${DOCKER_HUB_USERNAME}/task-tracker-frontend:${IMAGE_TAG:-latest}
    container_name: task-tracker-frontend
    ports:
      - "${FRONTEND_PORT:-80}:80"
    depends_on:
      - backend
    networks:
      - task-tracker-network
    restart: unless-stopped

  # Database Admin (Adminer) - Optional
  adminer:
    image: adminer:latest
    container_name: task-tracker-adminer
    ports:
      - "${ADMINER_PORT:-8080}:8080"
    depends_on:
      - postgres
    networks:
      - task-tracker-network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  db_init_scripts:
    driver: local

networks:
  task-tracker-network:
    driver: bridge
EOF

echo -e "${GREEN}✓ Created docker-compose.prod.yml${NC}"

echo ""
echo "Step 4: Configuring environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo ""
    echo "Please provide the following configuration:"
    echo ""
    
    # Prompt for Docker Hub username
    read -p "Docker Hub Username [abunurah1407]: " DOCKER_USERNAME
    DOCKER_USERNAME=${DOCKER_USERNAME:-abunurah1407}
    
    # Prompt for image tag
    read -p "Image Tag [latest]: " IMAGE_TAG
    IMAGE_TAG=${IMAGE_TAG:-latest}
    
    # Generate secure passwords
    DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    echo ""
    echo "Generated secure passwords:"
    echo "  DB_PASSWORD: $DB_PASSWORD"
    echo "  JWT_SECRET: $JWT_SECRET"
    echo ""
    
    # Prompt for CORS origin
    read -p "CORS Origin (e.g., https://yourdomain.com or http://localhost) [http://localhost]: " CORS_ORIGIN
    CORS_ORIGIN=${CORS_ORIGIN:-http://localhost}
    
    # Prompt for ports
    read -p "Frontend Port [80]: " FRONTEND_PORT
    FRONTEND_PORT=${FRONTEND_PORT:-80}
    
    read -p "Backend Port [3001]: " BACKEND_PORT
    BACKEND_PORT=${BACKEND_PORT:-3001}
    
    read -p "Database Port [5433]: " DB_PORT
    DB_PORT=${DB_PORT:-5433}
    
    read -p "Adminer Port [8080] (0 to disable): " ADMINER_PORT
    ADMINER_PORT=${ADMINER_PORT:-8080}
    
    # Prompt for Frontend URL (for invitation links)
    read -p "Frontend URL (for invitation links) [http://localhost]: " FRONTEND_URL
    FRONTEND_URL=${FRONTEND_URL:-http://localhost}
    
    # Create .env file (ensure no special characters or variables leak in)
    cat > /tmp/task-tracker.env <<ENVEOF
DOCKER_HUB_USERNAME=$DOCKER_USERNAME
IMAGE_TAG=$IMAGE_TAG
DB_PASSWORD=$DB_PASSWORD
DB_PORT=$DB_PORT
BACKEND_PORT=$BACKEND_PORT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
CORS_ORIGIN=$CORS_ORIGIN
FRONTEND_PORT=$FRONTEND_PORT
FRONTEND_URL=$FRONTEND_URL
ADMINER_PORT=$ADMINER_PORT
ENVEOF
    sudo mv /tmp/task-tracker.env .env
    sudo chmod 644 .env
    
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo ""
    echo -e "${YELLOW}⚠ IMPORTANT: Save these credentials securely!${NC}"
    echo "  Database Password: $DB_PASSWORD"
    echo "  JWT Secret: $JWT_SECRET"
    echo ""
else
    echo -e "${YELLOW}.env file already exists, using existing configuration...${NC}"
    # Read Docker Hub username from .env file safely (skip comments and empty lines)
    if [ -f .env ]; then
        DOCKER_USERNAME=$(grep "^DOCKER_HUB_USERNAME=" .env 2>/dev/null | grep -v "^#" | cut -d'=' -f2 | tr -d ' ' | tr -d '"' | tr -d "'" | head -1)
        IMAGE_TAG=$(grep "^IMAGE_TAG=" .env 2>/dev/null | grep -v "^#" | cut -d'=' -f2 | tr -d ' ' | tr -d '"' | tr -d "'" | head -1)
        DOCKER_USERNAME=${DOCKER_USERNAME:-abunurah1407}
        IMAGE_TAG=${IMAGE_TAG:-latest}
    fi
fi

echo ""
echo "Step 5: Checking Docker Hub login..."

# Check if logged in to Docker Hub
# Store the result in a variable to avoid issues with command substitution in if condition
DOCKER_LOGIN_CHECK=$($DOCKER_CMD info 2>/dev/null | grep -q "Username" && echo "yes" || echo "no")

if [ "$DOCKER_LOGIN_CHECK" != "yes" ]; then
    echo -e "${YELLOW}Not logged in to Docker Hub${NC}"
    
    # Check if we're in an interactive terminal
    if [ -t 0 ]; then
        # Interactive terminal - can prompt
        read -p "Do you want to login to Docker Hub now? (y/n) [n]: " LOGIN_CHOICE
        if [[ "$LOGIN_CHOICE" =~ ^[Yy]$ ]]; then
            $DOCKER_CMD login
        else
            echo -e "${YELLOW}You may need to login later if images are private${NC}"
            echo -e "${YELLOW}Run: $DOCKER_CMD login${NC}"
        fi
    else
        # Non-interactive (piped script) - skip login, provide instructions
        echo -e "${YELLOW}Non-interactive mode detected. Skipping login.${NC}"
        echo -e "${YELLOW}Please login manually before continuing:${NC}"
        echo -e "${YELLOW}  $DOCKER_CMD login${NC}"
        echo ""
        # Skip read prompt in non-interactive mode
    fi
else
    echo -e "${GREEN}✓ Already logged in to Docker Hub${NC}"
fi

echo ""
echo "Step 6: Pulling Docker images..."

# Ensure .env file is clean and valid - only allow docker-compose variables
if [ -f .env ]; then
    # Check if .env file might be corrupted (contains shell script syntax)
    if grep -qE '(if |then|fi|grep|echo|\$DOCKER_CMD|\$RED|\$GREEN|\$YELLOW)' .env 2>/dev/null; then
        echo -e "${YELLOW}⚠ Detected potential corruption in .env file. Cleaning it up...${NC}"
        # Backup the corrupted file
        sudo cp .env .env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    fi
    
           # Only keep valid docker-compose variables (whitelist approach)
           cat > /tmp/clean.env <<'ENVCLEAN'
DOCKER_HUB_USERNAME
IMAGE_TAG
DB_PASSWORD
DB_PORT
BACKEND_PORT
JWT_SECRET
JWT_EXPIRES_IN
CORS_ORIGIN
FRONTEND_PORT
FRONTEND_URL
ADMINER_PORT
ENVCLEAN
    
    # Extract only whitelisted variables from .env file
    > /tmp/filtered.env
    while IFS= read -r var_name; do
        # Get value, handling cases where = might appear in the value
        value=$(grep "^${var_name}=" .env 2>/dev/null | cut -d'=' -f2- | head -1)
        # Check if variable exists in .env (even if empty)
        if grep -q "^${var_name}=" .env 2>/dev/null; then
            # Remove quotes and leading/trailing whitespace, but preserve empty values
            if [ -n "$value" ]; then
                value=$(echo "$value" | sed "s/^['\"]//;s/['\"]$//" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                # Only add if value doesn't contain shell script syntax
                if ! echo "$value" | grep -qE '(if |then|fi|\$DOCKER_CMD)'; then
                    echo "${var_name}=${value}" >> /tmp/filtered.env
                fi
            else
                # Variable exists but is empty - keep it for docker-compose defaults
                echo "${var_name}=" >> /tmp/filtered.env
            fi
        fi
    done < /tmp/clean.env
    
    if [ -s /tmp/filtered.env ]; then
        sudo mv /tmp/filtered.env .env
        sudo chmod 644 .env
        echo -e "${GREEN}✓ Cleaned .env file${NC}"
    else
        echo -e "${YELLOW}⚠ .env file appears empty or corrupted. You may need to recreate it.${NC}"
    fi
fi

# Run docker-compose (the --env-file flag should prevent reading bash variables, but we'll also filter env)
# Use a subshell to temporarily unset problematic variables
echo "Pulling Docker images from Docker Hub..."
PULL_OUTPUT=$(
    unset RED GREEN YELLOW NC PROJECT_DIR LOGIN_CHOICE
    $DOCKER_CMD compose -f docker-compose.prod.yml --env-file .env pull 2>&1
)
PULL_EXIT_CODE=$?

if [ $PULL_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully pulled all images${NC}"
else
    echo -e "${RED}✗ Failed to pull some images${NC}"
    echo ""
    echo "Error details:"
    echo "$PULL_OUTPUT" | grep -E "(Error|not found|failed)" | head -5
    echo ""
    
    # Check which specific images failed
    MISSING_IMAGES=""
    if echo "$PULL_OUTPUT" | grep -q "task-tracker-frontend.*not found"; then
        MISSING_IMAGES="${MISSING_IMAGES}frontend "
    fi
    if echo "$PULL_OUTPUT" | grep -q "task-tracker-backend.*not found"; then
        MISSING_IMAGES="${MISSING_IMAGES}backend "
    fi
    
    if [ -n "$MISSING_IMAGES" ]; then
        echo -e "${YELLOW}⚠ Missing images detected: $MISSING_IMAGES${NC}"
        echo ""
        echo "To build and push the missing images, run these commands on your development machine:"
        echo ""
        
        if echo "$MISSING_IMAGES" | grep -q "frontend"; then
            echo -e "${YELLOW}Frontend image:${NC}"
            echo "  docker build -t ${DOCKER_USERNAME:-abunurah1407}/task-tracker-frontend:latest ."
            echo "  docker push ${DOCKER_USERNAME:-abunurah1407}/task-tracker-frontend:latest"
            echo ""
        fi
        
        if echo "$MISSING_IMAGES" | grep -q "backend"; then
            echo -e "${YELLOW}Backend image:${NC}"
            echo "  cd backend"
            echo "  docker build -t ${DOCKER_USERNAME:-abunurah1407}/task-tracker-backend:latest ."
            echo "  docker push ${DOCKER_USERNAME:-abunurah1407}/task-tracker-backend:latest"
            echo ""
        fi
        
        echo "After pushing the images, run this script again."
    else
        echo "Please check:"
        echo "  1. Docker Hub username is correct in .env (currently: ${DOCKER_USERNAME:-abunurah1407})"
        echo "  2. You're logged in to Docker Hub (run: $DOCKER_CMD login)"
        echo "  3. Images exist on Docker Hub"
    fi
    exit 1
fi

echo ""
echo "Step 7: Starting containers..."

(
    unset RED GREEN YELLOW NC PROJECT_DIR LOGIN_CHOICE
    $DOCKER_CMD compose -f docker-compose.prod.yml --env-file .env up -d
)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Containers started successfully${NC}"
else
    echo -e "${RED}✗ Failed to start containers${NC}"
    exit 1
fi

echo ""
echo "Step 8: Waiting for services to be ready..."
sleep 10

echo ""
echo "Step 10: Checking service status..."

# Check container status
(
    unset RED GREEN YELLOW NC PROJECT_DIR LOGIN_CHOICE
    $DOCKER_CMD compose -f docker-compose.prod.yml --env-file .env ps
) | grep -q "Up"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All containers are running${NC}"
else
    echo -e "${YELLOW}⚠ Some containers may not be running. Check logs:${NC}"
    (
        unset RED GREEN YELLOW NC PROJECT_DIR LOGIN_CHOICE
        $DOCKER_CMD compose -f docker-compose.prod.yml --env-file .env ps
    )
fi

echo ""
echo "Step 11: Verifying deployment..."

# Wait a bit more for services to fully start
sleep 5

# Check backend health (if curl is available)
if command -v curl &> /dev/null; then
    if curl -sf http://localhost:${BACKEND_PORT:-3001}/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠ Backend health check failed (may still be starting)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ curl not available, skipping health check${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Application is now running:"
echo ""
echo "  Frontend:    http://localhost:${FRONTEND_PORT:-80}"
echo "  Backend API: http://localhost:${BACKEND_PORT:-3001}"
echo "  Health:      http://localhost:${BACKEND_PORT:-3001}/health"
if [ "${ADMINER_PORT:-8080}" != "0" ]; then
    echo "  Adminer:     http://localhost:${ADMINER_PORT:-8080}"
fi
echo ""
echo "Default Login Credentials:"
echo "  Admin:    admin@etec.gov.sa / password123"
echo "  Director: N.Saleem@etec.gov.sa / password123"
echo ""
echo -e "${YELLOW}⚠ IMPORTANT: Change all default passwords in production!${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:    $DOCKER_CMD compose -f docker-compose.prod.yml --env-file .env logs -f"
echo "  Stop:         $DOCKER_CMD compose -f docker-compose.prod.yml --env-file .env down"
echo "  Restart:      $DOCKER_CMD compose -f docker-compose.prod.yml --env-file .env restart"
echo "  Status:       $DOCKER_CMD compose -f docker-compose.prod.yml --env-file .env ps"
echo ""

