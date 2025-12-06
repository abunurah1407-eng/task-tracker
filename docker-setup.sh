#!/bin/bash

# Docker Setup Script for Task Tracker

echo "🐳 Setting up Task Tracker with Docker..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose exec backend npm run migrate

# Seed the database
echo "🌱 Seeding database..."
docker-compose exec backend npm run seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "📱 Access the application at:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:3001"
echo ""
echo "🔑 Default login credentials:"
echo "   Admin: admin@etec.com / password123"
echo "   Director: director@etec.com / password123"
echo "   Engineer: faisal@etec.com / password123"

