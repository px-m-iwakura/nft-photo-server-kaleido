#!/bin/bash

# NFT Photo Server - Kaleido Production Deployment Script

echo "=== NFT Photo Server - Kaleido Production Deployment ==="
echo "🚀 Starting production deployment..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down -v 2>/dev/null || true

# Pull latest code (if using git)
echo "📥 Pulling latest code..."
git pull origin main

# Build and start production environment
echo "🏗️  Building and starting production environment..."
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo "🔍 Performing health check..."
if curl -f http://localhost:3000/health; then
    echo "✅ Deployment successful!"
    echo "🌐 NFT Photo Server is running on port 3000"
    echo "🎯 Environment: Production"
    echo "🔗 Blockchain: Kaleido (Chain ID: 23251219)"
else
    echo "❌ Health check failed!"
    echo "📋 Checking logs..."
    docker-compose -f docker-compose.production.yml logs app
    exit 1
fi

echo "🎉 Production deployment completed successfully!"