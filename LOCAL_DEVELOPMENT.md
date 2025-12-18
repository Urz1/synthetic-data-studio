# Local Development Setup

## Quick Start - No More Hardcoded URLs! 🎉

All URLs are now environment-based. Just set `NEXT_PUBLIC_API_URL` and you're good to go!

---

## Frontend Setup

### 1. Create Environment File

```bash
cd frontend
cp .env.local.example .env.local
```

### 2. Configure `.env.local`

```bash
# For local development
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

### 3. Install & Run

```bash
pnpm install
pnpm dev
```

Frontend runs at: **http://localhost:3000**

---

## Backend Setup

### 1. Create Environment File

```bash
cd backend
cp .env.example .env
```

### 2. Configure `.env`

```bash
# Core
DEBUG=true
SECRET_KEY=local-dev-secret-key

# Database (use local PostgreSQL or Neon)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/synthdata_dev

# CORS - Allow frontend
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# OAuth (optional for local dev)
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback

# Redis (optional)
REDIS_URL=redis://localhost:6379/0
```

### 3. Install & Run

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**

---

## Environment Variable Hierarchy

### Frontend (Next.js)

1. `.env.local` - Local development (highest priority, not committed)
2. `.env.production` - Production (Vercel)
3. **Default in code:** `http://localhost:8000`

### Backend (FastAPI)

1. `.env` - Current environment (not committed)
2. `.env.production` - Production template
3. **Default in code:** `http://localhost:3000` for frontend

---

## Switching Between Environments

### Local Development

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (.env):**
```bash
FRONTEND_URL=http://localhost:3000
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
```

### Production

**Frontend (.env.production):**
```bash
NEXT_PUBLIC_API_URL=https://api.synthdata.studio
```

**Backend (.env.production):**
```bash
FRONTEND_URL=https://www.synthdata.studio
GOOGLE_REDIRECT_URI=https://api.synthdata.studio/auth/google/callback
GITHUB_REDIRECT_URI=https://api.synthdata.studio/auth/github/callback
ALLOWED_ORIGINS=https://www.synthdata.studio,https://synthdata.studio,https://api.synthdata.studio
```

---

## Testing URL Configuration

### Check Frontend API URL

```bash
cd frontend
pnpm dev
# Open browser console on http://localhost:3000
# Check network tab - all API calls should go to http://localhost:8000
```

### Check Backend CORS

```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy",...}
```

### Test OAuth Flow

1. Frontend: Click "Login with Google/GitHub"
2. Should redirect to: `http://localhost:8000/auth/google` (not production URL!)
3. After OAuth: Redirects back to `http://localhost:3000/auth/google/callback`

---

## Common Issues

### Issue: Frontend still calls production API

**Solution:**
```bash
# Delete .next cache
cd frontend
rm -rf .next
pnpm dev
```

### Issue: Backend CORS error

**Solution:** Check `ALLOWED_ORIGINS` in backend `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

### Issue: OAuth redirect to production

**Solution:** Check OAuth redirect URIs in backend `.env`:
```bash
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
```

Also update in OAuth provider settings:
- **Google Cloud Console:** Add `http://localhost:8000/auth/google/callback`
- **GitHub Settings:** Add `http://localhost:8000/auth/github/callback`

---

## No More Hardcoded URLs! ✅

**Before:**
```typescript
// ❌ Hardcoded - can't change without code edit
window.location.href = 'https://api.synthdata.studio/auth/google'
```

**After:**
```typescript
// ✅ Environment-based - just change .env.local
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
window.location.href = `${apiUrl}/auth/google`;
```

**Single Change to Switch Environments:**

Just edit one file:
- Frontend: `frontend/.env.local` → Change `NEXT_PUBLIC_API_URL`
- Backend: `backend/.env` → Change `FRONTEND_URL`, `GOOGLE_REDIRECT_URI`, etc.

That's it! No code changes needed. 🎉

---

## Database Setup (Optional)

### Option 1: Use Neon (Recommended for Dev)

Just use the same Neon database URL from production (read-only or dev instance)

### Option 2: Local PostgreSQL

```bash
# Install PostgreSQL
# Ubuntu: sudo apt install postgresql
# Mac: brew install postgresql
# Windows: Download from postgresql.org

# Create database
createdb synthdata_dev

# Update .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/synthdata_dev

# Run migrations
cd backend
alembic upgrade head
```

---

## Quick Test Checklist

- [ ] Frontend runs on http://localhost:3000
- [ ] Backend runs on http://localhost:8000
- [ ] API calls go to localhost (check Network tab)
- [ ] OAuth redirects to localhost (not production)
- [ ] CORS allows localhost origins
- [ ] Database connection works
- [ ] File uploads work (local or S3)

---

**That's it! No more pain switching between local and production. Just change environment variables!** 🚀
