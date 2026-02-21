# PLINDO Admin Panel - Deployment Guide

## 🌐 Production URLs

- **Frontend**: https://app.codecoytechnologies.live
- **Backend API**: https://api.codecoytechnologies.live

---

## 📋 VPS Setup (Already Completed)

The VPS has been fully configured with:

✅ Ubuntu 24.04 LTS
✅ Node.js 20.20.0
✅ npm 10.8.2
✅ PM2 6.0.14 (process manager)
✅ nginx 1.24.0 (reverse proxy)
✅ MongoDB 8.0.19
✅ SSL Certificates (Let's Encrypt)
✅ Automatic SSL renewal configured

---

## 🎯 Quick Start

Your application is **ready to deploy**! Just:
1. Add GitHub Secrets (see below)
2. Update backend .env on VPS
3. Push to `main` branch → Auto-deploys! 🚀

---

## 🔐 GitHub Secrets Required

Add these secrets to your GitHub repository:

### Go to: Repository → Settings → Secrets and variables → Actions → New repository secret

| Secret Name | Value | Description |
|------------|-------|-------------|
| `VPS_HOST` | `104.248.246.206` | Your VPS IP address |
| `VPS_USERNAME` | `root` | SSH username |
| `VPS_PASSWORD` | `RG6mye@iou` | SSH password |

**⚠️ IMPORTANT**: After adding these secrets, change your VPS root password:
```bash
ssh root@104.248.246.206
passwd
# Update VPS_PASSWORD secret with the new password
```

---

## 🚀 How CI/CD Works

### Automatic Deployment
Every push to `main` branch triggers GitHub Actions:

1. **Backend Deployment**:
   - SSH into VPS
   - Clone latest code
   - Install dependencies (`npm ci --production`)
   - Reload PM2

2. **Frontend Deployment**:
   - Build React app
   - Copy `dist/` to VPS
   - nginx serves static files

### Manual Deployment
Go to: Repository → Actions → Deploy to Production → Run workflow

---

## 📁 VPS Directory Structure

```
/var/www/plindo/
├── backend/              # Backend Node.js app
│   ├── src/
│   ├── package.json
│   └── .env             # Manually configured
├── client/
│   └── dist/            # Built frontend (auto-deployed)
├── logs/                # PM2 logs
├── ecosystem.config.js  # PM2 config
├── deploy-backend.sh
└── deploy-frontend.sh
```

---

## ⚙️ Environment Variables

### Backend (.env) - **UPDATE THESE!**

SSH and edit:
```bash
ssh root@104.248.246.206
nano /var/www/plindo/backend/.env
```

**Critical values to update:**
```env
# Generate with: openssl rand -base64 32
JWT_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING
JWT_REFRESH_SECRET=CHANGE_THIS_TO_ANOTHER_SECURE_STRING

# Your SendGrid API key
SMTP_PASSWORD=YOUR_SENDGRID_API_KEY
```

### Frontend (.env.production) - Already configured
```env
VITE_APP_API_BASE_URL=https://api.codecoytechnologies.live/api
VITE_APP_PUBLIC_PATH=/
```

---

## 🎯 First Deployment Steps

1. **Add GitHub Secrets** (see table above)

2. **Update Backend .env on VPS**:
   ```bash
   ssh root@104.248.246.206
   nano /var/www/plindo/backend/.env
   # Update JWT secrets and SMTP password
   ```

3. **Push to deploy**:
   ```bash
   git add .
   git commit -m "feat: initial production deployment"
   git push origin main
   ```

4. **Verify**:
   - Frontend: https://app.codecoytechnologies.live
   - Backend: https://api.codecoytechnologies.live/api/health

---

## 🔄 PM2 Management

```bash
# SSH into VPS
ssh root@104.248.246.206

# View processes
pm2 status

# View logs
pm2 logs plindo-backend

# Restart
pm2 restart plindo-backend

# Save process list
pm2 save
```

---

## 🌐 nginx & SSL

### nginx Configuration
Located at: `/etc/nginx/sites-available/plindo`

- Routes `api.codecoytechnologies.live` → Backend (localhost:5000)
- Serves `app.codecoytechnologies.live` → Frontend static files
- SSL enabled with auto-redirect

### Reload nginx
```bash
nginx -t
systemctl reload nginx
```

### SSL Certificate
- **Expires**: 2026-05-22
- **Auto-renewal**: Configured via certbot timer
- **Manual renewal**: `certbot renew`

---

## 🐛 Troubleshooting

### Backend not starting
```bash
ssh root@104.248.246.206
pm2 logs plindo-backend --lines 50
```

### Frontend 502/504 error
```bash
# Check if backend is running
pm2 status
pm2 restart plindo-backend
```

### MongoDB issues
```bash
systemctl status mongod
mongosh  # Test connection
```

---

## 📊 Monitoring

### View Logs
```bash
# Backend
pm2 logs plindo-backend

# nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🔐 Security Notes

- PM2 auto-starts on reboot
- SSL auto-renews every 60 days
- MongoDB only accessible locally
- **TODO**: Change root password after deployment
- **TODO**: Setup SSH keys instead of password

---

**🎉 Your application is live with CI/CD!**
