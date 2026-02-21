# DNS Configuration Guide (Hostinger)

## Step-by-Step: Configure DNS Records in Hostinger

### 1. Login to Hostinger

Go to: https://hpanel.hostinger.com/
Login with your credentials

### 2. Access DNS Zone Editor

1. From the dashboard, click on **Domains**
2. Select your domain
3. Click on **DNS / Name Servers**
4. Scroll to **DNS Records** section

### 3. Add A Records

Click **Add Record** and create these two records:

#### Record 1: Backend API
```
Type:   A
Name:   api
Points to: 104.248.246.206
TTL:    3600
```

#### Record 2: Frontend Admin
```
Type:   A
Name:   admin
Points to: 104.248.246.206
TTL:    3600
```

### 4. Save Changes

Click **Add** or **Save** for each record.

### Visual Example

```
┌────────────────────────────────────────────────────────┐
│  DNS Records for yourdomain.com                        │
├──────┬──────────┬───────────────────┬─────────────────┤
│ Type │ Name     │ Points to         │ TTL             │
├──────┼──────────┼───────────────────┼─────────────────┤
│  A   │ api      │ 104.248.246.206   │ 3600            │
│  A   │ admin    │ 104.248.246.206   │ 3600            │
└──────┴──────────┴───────────────────┴─────────────────┘
```

### 5. Wait for Propagation

- **Time**: 5-30 minutes (usually)
- **Maximum**: Up to 48 hours

### 6. Verify DNS Propagation

**From your terminal:**

```bash
# Check if DNS is working
nslookup api.yourdomain.com
nslookup admin.yourdomain.com

# Or use ping
ping api.yourdomain.com
ping admin.yourdomain.com
```

**Expected output:**
```
Server:  ...
Address: ...

Name:    api.yourdomain.com
Address: 104.248.246.206
```

**Online tools:**
- https://www.whatsmydns.net/
- https://dnschecker.org/

Enter your domains:
- `api.yourdomain.com`
- `admin.yourdomain.com`

Should show: `104.248.246.206` globally

---

## Common Issues

### DNS not propagating?

1. **Check TTL**: Lower TTL = faster propagation
2. **Clear DNS cache**:
   ```bash
   # macOS
   sudo dscacheutil -flushcache

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```

### Wrong DNS provider?

Make sure your domain nameservers point to Hostinger:
- `ns1.dns-parking.com`
- `ns2.dns-parking.com`

(Or similar Hostinger nameservers)

---

## Optional: Add WWW Redirect

If you want `www.admin.yourdomain.com` to redirect to `admin.yourdomain.com`:

### Add CNAME Record
```
Type:   CNAME
Name:   www.admin
Points to: admin.yourdomain.com
TTL:    3600
```

Then in Nginx config, add:
```nginx
server {
    server_name www.admin.yourdomain.com;
    return 301 https://admin.yourdomain.com$request_uri;
}
```

---

## What You'll Have After Setup

✅ `api.yourdomain.com` → Backend API
✅ `admin.yourdomain.com` → Frontend Admin Panel
✅ Both pointing to: `104.248.246.206`

**Next step:** Run the VPS setup script!
