#!/bin/bash

# Docker Installation Script for Ubuntu/Debian
# Run this script first before deploying the application

set -e

echo "=========================================="
echo "Docker Installation for Ubuntu/Debian"
echo "=========================================="
echo ""

# Update package index
echo "Step 1: Updating package index..."
sudo apt-get update

# Install prerequisites
echo ""
echo "Step 2: Installing prerequisites..."
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
echo ""
echo "Step 3: Adding Docker's GPG key..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo ""
echo "Step 4: Setting up Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index again
echo ""
echo "Step 5: Updating package index with Docker repository..."
sudo apt-get update

# Install Docker Engine
echo ""
echo "Step 6: Installing Docker Engine..."
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker service
echo ""
echo "Step 7: Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (optional, to run without sudo)
echo ""
read -p "Add current user ($USER) to docker group to run without sudo? (y/n) [y]: " ADD_USER
ADD_USER=${ADD_USER:-y}
if [[ "$ADD_USER" =~ ^[Yy]$ ]]; then
    sudo usermod -aG docker $USER
    echo "✓ User added to docker group"
    echo "⚠ You may need to log out and log back in for this to take effect"
fi

# Verify installation
echo ""
echo "Step 8: Verifying installation..."
docker --version
docker compose version

echo ""
echo "=========================================="
echo "✓ Docker installed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. If you added user to docker group, log out and log back in"
echo "2. Run the deployment script:"
echo "   curl -fsSL https://raw.githubusercontent.com/abunurah1407-eng/task-tracker/main/deploy-linux-server.sh | bash"
echo ""

