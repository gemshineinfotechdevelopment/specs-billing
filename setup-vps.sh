#!/usr/bin/env bash
# ==============================================================================
# VPS Initial Setup Script for LuminaOptic Specs Billing
# Subdomain: specs-billing.gemshine.tech
# Backend Port: 5026
# OS: Ubuntu 22.04 / 24.04 LTS or Debian 12
# ==============================================================================

set -e

echo "🚀 Starting VPS Setup for specs-billing.gemshine.tech..."

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget gnupg git ufw software-properties-common ca-certificates lsb-release

# 2. Install Node.js 20 LTS
echo "🟢 Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"

# 3. Install PM2 Globally
echo "⚡ Installing PM2 process manager..."
sudo npm install -g pm2

# 4. Install MongoDB Community Edition (Local Database)
echo "🍃 Installing MongoDB Community Edition..."
if ! command -v mongod &> /dev/null; then
    UBUNTU_CODENAME=$(lsb_release -cs)
    # Import MongoDB public GPG Key
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
    
    # Create list file
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    sudo apt update
    sudo apt install -y mongodb-org
fi

# Enable and start MongoDB service
sudo systemctl daemon-reload
sudo systemctl enable mongod
sudo systemctl start mongod

if sudo systemctl is-active --quiet mongod; then
    echo "✅ MongoDB service is active and running on port 27017!"
else
    echo "⚠️ MongoDB service did not start automatically. Check 'sudo systemctl status mongod'"
fi

# 5. Install Nginx
echo "🌐 Installing Nginx Web Server..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 6. Install Certbot for Let's Encrypt SSL
echo "🔒 Installing Certbot for HTTPS SSL..."
sudo apt install -y certbot python3-certbot-nginx

# 7. Configure Firewall (UFW)
echo "🛡️ Configuring Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
# Ensure backend port 5026 is accessible internally (or opened if direct testing is needed)
sudo ufw allow 5026/tcp
sudo ufw --force enable

# 8. Create application directories
echo "📁 Setting up project directory at /var/www/specs-billing..."
sudo mkdir -p /var/www/specs-billing
sudo chown -R $USER:$USER /var/www/specs-billing

# 9. Configure Nginx Server Block
echo "⚙️ Linking Nginx configuration for specs-billing.gemshine.tech..."
if [ -f "./nginx/specs-billing.gemshine.tech.conf" ]; then
    sudo cp ./nginx/specs-billing.gemshine.tech.conf /etc/nginx/sites-available/specs-billing.gemshine.tech.conf
    sudo ln -sf /etc/nginx/sites-available/specs-billing.gemshine.tech.conf /etc/nginx/sites-enabled/
    # Remove default Nginx site if needed
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx site enabled!"
else
    echo "ℹ️ Please copy nginx/specs-billing.gemshine.tech.conf to /etc/nginx/sites-available/ after deploying code."
fi

echo ""
echo "=========================================================================="
echo "🎉 VPS Initial Setup Finished Successfully!"
echo "Next steps:"
echo "1. Upload / Git clone your code into /var/www/specs-billing"
echo "2. Run './deploy.sh' to build and launch with PM2 and Nginx"
echo "3. Run 'sudo certbot --nginx -d specs-billing.gemshine.tech' to activate HTTPS SSL"
echo "=========================================================================="

