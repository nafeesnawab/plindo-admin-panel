#!/bin/bash

# VPS Initial Setup Script for PLINDO Admin Panel
# Run this on your VPS after initial SSH connection

set -e

echo "🚀 Starting VPS Setup..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
echo "📦 Installing MongoDB..."
sudo apt install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
echo "🔄 Starting MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Certbot for SSL
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/plindo
sudo chown -R $USER:$USER /var/www/plindo

# Install Git
echo "📦 Installing Git..."
sudo apt install -y git

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "✅ VPS Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Configure your domain DNS (see DNS_SETUP.md)"
echo "2. Run the deployment script: ./deploy.sh"
