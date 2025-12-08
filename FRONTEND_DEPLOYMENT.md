# Frontend Deployment Checklist

## ✅ Pre-Deployment Validation Complete

### Environment Configuration
- ✅ `.env.local` configured with production backend URL
- ✅ `.env.production` created for production builds
- ✅ No hardcoded localhost URLs in code
- ✅ API client uses environment variable with fallback

### OAuth Configuration
- ✅ OAuth callbacks extract token from URL params
- ✅ Token storage key consistent (`token` in localStorage)
- ✅ Debug logging added for troubleshooting
- ✅ Supports both local and production environments

### Code Quality
- ✅ TypeScript build errors ignored (existing setting)
- ✅ Console logs removed in production (next.config.mjs)
- ✅ React Strict Mode disabled (prevents duplicate API calls)
- ✅ API request deduplication implemented

### Performance Optimizations
- ✅ Image optimization enabled (AVIF, WebP)
- ✅ CSS optimization enabled
- ✅ Package imports optimized (lucide-react, radix-ui, recharts)
- ✅ Static asset caching configured (1 year)

---

## 🚀 Deployment Steps

### 1. Backend Environment Variables (AWS)
Update your AWS backend `.env` with:
```bash
# When frontend is deployed, update these:
FRONTEND_URL=https://your-frontend-domain.com
GOOGLE_REDIRECT_URI=https://your-frontend-domain.com/auth/google/callback
GITHUB_REDIRECT_URI=https://your-frontend-domain.com/auth/github/callback
```

### 2. Google Cloud Console
Add authorized redirect URI:
- Go to: https://console.cloud.google.com/apis/credentials
- OAuth 2.0 Client ID: `954300785774-h2ursiol6h4bnfls6akq61nf5vpdnjp4`
- Add: `https://your-frontend-domain.com/auth/google/callback`
- Keep existing: `http://localhost:3000/auth/google/callback`

### 3. GitHub OAuth App
Add authorized callback URL:
- Go to: https://github.com/settings/developers
- Update **Authorization callback URL**:
  - `https://your-frontend-domain.com/auth/github/callback`
  - Keep existing: `http://localhost:3000/auth/github/callback`

### 4. Build Frontend
```bash
cd frontend
pnpm install
pnpm build
```

### 5. Test Build Locally
```bash
pnpm start
# Visit http://localhost:3000
# Test login and OAuth flows
```

### 6. Deploy to Hosting Platform

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Set environment variable in Vercel dashboard:
NEXT_PUBLIC_API_URL=https://synthdata.studio
```

#### Option B: AWS Amplify
1. Connect GitHub repository
2. Set build settings:
   - Build command: `pnpm build`
   - Output directory: `.next`
3. Add environment variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://synthdata.studio`

#### Option C: Netlify
1. Connect GitHub repository
2. Build settings:
   - Build command: `pnpm build && pnpm export`
   - Publish directory: `out`
3. Environment variables:
   - `NEXT_PUBLIC_API_URL=https://synthdata.studio`

---

## 🔧 Post-Deployment Configuration

### After frontend is deployed at `https://your-domain.com`:

1. **Update AWS Backend `.env`:**
   ```bash
   FRONTEND_URL=https://your-domain.com
   GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
   GITHUB_REDIRECT_URI=https://your-domain.com/auth/github/callback
   ALLOWED_ORIGINS=https://your-domain.com
   ```

2. **Redeploy Backend** with updated environment variables

3. **Test OAuth Flow:**
   - Visit `https://your-domain.com/login`
   - Click "Sign in with Google"
   - Should redirect to dashboard after authentication

---

## 🐛 Troubleshooting

### OAuth redirect_uri_mismatch error
- Verify `GOOGLE_REDIRECT_URI` in AWS backend matches Google Cloud Console
- Check browser console for the actual redirect URI being used

### Token not found after OAuth
- Check browser console for debug logs: `[OAuth Callback]`
- Verify backend `FRONTEND_URL` is correct
- Check Network tab for the redirect from backend to frontend

### API calls failing
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in backend (`ALLOWED_ORIGINS`)
- Inspect Network tab for 404/500 errors

---

## 📋 Current Configuration

### Frontend
- **API URL:** `https://synthdata.studio`
- **Token Storage:** `localStorage.getItem("token")`
- **User Storage:** `localStorage.getItem("user")`

### Backend (AWS)
- **URL:** `https://synthdata.studio`
- **Frontend URL:** Currently set to `http://localhost:3000`
- **OAuth Redirects:** Currently pointing to localhost

### OAuth Providers
- **Google Client ID:** `954300785774-h2ursiol6h4bnfls6akq61nf5vpdnjp4`
- **GitHub Client ID:** `Ov23liyVH5XITWZECH9x`

---

## ✨ Ready for Deployment!

Your frontend is ready to deploy. Follow the steps above and update the backend environment variables after deployment.

**Recommended Deployment Platform:** Vercel (best Next.js support, automatic HTTPS, easy rollbacks)
