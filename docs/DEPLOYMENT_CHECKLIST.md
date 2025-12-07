# Production Deployment Checklist - admin.masseurmatch.com

Quick reference checklist for deploying the admin panel to production.

## Pre-Deployment

### Database Setup

- [ ] **Run database migration**
  - Execute `docs/MIGRATION_FIX_SCHEMA_V2.sql` in Supabase SQL Editor
  - Verify `✅ MIGRATION SUCCESSFUL!` appears in output
  - Confirm all tables created correctly

- [ ] **Verify RLS policies**
  ```sql
  SELECT tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public';
  ```
  - All tables should have service-role-only policies

- [ ] **Create first superadmin**
  - Sign up via OAuth (local or production)
  - Get UUID from `auth.users`
  - Insert into `admins` table with `role = 'superadmin'`
  - Test login works

### OAuth Configuration

- [ ] **Google OAuth**
  - Client ID: `350336383439-158tm3b58t4nm52f9ddjdo56eak4suce.apps.googleusercontent.com`
  - Client Secret: Retrieved from Google Cloud Console
  - Enabled in Supabase Dashboard
  - Redirect URI configured: `https://[PROJECT_REF].supabase.co/auth/v1/callback`

- [ ] **Google Cloud Console**
  - Authorized redirect URIs include Supabase callback URL
  - OAuth consent screen configured
  - App published (or test users added)

- [ ] **Supabase URL Configuration**
  - Site URL: `https://admin.masseurmatch.com`
  - Redirect URLs: `https://admin.masseurmatch.com/api/auth/callback`
  - Additional redirect for localhost (dev): `http://localhost:3000/api/auth/callback`

- [ ] **Optional providers enabled** (if needed)
  - [ ] Apple Sign In
  - [ ] Facebook Login
  - [ ] Email OTP (Magic Links)
  - [ ] Phone OTP (SMS)

### Environment Variables

- [ ] **Local development** (`.env.local`)
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

- [ ] **Production hosting** (Vercel/Netlify/etc.)
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  NEXT_PUBLIC_APP_URL=https://admin.masseurmatch.com
  ```

- [ ] **Verify service role key is secret**
  - Not in `.env.example` (only placeholder)
  - Not committed to git
  - Not exposed in client-side code

## Deployment

### Build & Deploy

- [ ] **Test locally first**
  ```bash
  npm install
  npm run dev
  ```
  - OAuth login works
  - Dashboard loads
  - CRUD operations work

- [ ] **Build for production**
  ```bash
  npm run build
  ```
  - No TypeScript errors
  - No build errors
  - Check bundle size

- [ ] **Deploy to hosting**
  - Vercel: `vercel --prod`
  - Netlify: `netlify deploy --prod`
  - Or custom deployment process

- [ ] **Set environment variables on hosting platform**
  - All 4 variables set correctly
  - Service role key kept secret
  - App URL points to production domain

- [ ] **Configure custom domain**
  - DNS records point to hosting
  - SSL certificate issued
  - `admin.masseurmatch.com` resolves correctly

## Post-Deployment Verification

### Test Authentication

- [ ] **OAuth flow**
  - Visit `https://admin.masseurmatch.com/login`
  - Click "Sign in with Google"
  - Redirects to Google OAuth
  - Returns to callback URL
  - Sets httpOnly cookies
  - Redirects to `/dashboard`

- [ ] **Session persistence**
  - Close browser
  - Reopen `https://admin.masseurmatch.com/dashboard`
  - Still logged in (cookies persist)

- [ ] **Token refresh**
  - Wait 1 hour (or manually expire token)
  - Navigate to different pages
  - Middleware auto-refreshes token
  - No logout/redirect to login

- [ ] **Sign out**
  - Visit `/api/auth/signout`
  - Cookies cleared
  - Redirected to `/login`
  - Cannot access `/dashboard` anymore

### Test Admin Functionality

