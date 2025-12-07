# Pre-Deployment Checklist

Complete this checklist before deploying to production.

## 📋 Code Quality

### Backend
- [ ] All tests passing (`pytest tests/ -v`)
- [ ] No print statements in production code
- [ ] No hardcoded secrets or API keys
- [ ] Error handling complete for all endpoints
- [ ] Logging configured properly
- [ ] Type hints added where applicable
- [ ] Docstrings complete for public functions
- [ ] No commented-out code blocks

### Frontend
- [ ] No console.log statements in production code
- [ ] TypeScript compilation successful (`tsc --noEmit`)
- [ ] ESLint passing (`pnpm lint`)
- [ ] No hardcoded API URLs (using environment variables)
- [ ] Error boundaries in place
- [ ] Loading states for all async operations
- [ ] Proper form validation

## 🔐 Security

### Authentication & Authorization
- [ ] JWT secret key rotated for production
- [ ] OAuth apps configured with production credentials
- [ ] OAuth redirect URIs whitelisted for production domain
- [ ] Password hashing using bcrypt
- [ ] Session timeout configured appropriately
- [ ] Admin routes protected with role checking

### API Security
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting configured for all endpoints
- [ ] Input validation on all user inputs
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection enabled
- [ ] CSRF protection for state-changing operations
- [ ] File upload validation (size, type, content)

### Environment Variables
- [ ] All `.env` files in `.gitignore`
- [ ] `.env.example` files created without secrets
- [ ] Production environment variables configured in deployment platform
- [ ] Database passwords strong and unique
- [ ] API keys rotated from development values

## 🗄️ Database

### Schema & Migrations
- [ ] All Alembic migrations applied (`alembic upgrade head`)
- [ ] Database indexes created for frequently queried fields
- [ ] Foreign key constraints properly defined
- [ ] Database backups configured

### Data
- [ ] Test data removed from production database
- [ ] Admin user created with strong password
- [ ] Default settings configured
- [ ] Database connection pooling configured

## 📦 Dependencies

### Backend
- [ ] `requirements-prod.txt` up to date
- [ ] No dev dependencies in production requirements
- [ ] All dependencies have compatible versions
- [ ] Security vulnerabilities resolved (`pip-audit`)

### Frontend
- [ ] `package.json` dependencies up to date
- [ ] No dev dependencies in production bundle
- [ ] Security vulnerabilities resolved (`pnpm audit`)
- [ ] Bundle size under 200KB (gzipped)

## ⚙️ Configuration

### Backend (.env)
- [ ] `DATABASE_URL` configured for production database
- [ ] `REDIS_URL` configured for production Redis
- [ ] `SECRET_KEY` set to random 64-character string
- [ ] `JWT_SECRET_KEY` set to random 64-character string
- [ ] `CORS_ORIGINS` set to production frontend URL
- [ ] `ENVIRONMENT` set to "production"
- [ ] `DEBUG` set to False
- [ ] `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` configured
- [ ] `S3_BUCKET_NAME` set to production bucket
- [ ] `FRONTEND_URL` set to production frontend URL
- [ ] OAuth credentials (Google, GitHub) configured
- [ ] LLM API keys configured (if using AI assistant)

### Frontend (.env.local)
- [ ] `NEXT_PUBLIC_API_BASE_URL` set to production API URL
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set to production client ID
- [ ] `NEXT_PUBLIC_GITHUB_CLIENT_ID` set to production client ID
- [ ] `NEXT_PUBLIC_ENABLE_ANALYTICS` configured as needed

## 🚀 Build & Deployment

### Backend
- [ ] `uvicorn` or `gunicorn` configured for production
- [ ] Worker count configured based on server resources
- [ ] Systemd service file created (for Linux deployment)
- [ ] Nginx reverse proxy configured with SSL
- [ ] SSL certificate installed (Let's Encrypt or commercial)
- [ ] Health check endpoint accessible (`/health`)

### Frontend
- [ ] Production build successful (`pnpm build`)
- [ ] Build size analyzed (`pnpm build:analyze`)
- [ ] Environment variables configured in deployment platform
- [ ] Custom domain configured
- [ ] SSL certificate configured
- [ ] CDN configured (if using)

## 🔍 Testing

### Functional Testing
- [ ] User registration and login working
- [ ] OAuth flows working (Google, GitHub)
- [ ] Dataset upload working
- [ ] Synthetic data generation working
- [ ] Quality evaluation working
- [ ] Admin features accessible only to admins
- [ ] API endpoints returning expected responses

### Performance Testing
- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] No N+1 query issues
- [ ] Lighthouse score > 90 (performance)

