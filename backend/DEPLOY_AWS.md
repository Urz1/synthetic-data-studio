# AWS Educate Deployment Guide

Deploy Synthetic Data Studio backend on AWS Educate EC2.

## 📋 Prerequisites

- AWS Educate account with lab access
- Your Neon PostgreSQL connection string
- Your S3 bucket already configured

## 🚀 Quick Deploy (5 Steps)

### Step 1: Launch EC2 Instance

1. Go to AWS Educate → Start Lab
2. Open AWS Console → EC2 → Launch Instance
3. Configure:
   - **Name**: `synth-studio-backend`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance type**: `t3.small` (2GB RAM - free tier eligible)
   - **Key pair**: Create new or use existing
   - **Security Group**: Allow ports 22, 8000 (or all traffic for testing)

### Step 2: Connect & Install Docker

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip
ssh -i Studio_Synth.pem ubuntu@13.61.186.228
# ssh -i C:\Users\abdux\.ssh\Studio_Synth.pem ubuntu@13.61.186.228
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for docker group
exit
```

### Step 3: Clone & Configure

```bash
# SSH back in
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Clone repository
git clone https://github.com/Urz1/synthetic-data-studio.git
cd synthetic-data-studio/backend

# Create .env file
cp .env.production .env
nano .env  # Edit with your actual values
```

**Required .env values:**
```env
SECRET_KEY=<generate with: python3 -c "import secrets; print(secrets.token_urlsafe(32)">
DATABASE_URL=postgresql://neondb_owner:YOUR_PASS@YOUR_NEON_HOST/neondb?sslmode=require
AWS_S3_BUCKET=synth-studio-data
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

### Step 4: Deploy

```bash
# Build and start services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### Step 5: Verify

```bash
# Test health endpoint
curl http://localhost:8000/health

# Should return: {"status":"healthy","service":"synth-studio-backend"}
```

Access API docs: `http://your-ec2-public-ip:8000/docs`

---

## 🔧 Management Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop all
docker-compose down

# Update deployment
git pull
docker-compose up -d --build

# Check resource usage
docker stats
```

## 🛡️ Security Notes

1. **Security Group**: Only allow required ports (22, 8000)
2. **SECRET_KEY**: Generate a strong unique key
3. **Database**: Neon has SSL enabled by default
4. **S3**: Use IAM with minimal permissions

## ⚠️ AWS Educate Limitations

- Labs expire after ~4 hours (data persists if using EBS)
- Limited instance types available
- Some services may be restricted
- Credits are limited

## 🔄 Persistence Tips

Since AWS Educate labs can expire:

1. **Database**: Using Neon (external) - ✅ persists
2. **Files**: Using S3 (your account) - ✅ persists
3. **Code**: On GitHub - ✅ persists
4. **Redis cache**: Will reset on lab restart - acceptable

## 📊 Resource Requirements (t3.small - 2GB RAM)

| Service | Memory | Notes |
|---------|--------|-------|
| Backend | ~400 MB | FastAPI + uvicorn |
| Celery | ~500 MB | 1 worker (limited) |
| Redis | ~50 MB | Minimal cache |
| System | ~300 MB | Ubuntu overhead |
| **Total** | **~1.3 GB** | Fits in 2GB |

⚠️ **Note**: With t3.small, ML training (DP-CTGAN/TVAE) may be slow. Consider upgrading for heavy workloads.

---

## 🐛 Troubleshooting

### Container won't start
```bash
docker-compose logs backend
# Check for missing env vars or connection issues
```

### Database connection failed
```bash
# Test Neon connection
docker-compose exec backend python -c "from app.database.database import engine; print(engine.connect())"
```

### Port 8000 not accessible
```bash
# Check security group allows inbound on port 8000
# Check container is running
docker-compose ps
```

### Out of memory
```bash
# Reduce Celery workers
# Edit docker-compose.yml: --concurrency=1
docker-compose up -d
```
