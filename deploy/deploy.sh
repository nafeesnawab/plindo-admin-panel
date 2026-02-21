#!/bin/bash

# Deployment Script for PLINDO Admin Panel
# Run this from your LOCAL machine

set -e

# Configuration
VPS_IP="104.248.246.206"
VPS_USER="root"
APP_DIR="/var/www/plindo"
BACKEND_DOMAIN="api.yourdomain.com"  # Replace with your actual domain
FRONTEND_DOMAIN="admin.yourdomain.com"  # Replace with your actual domain

echo "🚀 Starting deployment to $VPS_IP..."

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "⚠️  SSH key not found. Generating one..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
fi

# Copy SSH key to VPS (you'll need to enter password)
echo "📋 Setting up SSH key authentication..."
ssh-copy-id -i ~/.ssh/id_rsa.pub $VPS_USER@$VPS_IP || echo "SSH key already exists on VPS"

# Create deployment package
echo "📦 Creating deployment package..."
cd "$(dirname "$0")/.."

# Build frontend
echo "🏗️  Building frontend..."
cd client
npm install
npm run build
cd ..

# Create tarball (excluding node_modules, .git, etc.)
echo "📦 Creating tarball..."
tar -czf /tmp/plindo-deploy.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=client/node_modules \
    --exclude=backend/node_modules \
    --exclude=backend/uploads \
    --exclude=.DS_Store \
    backend client deploy

# Upload to VPS
echo "⬆️  Uploading to VPS..."
scp /tmp/plindo-deploy.tar.gz $VPS_USER@$VPS_IP:/tmp/

# Execute deployment on VPS
echo "🔧 Deploying on VPS..."
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
set -e

APP_DIR="/var/www/plindo"

# Extract files
echo "📦 Extracting files..."
mkdir -p $APP_DIR
cd $APP_DIR
tar -xzf /tmp/plindo-deploy.tar.gz
rm /tmp/plindo-deploy.tar.gz

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd $APP_DIR/backend
npm install --production

# Setup environment file
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << 'EOF'
PORT=5000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/plindo-admin

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_EXPIRE=30d

# CORS Configuration
CLIENT_URL=https://admin.yourdomain.com

# SendGrid SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=Plindo <noreply@yourdomain.com>
EOF
    echo "⚠️  IMPORTANT: Edit $APP_DIR/backend/.env and update the values!"
fi

# Create uploads directory
mkdir -p $APP_DIR/backend/uploads

# Copy frontend build to nginx directory
echo "📦 Setting up frontend..."
sudo rm -rf /var/www/html/plindo-admin
sudo mkdir -p /var/www/html/plindo-admin
sudo cp -r $APP_DIR/client/dist/* /var/www/html/plindo-admin/

# Setup PM2
echo "🔄 Starting backend with PM2..."
cd $APP_DIR/backend
pm2 delete plindo-backend || true
pm2 start src/server.js --name plindo-backend --time
pm2 save
pm2 startup | tail -1 | sudo bash

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Edit $APP_DIR/backend/.env with your actual values"
echo "2. Configure Nginx (see nginx-config-*.conf files)"
echo "3. Setup SSL certificates with certbot"
ENDSSH

echo ""
echo "✅ Deployment script completed!"
echo ""
echo "🔧 Manual steps required:"
echo "1. SSH into your VPS: ssh $VPS_USER@$VPS_IP"
echo "2. Edit environment variables: nano $APP_DIR/backend/.env"
echo "3. Configure Nginx (files are in deploy/nginx/)"
echo "4. Setup SSL with: sudo certbot --nginx"
echo "5. Restart services:"
echo "   - pm2 restart plindo-backend"
echo "   - sudo systemctl restart nginx"