- [ ] **Dashboard loads**
  - No errors in browser console
  - Data displays correctly
  - User info shown in header

- [ ] **CRUD operations**
  - [ ] View therapists list
  - [ ] View users list
  - [ ] Approve/reject therapist
  - [ ] View subscriptions
  - [ ] View payments

- [ ] **Audit logging**
  ```sql
  SELECT * FROM public.admin_logs ORDER BY created_at DESC LIMIT 10;
  ```
  - Actions logged with correct admin_id
  - Timestamps accurate

- [ ] **Role-based access**
  - Superadmin sees all features
  - Manager has limited access
  - Viewer is read-only

### Test Security

- [ ] **Unauthenticated access blocked**
  - Direct URL to `/dashboard` redirects to `/login`
  - API routes return 401/403 without auth

- [ ] **Non-admin blocked**
  - User without admin record gets 403
  - Cannot access any admin pages

- [ ] **RLS policies working**
  - Client cannot directly query database
  - All mutations go through API routes
  - Service role enforced

- [ ] **httpOnly cookies**
  - Open DevTools → Application → Cookies
  - `sb-access-token` has httpOnly flag ✅
  - `sb-refresh-token` has httpOnly flag ✅
  - Tokens not accessible via JavaScript

- [ ] **HTTPS enabled**
  - `https://admin.masseurmatch.com` loads with valid SSL
  - No mixed content warnings
  - Secure cookies work

## Monitoring

### Check Logs

- [ ] **Supabase logs**
  - Dashboard → Logs → API
  - No errors in auth or database queries
  - OAuth flows complete successfully

- [ ] **Application logs**
  - Hosting platform logs (Vercel/Netlify)
  - No 500 errors
  - API routes responding

- [ ] **Browser console**
  - No JavaScript errors
  - No CORS errors
  - OAuth redirects work

### Performance

- [ ] **Page load times**
  - Dashboard loads in < 2s
  - No slow queries
  - Images optimized

- [ ] **Database indexes**
  ```sql
  SELECT tablename, indexname
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename;
  ```
  - All critical indexes created
  - Foreign keys indexed

## Ongoing Maintenance

### Add New Admins

- [ ] **Process documented**
  1. User signs up via OAuth
  2. Get UUID from `auth.users`
  3. Insert into `admins` with appropriate role
  4. User can now access admin panel

### Backup Strategy

- [ ] **Supabase automatic backups enabled**
  - Point-in-time recovery configured
  - Backup retention policy set

- [ ] **Database snapshots**
  - Regular snapshots scheduled
  - Tested restore process

### Update Procedures

- [ ] **Code updates**
  - Test locally first
  - Deploy to staging (if available)
  - Deploy to production
  - Monitor for errors

- [ ] **Schema updates**
  - Write migration script
  - Test on copy of production DB
  - Run during low-traffic period
  - Verify migration success

## Troubleshooting Reference

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Access denied: User is not an admin" | No admin record | Create admin in `admins` table |
| OAuth redirect fails | Redirect URI mismatch | Check Supabase + Google Console URLs |
| "Invalid refresh token" | Token expired/revoked | Sign out and sign in again |
| RLS policy error | Client accessing DB directly | Use API routes only |
| 500 error on API routes | Service role key not set | Set env var in hosting platform |
| Cookies not set | httpOnly not supported | Check HTTPS enabled |

### Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **OAuth Setup Guide**: `docs/OAUTH_SETUP.md`
- **Database Guide**: `docs/DATABASE_GUIDE.md`
- **Full Deployment Guide**: `docs/PRODUCTION_DEPLOYMENT.md`

## Sign-Off

- [ ] **All checklist items completed**
- [ ] **Production tested and verified**
- [ ] **Monitoring in place**
- [ ] **Team trained on admin access**
- [ ] **Documentation updated**

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Production URL**: https://admin.masseurmatch.com

**Supabase Project**: _____________

**Status**: ✅ LIVE
