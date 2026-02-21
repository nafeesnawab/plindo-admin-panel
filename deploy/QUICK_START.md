# 🚀 Quick Start Deployment Guide

**Your VPS IP:** `104.248.246.206`

---

## ⚡ Fast Track (5 Steps)

### 1️⃣ **Configure DNS in Hostinger** (5 mins)

Login to Hostinger → DNS Settings → Add two A records:

```
api.yourdomain.com    →  104.248.246.206
admin.yourdomain.com  →  104.248.246.206
```

📖 Detailed guide: [DNS_SETUP.md](DNS_SETUP.md)

**Wait 10 minutes** for DNS propagation.

---

### 2️⃣ **Setup VPS** (10 mins)

```bash
# Copy setup script to VPS
scp deploy/vps-setup.sh root@104.248.246.206:/root/

# SSH into VPS and run it
ssh root@104.248.246.206
chmod +x /root/vps-setup.sh
./vps-setup.sh
```

This installs: Node.js, MongoDB, Nginx, PM2, SSL tools.

---

### 3️⃣ **Update Domain Names** (2 mins)

Edit these 3 files and replace `yourdomain.com`:

```bash
# File 1
nano deploy/deploy.sh
# Change: BACKEND_DOMAIN="api.yourdomain.com"
# Change: FRONTEND_DOMAIN="admin.yourdomain.com"

# File 2
nano deploy/nginx/api.conf
# Replace all: api.yourdomain.com → api.YOURDOMAIN.com

# File 3
nano deploy/nginx/admin.conf
# Replace all: admin.yourdomain.com → admin.YOURDOMAIN.com
```

---

### 4️⃣ **Deploy Application** (10 mins)

```bash
# From your local machine
cd /Users/mac/Downloads/PLINDO-Admin-Panel
./deploy/deploy.sh
```

Enters VPS password once.

---

### 5️⃣ **Configure & Enable SSL** (5 mins)

SSH into VPS:
```bash
ssh root@104.248.246.206
```

**A. Edit environment variables:**
```bash
nano /var/www/plindo/backend/.env
```

Update:
- `CLIENT_URL=https://admin.yourdomain.com`
- `JWT_SECRET=` (run: `openssl rand -base64 32`)
- `JWT_REFRESH_SECRET=` (run: `openssl rand -base64 32`)
- Email settings if using SendGrid

**B. Setup Nginx:**
```bash
# Edit and replace yourdomain.com in both files
nano /var/www/plindo/deploy/nginx/api.conf
nano /var/www/plindo/deploy/nginx/admin.conf

# Copy to nginx
sudo cp /var/www/plindo/deploy/nginx/api.conf /etc/nginx/sites-available/api.yourdomain.com
sudo cp /var/www/plindo/deploy/nginx/admin.conf /etc/nginx/sites-available/admin.yourdomain.com

# Enable sites
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin.yourdomain.com /etc/nginx/sites-enabled/

# Remove default
sudo rm /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

**C. Get SSL certificates:**
```bash
sudo certbot --nginx -d api.yourdomain.com -d admin.yourdomain.com
```

Follow prompts:
1. Enter email
2. Agree to Terms (Y)
3. Redirect HTTP to HTTPS (option 2)

**D. Restart backend:**
```bash
cd /var/www/plindo/backend
pm2 restart plindo-backend
```

---

## ✅ Verify It's Working

**Test URLs:**
- Backend: `https://api.yourdomain.com`
- Frontend: `https://admin.yourdomain.com`

**Check services:**
```bash
pm2 status                    # Backend should be "online"
sudo systemctl status mongod  # Should be "active (running)"
sudo systemctl status nginx   # Should be "active (running)"
```

---

## 🔧 Common Commands

```bash
# View backend logs
pm2 logs plindo-backend

# Restart backend
pm2 restart plindo-backend

# Restart nginx
sudo systemctl restart nginx

# Check nginx config
sudo nginx -t
```

---

## 🆘 Troubleshooting

**Backend won't start?**
```bash
pm2 logs plindo-backend
# Check .env file
cat /var/www/plindo/backend/.env
```

**SSL certificate failed?**
- Make sure DNS is propagated (wait 10+ minutes)
- Check: `ping api.yourdomain.com` should return `104.248.246.206`

**Can't access website?**
```bash
# Check firewall
sudo ufw status
sudo ufw allow 'Nginx Full'
```

---

## 📚 Full Documentation

- [Complete Deployment Guide](DEPLOYMENT_GUIDE.md)
- [DNS Setup Guide](DNS_SETUP.md)

---

**Total Time: ~30 minutes** (excluding DNS propagation wait)

**You're done! 🎉**
