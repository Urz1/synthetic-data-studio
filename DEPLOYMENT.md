# Deployment Guide - Synth Studio

Complete deployment guide for production deployment of Synth Studio (frontend + backend).

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Frontend Deployment](#frontend-deployment)
- [Backend Deployment](#backend-deployment)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)

## 🎯 Prerequisites

### Required Services
- **Domain**: Custom domain with DNS access
- **PostgreSQL**: Database (RDS, Supabase, or managed service)
- **Redis**: Cache/queue (ElastiCache, Upstash, or managed service)
- **S3/Storage**: File storage (AWS S3, DigitalOcean Spaces, etc.)
- **OAuth Apps**: Google & GitHub OAuth applications

### Required Tools
- Node.js 18+ (frontend)
- Python 3.9+ (backend)
- Docker (optional, for containerized deployment)
- Git

## 🔐 Environment Configuration

### Frontend (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com

# OAuth Providers
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_production_google_client_id
NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=true
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_production_github_client_id

# Analytics (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/synthstudio
POSTGRES_USER=synthstudio_user
POSTGRES_PASSWORD=strong_password_here
POSTGRES_DB=synthstudio

# Redis
REDIS_URL=redis://host:6379/0

# Security
SECRET_KEY=generate_64_char_random_string_here
JWT_SECRET_KEY=generate_another_64_char_random_string
CORS_ORIGINS=["https://yourdomain.com"]

# OAuth
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_secret
GITHUB_CLIENT_ID=your_production_github_client_id
GITHUB_CLIENT_SECRET=your_production_github_secret

# OAuth Redirect URIs
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/v1/auth/google/callback
GITHUB_REDIRECT_URI=https://api.yourdomain.com/api/v1/auth/github/callback
FRONTEND_URL=https://yourdomain.com

# Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=synthstudio-uploads

# LLM (Optional)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# Application
ENVIRONMENT=production
DEBUG=false
```

## 🚀 Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
# Project Settings → Environment Variables
```

#### Vercel Environment Variables
Add all variables from `.env.local` in the Vercel dashboard.

#### Vercel Configuration
The `vercel.json` is already configured at the root level.

### Option 2: Docker + Cloud Provider

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build and deploy
docker build -t synthstudio-frontend .
docker push your-registry/synthstudio-frontend

# Deploy to your cloud provider (AWS ECS, GCP Cloud Run, etc.)
```

### Option 3: Static Export + CDN

```bash
# Build static export
cd frontend
pnpm build
pnpm export

# Deploy ./out directory to:
# - Netlify
# - AWS S3 + CloudFront
# - Cloudflare Pages
# - GitHub Pages
```

## 🔧 Backend Deployment

### Option 1: AWS EC2 / DigitalOcean / Linode

```bash
# 1. Connect to server
ssh user@your-server-ip

# 2. Install dependencies
sudo apt update
sudo apt install python3.9 python3-pip postgresql-client redis-tools nginx

# 3. Clone repository
git clone https://github.com/Urz1/synthetic-data-studio.git
cd synthetic-data-studio/backend

# 4. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 5. Install requirements
pip install -r requirements-prod.txt

# 6. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 7. Run migrations
alembic upgrade head

# 8. Create systemd service
sudo nano /etc/systemd/system/synthstudio-api.service
```

**systemd service file:**

```ini
[Unit]
Description=Synth Studio API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/synthetic-data-studio/backend
Environment="PATH=/home/ubuntu/synthetic-data-studio/backend/venv/bin"
ExecStart=/home/ubuntu/synthetic-data-studio/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# 9. Start service
sudo systemctl daemon-reload
sudo systemctl enable synthstudio-api
sudo systemctl start synthstudio-api

# 10. Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/synthstudio
```

**Nginx configuration:**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 11. Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/synthstudio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 12. Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Option 2: Docker + Cloud Provider

```dockerfile
# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

# Copy application
COPY . .

# Run migrations and start server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

```bash
# Build and deploy
docker build -t synthstudio-backend .
docker push your-registry/synthstudio-backend

# Deploy to AWS ECS, GCP Cloud Run, etc.
```

### Option 3: Platform as a Service (Railway, Render, Fly.io)

Most PaaS providers auto-detect the Dockerfile and deploy automatically:

1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push to main branch

## 🗄️ Database Setup

### PostgreSQL Database

```sql
-- Create database and user
CREATE DATABASE synthstudio;
CREATE USER synthstudio_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE synthstudio TO synthstudio_user;

-- Connect and run migrations
psql -h your-db-host -U synthstudio_user -d synthstudio

-- Backend will run migrations automatically via Alembic
-- Or manually: alembic upgrade head
```

### Redis Cache

If using managed Redis (ElastiCache, Upstash, Redis Cloud):
1. Create instance
2. Get connection URL
3. Add to `REDIS_URL` in backend `.env`

## 🔐 OAuth Configuration

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Authorized redirect URIs:
   - `https://yourdomain.com/auth/google/callback`
   - `https://api.yourdomain.com/api/v1/auth/google/callback`
5. Copy Client ID and Secret to environment variables

### GitHub OAuth

1. Go to [GitHub Settings → Developer Settings](https://github.com/settings/developers)
2. New OAuth App
3. Callback URLs:
   - `https://yourdomain.com/auth/github/callback`
   - `https://api.yourdomain.com/api/v1/auth/github/callback`
4. Copy Client ID and Secret to environment variables

## ✅ Post-Deployment Checklist

### Frontend
- [ ] Domain DNS configured correctly
- [ ] SSL certificate active (HTTPS)
- [ ] Environment variables set
- [ ] OAuth redirect URIs whitelisted
- [ ] Lighthouse score > 90
- [ ] Mobile responsiveness verified
- [ ] Error tracking configured (Sentry, optional)

### Backend
- [ ] API accessible at https://api.yourdomain.com
- [ ] Database migrations applied
- [ ] Redis connection working
- [ ] S3 bucket permissions configured
- [ ] OAuth callbacks working
- [ ] API documentation accessible: `/docs`
- [ ] Health check passing: `/health`
- [ ] Admin user created

### Security
- [ ] All secrets rotated for production
- [ ] CORS origins restricted
- [ ] Rate limiting configured
- [ ] SQL injection protection enabled
- [ ] Input validation active
- [ ] Logs configured (CloudWatch, LogDNA, etc.)

## 🔍 Testing Production

```bash
# Test API health
curl https://api.yourdomain.com/health

# Test OAuth (should redirect)
curl https://api.yourdomain.com/api/v1/auth/google/authorize

# Test frontend
curl -I https://yourdomain.com

# Run backend tests
cd backend
pytest tests/

# Load testing
# Use tools like Apache Bench, k6, or Locust
```

## 📊 Monitoring & Maintenance

### Application Monitoring

**Backend:**
```python
# Add monitoring middleware
from prometheus_fastapi_instrumentator import Instrumentator

@app.on_event("startup")
async def startup():
    Instrumentator().instrument(app).expose(app)
```

**Frontend:**
- Use Vercel Analytics (built-in)
- Or add Google Analytics, Plausible, etc.

### Log Aggregation

**Options:**
- AWS CloudWatch
- Datadog
- LogDNA
- Better Stack

### Backup Strategy

```bash
# Daily PostgreSQL backups
pg_dump -h your-db-host -U synthstudio_user synthstudio > backup_$(date +%Y%m%d).sql

# Automated with cron
0 2 * * * /path/to/backup_script.sh
```

### Update Strategy

```bash
# Backend updates
cd backend
git pull origin main
source venv/bin/activate
pip install -r requirements-prod.txt
alembic upgrade head
sudo systemctl restart synthstudio-api

# Frontend updates (Vercel auto-deploys on git push)
# Or for manual:
cd frontend
git pull origin main
pnpm install
pnpm build
# Restart your hosting service
```

## 🆘 Troubleshooting

### Common Issues

**502 Bad Gateway (Nginx)**
```bash
# Check backend service status
sudo systemctl status synthstudio-api

# Check logs
sudo journalctl -u synthstudio-api -f
```

**Database Connection Failed**
```bash
# Test connection
psql -h your-db-host -U synthstudio_user -d synthstudio

# Check DATABASE_URL format
# postgresql://user:password@host:5432/database
```

**OAuth Not Working**
- Verify redirect URIs match exactly (including https://)
- Check OAuth credentials are production keys
- Ensure FRONTEND_URL is set correctly in backend

**CORS Errors**
- Add frontend domain to CORS_ORIGINS in backend .env
- Format: `CORS_ORIGINS=["https://yourdomain.com"]`

## 📞 Support & Contact

For deployment issues:
- Check [Backend README](../backend/README.md)
- Check [Frontend README](../frontend/README.md)
- Open issue on GitHub

### Developer Contact

**Sadam Husen**

- **Email**: halisadam391@gmail.com
- **LinkedIn**: [linkedin.com/in/sadam-husen-16s](https://www.linkedin.com/in/sadam-husen-16s/)
- **GitHub**: [github.com/Urz1](https://github.com/Urz1)

For deployment assistance, technical support, or questions about the deployment process, please contact via email.

---

**Last Updated**: December 2025
