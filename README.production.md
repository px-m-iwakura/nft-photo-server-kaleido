# NFT Photo Server - Production Deployment Guide

## 🚀 Production Environment

### Architecture
Frontend App (HTTPS) → App Server (Docker/Azure VM) → NFT Kaleido Server (Docker)


### Blockchain Configuration
- **Network**: Kaleido Blockchain
- **Chain ID**: 23251219
- **Contract**: HitachiNebutaToken (HNT)
- **Address**: 0x4a223B8a4fcE1aBEa7b15089B1201B7750825d0f
- **Gas**: Not required (Community Edition)

## 📋 Prerequisites

- Docker and Docker Compose installed
- Azure VM with sufficient resources
- Network access to Kaleido RPC endpoint

## 🔧 Production Deployment

### Quick Deploy
```bash
chmod +x deploy.sh
./deploy.sh
Manual Deploy
Copy# Stop existing services
docker-compose down -v

# Start production environment
docker-compose -f docker-compose.production.yml up -d --build

# Check status
docker-compose -f docker-compose.production.yml ps
curl http://localhost:3000/health
🔍 Monitoring
Health Check
Copycurl http://localhost:3000/health
Logs
Copy# Application logs
docker-compose -f docker-compose.production.yml logs -f app

# MongoDB logs
docker-compose -f docker-compose.production.yml logs -f mongodb
🛠️ Troubleshooting
Common Issues
Kaleido Connection Error

Check network connectivity to Kaleido RPC
Verify environment variables
MongoDB Connection Error

Ensure MongoDB container is running
Check MongoDB logs
Log Analysis
Copy# Real-time application logs
docker-compose -f docker-compose.production.yml logs -f app

# Container status
docker-compose -f docker-compose.production.yml ps
