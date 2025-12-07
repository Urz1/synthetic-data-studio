# Quick Reference Guide

Quick commands and common operations for Synth Studio development and deployment.

## 🚀 Quick Start Commands

### Backend

```bash
# Setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Database
alembic upgrade head  # Run migrations
alembic revision --autogenerate -m "Description"  # Create migration

# Run
uvicorn app.main:app --reload  # Development
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4  # Production

# Testing
pytest tests/ -v  # All tests
pytest tests/unit/ -v  # Unit tests only
pytest tests/integration/ -v  # Integration tests only
pytest --cov=app tests/  # With coverage
```

### Frontend

```bash
# Setup
cd frontend
pnpm install
cp .env.local.example .env.local

# Run
pnpm dev  # Development
pnpm build  # Production build
pnpm start  # Production server
pnpm lint  # Lint code

# Clean
rm -rf .next  # Clear Next.js cache
pnpm install --force  # Reinstall dependencies
```

## 🔍 Common Development Tasks

### Create New User

```bash
# Via backend script
cd backend
python scripts/create_user.py --email admin@example.com --password yourpassword --role admin
```

### Reset Database

```bash
cd backend
alembic downgrade base  # Remove all migrations
rm -rf alembic/versions/*.py  # Remove migration files (if needed)
alembic revision --autogenerate -m "Initial migration"  # Recreate
alembic upgrade head  # Apply
```

### Clear Uploads

```bash
# Keep directory structure
cd backend/uploads
find . -type f -name "*.csv" -delete
```

### Update Dependencies

```bash
# Backend
cd backend
pip list --outdated  # Check outdated
pip install --upgrade package-name  # Upgrade specific
pip freeze > requirements.txt  # Update file

# Frontend
cd frontend
pnpm outdated  # Check outdated
pnpm update package-name  # Upgrade specific
pnpm update  # Update all
```

## 🐛 Troubleshooting

### Backend Issues

```bash
# Check logs
tail -f app.log

# Database connection test
psql -h localhost -U synthstudio_user -d synthstudio

# Redis connection test
redis-cli ping

# Check running processes
ps aux | grep uvicorn
```

### Frontend Issues

```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm dev

# Check for port conflicts
netstat -ano | findstr :3000  # Windows
lsof -i :3000  # Linux/Mac

# Turbopack issues (use webpack)
pnpm dev --webpack
```

## 📦 Deployment Commands

### Backend Deployment

```bash
# Pull latest code
git pull origin main

# Update dependencies
pip install -r requirements-prod.txt

# Run migrations
alembic upgrade head

# Restart service
sudo systemctl restart synthstudio-api  # Linux systemd
pm2 restart synthstudio-api  # PM2

# Check status
sudo systemctl status synthstudio-api
```

### Frontend Deployment (Vercel)

```bash
# Deploy via CLI
vercel --prod

# Or via Git
git push origin main  # Auto-deploys if connected
```

## 🔐 Security Commands

### Generate Secret Keys

```bash
# Python (for JWT secrets)
python -c "import secrets; print(secrets.token_urlsafe(64))"

# OpenSSL (alternative)
openssl rand -hex 32
```

### Check for Secrets in Code

```bash
# Search for potential secrets
grep -r "sk-" .  # OpenAI keys
grep -r "AIza" .  # Google API keys
grep -r "password.*=" .  # Hardcoded passwords
git log --all -- '*secret*' '*key*' '*.env'  # Git history
```

## 📊 Monitoring Commands

### Check Application Health

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000

# Database health
psql -h localhost -U synthstudio_user -d synthstudio -c "SELECT 1"

# Redis health
redis-cli ping
```

### View Logs

```bash
# Backend logs (systemd)
sudo journalctl -u synthstudio-api -f

# Frontend logs (Vercel)
vercel logs

# Docker logs
docker logs synthstudio-backend -f
docker logs synthstudio-frontend -f
```

## 🧪 Testing Commands

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8000/api/v1/datasets

# Using k6
k6 run loadtest.js
```

### Security Testing

