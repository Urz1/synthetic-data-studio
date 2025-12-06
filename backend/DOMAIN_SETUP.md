# Domain Setup Guide: synthdata.studio

## Prerequisites
- Domain: `synthdata.studio` (from name.com)
- EC2 Instance: `13.61.186.228`
- Backend running on port 8000

---

## Step 1: Configure DNS Records (name.com)

### Login to name.com and add these A records:

| Type | Host | Answer | TTL |
|------|------|--------|-----|
| A | @ | 13.61.186.228 | 300 |
| A | www | 13.61.186.228 | 300 |
| A | api | 13.61.186.228 | 300 |

**How to do this:**
1. Go to https://www.name.com/account/domain
2. Click on `synthdata.studio`
3. Go to "DNS Records" tab
4. Click "Add Record"
5. Add each record above

**DNS Propagation:** Takes 5-60 minutes. Test with:
```bash
nslookup synthdata.studio
ping synthdata.studio
```

---

## Step 2: Install Nginx on EC2

SSH into your EC2 instance:
```bash
ssh -i your-key.pem ubuntu@13.61.186.228
```

### Install Nginx:
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl status nginx
```

### Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/synthdata.studio
```

Paste this configuration:
```nginx
# Redirect www to non-www
server {
    listen 80;
    server_name www.synthdata.studio;
    return 301 http://synthdata.studio$request_uri;
}

# Main API server
server {
    listen 80;
    server_name synthdata.studio api.synthdata.studio;

    client_max_body_size 100M;

    # API Backend
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}
```

### Enable the site:
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/synthdata.studio /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Update Security Group (AWS Console):
1. Go to EC2 → Security Groups
2. Select your instance's security group
3. Add inbound rules:
   - **HTTP**: Port 80, Source: 0.0.0.0/0
   - **HTTPS**: Port 443, Source: 0.0.0.0/0

**Test:** Visit `http://synthdata.studio` - should show your API!

---

## Step 3: Install SSL Certificate (Let's Encrypt)

### Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Get SSL certificate:
```bash
sudo certbot --nginx -d synthdata.studio -d api.synthdata.studio -d www.synthdata.studio
```

**Follow the prompts:**
- Enter email: your-email@example.com
- Agree to terms: Y
- Share email: N (optional)
- Redirect HTTP to HTTPS: 2 (Yes)

Certbot will:
- Obtain SSL certificates
- Auto-configure Nginx for HTTPS
- Set up auto-renewal

### Verify auto-renewal:
```bash
sudo certbot renew --dry-run
```

**Test:** Visit `https://synthdata.studio` - should have 🔒!

---

## Step 4: Update Backend CORS Settings

### Edit docker-compose.yml on EC2:
```bash
cd ~/synth_studio_ultimate/backend
nano docker-compose.yml
```

Update the `CORS_ORIGINS` environment variable:
```yaml
services:
  backend:
    environment:
      - CORS_ORIGINS=https://synthdata.studio,https://api.synthdata.studio,https://www.synthdata.studio,http://localhost:3000
```

### Restart backend:
```bash
docker-compose down
docker-compose up -d
```

---

## Step 5: Test Your Deployment

### Test endpoints:
```bash
# Health check
curl https://synthdata.studio/health

# API docs
curl https://api.synthdata.studio/docs

# Login (should return JWT token)
curl -X POST https://api.synthdata.studio/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@synthstudio.io","password":"Demo123!"}'
```

---

## Your Live URLs

| Service | URL |
|---------|-----|
| **API Base** | https://synthdata.studio |
| **API (subdomain)** | https://api.synthdata.studio |
| **API Docs** | https://synthdata.studio/docs |
| **Health Check** | https://synthdata.studio/health |

---

## Monitoring & Maintenance

### Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check backend logs:
```bash
docker logs -f backend-backend-1
```

### SSL renewal (automatic, but manual check):
```bash
sudo certbot renew
```

### Restart services:
```bash
# Nginx
sudo systemctl restart nginx

# Backend
docker-compose restart
```

---

## Troubleshooting

### DNS not resolving?
- Wait 10-30 minutes for propagation
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo systemd-resolve --flush-caches` (Linux)

### Nginx not starting?
```bash
sudo nginx -t  # Test config
sudo systemctl status nginx
sudo journalctl -u nginx -n 50
```

### SSL certificate issues?
```bash
sudo certbot certificates  # List certificates
sudo certbot delete  # Remove and recreate
```

### 502 Bad Gateway?
- Backend container not running: `docker ps`
- Wrong port: Check docker-compose.yml
- Firewall blocking: Check Security Group

---

## Next Steps: Frontend Deployment

Once backend is live, you can deploy frontend to:
- **Vercel**: Automatic HTTPS, best for Next.js
- **Netlify**: Great for static sites
- **Same EC2**: Serve via Nginx on root domain

Point frontend to: `https://api.synthdata.studio`
