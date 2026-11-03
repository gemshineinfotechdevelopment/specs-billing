#!/usr/bin/env bash
# ==============================================================================
# Automated Production Deployment Script
# Subdomain: specs-billing.gemshine.tech
# Backend Port: 5026
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Starting Deployment for LuminaOptic Billing on specs-billing.gemshine.tech..."

# 1. Ensure logs directory exists
mkdir -p logs

# 2. Install dependencies
echo "📦 Installing npm dependencies..."
npm install --include=dev

# 3. Build Frontend & Backend
echo "🏗️ Building Vite frontend and bundling Express backend..."
npm run build:all

# 4. Check if MongoDB service is active
if command -v systemctl &> /dev/null; then
    if ! systemctl is-active --quiet mongod; then
        echo "🍃 Starting MongoDB service..."
        sudo systemctl start mongod || true
    fi
fi

# 5. Start or Reload PM2 Process
echo "⚡ Starting / Reloading application with PM2 on Port 5026..."
if pm2 list | grep -q "specs-billing-server"; then
    echo "🔄 Reloading PM2 process 'specs-billing-server' with 0-downtime..."
    pm2 reload ecosystem.config.cjs --env production
else
    echo "▶️ Launching PM2 process 'specs-billing-server'..."
    pm2 start ecosystem.config.cjs --env production
fi

# Save PM2 process list so it restarts automatically on server reboot
pm2 save

# 6. Test Backend Health on Port 5026
echo "🔍 Testing backend health on http://127.0.0.1:5026/api/health..."
sleep 2
curl -s http://127.0.0.1:5026/api/health | grep "status" || echo "⚠️ Backend check notice (verify pm2 logs specs-billing-server)"

# 7. Reload Nginx
if command -v nginx &> /dev/null; then
    echo "🌐 Testing and reloading Nginx..."
    sudo nginx -t && sudo systemctl reload nginx
fi

echo ""
echo "=========================================================================="
echo "✅ Deployment Complete!"
echo "🌐 Subdomain URL: https://specs-billing.gemshine.tech"
echo "🔌 Backend API:   http://127.0.0.1:5026/api"
echo "📊 PM2 Status:    Run 'pm2 status' or 'pm2 logs specs-billing-server'"
echo "=========================================================================="