```bash
# Check for vulnerabilities
cd backend
pip-audit  # Python packages

cd frontend
pnpm audit  # Node packages
pnpm audit fix  # Auto-fix
```

## 📈 Performance Commands

### Backend Performance

```bash
# Profile Python code
python -m cProfile -o profile.stats app/main.py
python -c "import pstats; p = pstats.Stats('profile.stats'); p.sort_stats('cumulative'); p.print_stats(20)"

# Check database query performance
psql -c "EXPLAIN ANALYZE SELECT * FROM datasets LIMIT 100"
```

### Frontend Performance

```bash
# Bundle analysis
cd frontend
pnpm build:analyze

# Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Check bundle size
ls -lh .next/static/chunks/*.js
```

## 🔄 Database Operations

### Backup

```bash
# Create backup
pg_dump -h localhost -U synthstudio_user synthstudio > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U synthstudio_user synthstudio < backup_20231207.sql
```

### Common Queries

```sql
-- Count users
SELECT COUNT(*) FROM users;

-- Count datasets
SELECT COUNT(*) FROM datasets;

-- Recent generators
SELECT * FROM generators ORDER BY created_at DESC LIMIT 10;

-- Check job status
SELECT status, COUNT(*) FROM jobs GROUP BY status;
```

## 🐳 Docker Commands

### Development

```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Remove volumes
docker-compose down -v
```

### Production

```bash
# Build image
docker build -t synthstudio-backend:latest backend/
docker build -t synthstudio-frontend:latest frontend/

# Push to registry
docker tag synthstudio-backend:latest your-registry/synthstudio-backend:latest
docker push your-registry/synthstudio-backend:latest

# Run container
docker run -d -p 8000:8000 --env-file .env synthstudio-backend:latest
```

## 📱 OAuth Setup

### Google OAuth

1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `https://yourdomain.com/auth/google/callback`
4. Copy Client ID and Secret to `.env`

### GitHub OAuth

1. Go to https://github.com/settings/developers
2. New OAuth App
3. Add callback URL: `https://yourdomain.com/auth/github/callback`
4. Copy Client ID and Secret to `.env`

## 🛠️ Maintenance Tasks

### Weekly

```bash
# Update dependencies
cd backend && pip install --upgrade pip && pip list --outdated
cd frontend && pnpm outdated

# Check logs for errors
grep -i "error" app.log | tail -n 50

# Backup database
./scripts/backup.sh
```

### Monthly

```bash
# Security audit
pip-audit
pnpm audit

# Performance check
./scripts/test-performance.sh

# Clean old uploads
find backend/uploads -type f -mtime +30 -delete

# Rotate logs
logrotate /etc/logrotate.d/synthstudio
```

## 📞 Emergency Procedures

### Service Down

```bash
# Check status
sudo systemctl status synthstudio-api

# Restart
sudo systemctl restart synthstudio-api

# Check logs
sudo journalctl -u synthstudio-api -n 100
```

### Database Issues

```bash
# Check connections
SELECT count(*) FROM pg_stat_activity;

# Kill stuck queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Rollback Deployment

```bash
# Backend
git checkout <previous-commit-hash>
sudo systemctl restart synthstudio-api

# Frontend (Vercel)
vercel rollback
```

## 📚 Useful Links

- **Backend API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Dashboard**: https://vercel.com/dashboard

## 🔑 Environment Variables Quick Reference

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/synthstudio
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-64-char-secret
JWT_SECRET_KEY=your-64-char-jwt-secret
CORS_ORIGINS=["http://localhost:3000"]
ENVIRONMENT=development
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
```

---

## 👤 Developer Contact

**Sadam Husen**

- **Email**: halisadam391@gmail.com
- **LinkedIn**: [linkedin.com/in/sadam-husen-16s](https://www.linkedin.com/in/sadam-husen-16s/)
- **GitHub**: [github.com/Urz1](https://github.com/Urz1)

For questions or support, please reach out via email or GitHub.

---

**Keep this file bookmarked for quick reference during development and deployment!**