### Security Testing
- [ ] Authenticated endpoints require valid JWT
- [ ] Admin endpoints require admin role
- [ ] Invalid inputs rejected appropriately
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] CORS working correctly

## 📊 Monitoring & Logging

### Application Monitoring
- [ ] Error tracking configured (Sentry, Rollbar, etc.)
- [ ] Application performance monitoring configured
- [ ] Uptime monitoring configured
- [ ] Log aggregation configured (CloudWatch, LogDNA, etc.)

### Alerts
- [ ] Error rate alerts configured
- [ ] Response time alerts configured
- [ ] Server resource alerts configured
- [ ] Database connection alerts configured

## 🗂️ Backup & Recovery

### Database
- [ ] Automated daily backups configured
- [ ] Backup retention policy defined (e.g., 30 days)
- [ ] Backup restoration tested
- [ ] Point-in-time recovery enabled (if supported)

### Files
- [ ] S3 bucket versioning enabled
- [ ] S3 bucket lifecycle policies configured
- [ ] File upload backups configured

## 📚 Documentation

### Code Documentation
- [ ] README.md complete with setup instructions
- [ ] API documentation accessible (`/docs` endpoint)
- [ ] Architecture documented
- [ ] Deployment guide complete

### User Documentation
- [ ] User guides available
- [ ] Admin guides available
- [ ] Troubleshooting guide available
- [ ] FAQ created

### Operational Documentation
- [ ] Deployment process documented
- [ ] Backup/restore process documented
- [ ] Monitoring dashboard documented
- [ ] Incident response plan documented

## 🔐 Compliance

### Privacy & Data Protection
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] Cookie policy created (if using cookies)
- [ ] GDPR compliance verified (if applicable)
- [ ] HIPAA compliance verified (if applicable)

### Legal
- [ ] License file included
- [ ] Third-party licenses documented
- [ ] Copyright notices included

## 🌐 Domain & DNS

### Domain Configuration
- [ ] Domain purchased and configured
- [ ] DNS A/AAAA records pointing to server
- [ ] DNS CNAME records configured (if needed)
- [ ] Email DNS records configured (SPF, DKIM, DMARC)
- [ ] SSL certificate covering all subdomains

### Subdomains
- [ ] Frontend domain (e.g., app.yourdomain.com)
- [ ] API domain (e.g., api.yourdomain.com)
- [ ] Admin subdomain (if separate)

## 🎨 UI/UX

### Final UI Check
- [ ] All pages responsive on mobile
- [ ] All forms validated correctly
- [ ] Error messages user-friendly
- [ ] Success messages displayed appropriately
- [ ] Loading states visible for async actions
- [ ] Images optimized and loading fast
- [ ] Accessibility tested (keyboard navigation, screen readers)

## 🚨 Final Checks

### Critical
- [ ] No secrets committed to Git repository
- [ ] `.env` files not tracked in Git
- [ ] Production credentials different from development
- [ ] All tests passing in CI/CD pipeline
- [ ] Database migrations run successfully
- [ ] Health check endpoints returning 200 OK

### Nice to Have
- [ ] Favicon configured
- [ ] Social media preview images (Open Graph)
- [ ] Analytics configured
- [ ] Feedback mechanism in place
- [ ] Status page configured (e.g., status.yourdomain.com)

## ✅ Sign-Off

Date: ________________

Reviewed by: ________________

Approved by: ________________

Notes:
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________

---

## 🆘 Rollback Plan

If issues occur after deployment:

1. **Immediate**: Revert to previous version
2. **Database**: Restore from last backup if needed
3. **Files**: Restore from S3 versioning
4. **DNS**: Update DNS if domain changed
5. **Notify**: Inform users of downtime (if applicable)

## 📞 Post-Deployment

After successful deployment:

- [ ] Monitor error rates for 24 hours
- [ ] Check performance metrics
- [ ] Verify all integrations working
- [ ] Test critical user flows
- [ ] Announce launch (if public)

---

**Deployment Date**: ________________  
**Deployed By**: ________________  
**Production URL**: ________________
