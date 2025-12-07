# Production Deployment Guide - admin.masseurmatch.com

## Overview

This guide covers deploying the admin panel to **admin.masseurmatch.com** with complete OAuth authentication, database setup, and security configuration.

## Prerequisites

- [ ] Supabase project created
- [ ] Google OAuth Client ID obtained: `350336383439-158tm3b58t4nm52f9ddjdo56eak4suce.apps.googleusercontent.com`
- [ ] Domain `admin.masseurmatch.com` configured and pointing to your hosting
- [ ] Hosting platform ready (Vercel/Netlify/etc.)

## Step 1: Database Migration

### 1.1 Run the Migration Script

Execute [MIGRATION_FIX_SCHEMA_V2.sql](./MIGRATION_FIX_SCHEMA_V2.sql) in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire contents of `docs/MIGRATION_FIX_SCHEMA_V2.sql`
3. Paste and click "Run"
4. Verify you see `✅ MIGRATION SUCCESSFUL!` in the output

### 1.2 Verify Table Structure

Run this query to confirm the `admins` table has the correct structure:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'admins'
ORDER BY ordinal_position;
```

Expected columns:
- `id` (uuid, not null)
- `user_id` (uuid, not null)
- `role` (text, not null)
- `permissions` (jsonb, nullable)
- `created_at` (timestamptz, nullable)
- `created_by` (uuid, nullable)

## Step 2: OAuth Provider Configuration

### 2.1 Configure Google OAuth in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Google" in the provider list
3. Toggle it **ON**
4. Enter your credentials:
   - **Client ID**: `350336383439-158tm3b58t4nm52f9ddjdo56eak4suce.apps.googleusercontent.com`
   - **Client Secret**: (retrieve from Google Cloud Console - see below)
5. Click "Save"

### 2.2 Get Google Client Secret

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Find the **Client Secret** field
4. Copy the secret value
5. Paste it into Supabase (step 2.1 above)

### 2.3 Configure Redirect URIs

#### In Google Cloud Console:

1. Go to your OAuth 2.0 Client ID settings
2. Under **Authorized redirect URIs**, add:
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
   ```
   Replace `[YOUR_SUPABASE_PROJECT_REF]` with your actual Supabase project reference (found in Project Settings → General → Reference ID)

#### In Supabase Dashboard:

1. Go to Authentication → URL Configuration
2. Set **Site URL** (production):
   ```
   https://admin.masseurmatch.com
   ```
3. Add **Redirect URLs** (both development and production):
   ```
   http://localhost:3000/api/auth/callback
   https://admin.masseurmatch.com/api/auth/callback
   ```

### 2.4 Optional: Enable Additional Providers

If you want Apple, Facebook, or OTP login:

- **Apple**: See [OAUTH_SETUP.md](./OAUTH_SETUP.md#apple-sign-in)
- **Facebook**: See [OAUTH_SETUP.md](./OAUTH_SETUP.md#facebook-login)
- **Email OTP**: See [OAUTH_SETUP.md](./OAUTH_SETUP.md#email-otp-magic-links)
- **Phone OTP**: See [OAUTH_SETUP.md](./OAUTH_SETUP.md#phone-otp-sms)

## Step 3: Create Your First Admin

### 3.1 Sign Up via OAuth

1. Start your local dev server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. Complete OAuth flow
5. You'll get a 403 error (expected - you're not an admin yet)

### 3.2 Get Your User UUID

In Supabase SQL Editor, run:

```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

Copy your user's `id` (UUID).

### 3.3 Create Admin Record

Replace `'your-actual-uuid-here'` with your UUID from step 3.2:

```sql
INSERT INTO public.admins (user_id, role)
VALUES ('your-actual-uuid-here', 'superadmin');
```

Verify it was created:

```sql
SELECT a.id, a.role, u.email
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id;
```

### 3.4 Test Admin Access

1. Go back to `http://localhost:3000/login`
2. Sign in with Google again
3. You should now be redirected to `/dashboard` ✅

## Step 4: Environment Variables

### 4.1 Get Supabase Credentials

1. Go to Supabase Dashboard → Project Settings → API
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon/Public Key** (anon, public)
   - **Service Role Key** (service_role, secret)

### 4.2 Set Local Environment Variables

Create `.env.local` in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Production Domain
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **NEVER commit `.env.local` to git!** It's already in `.gitignore`.

### 4.3 Set Production Environment Variables

In your hosting platform (Vercel/Netlify/etc.), set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://admin.masseurmatch.com
```

⚠️ **Keep `SUPABASE_SERVICE_ROLE_KEY` secret!** Never expose it to the client.

## Step 5: Deploy to Production

### 5.1 For Vercel:

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`
4. Set environment variables in Vercel Dashboard
5. Redeploy to apply env vars

### 5.2 For Netlify:

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Login: `netlify login`
3. Deploy: `netlify deploy --prod`
4. Set environment variables in Netlify Dashboard
5. Redeploy to apply env vars

### 5.3 For Custom Server:

1. Build: `npm run build`
2. Set environment variables on server
3. Start: `npm start`

## Step 6: Post-Deployment Verification

### 6.1 Test OAuth Flow

1. Go to `https://admin.masseurmatch.com/login`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify you're redirected to `/dashboard`
5. Check that your role is displayed correctly

### 6.2 Test Admin Functionality

1. Navigate to different admin pages (therapists, users, etc.)
2. Verify CRUD operations work
3. Check that audit logging is working:
   ```sql
   SELECT * FROM public.admin_logs ORDER BY created_at DESC LIMIT 10;
   ```

### 6.3 Test Middleware Protection

1. Sign out: Visit `https://admin.masseurmatch.com/api/auth/signout`
2. Try accessing `/dashboard` (should redirect to `/login`)
3. Sign in again (should work and redirect to `/dashboard`)

### 6.4 Test Token Refresh

1. Sign in and get access token (expires in 1 hour)
2. Wait 1 hour or manually expire the cookie
3. Navigate to a protected page
4. Verify you're not logged out (middleware auto-refreshes)

## Step 7: Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is secret (not exposed to client)
- [ ] All tables have RLS enabled with service-role-only policies
- [ ] OAuth redirect URLs are configured correctly
- [ ] Cookies are httpOnly (check in browser DevTools → Application → Cookies)
- [ ] HTTPS is enabled on production (admin.masseurmatch.com)
- [ ] CORS is configured if needed
- [ ] Environment variables are set in hosting platform
- [ ] `.env.local` is in `.gitignore`

## Step 8: Create Additional Admins

### 8.1 Invite New Admin

1. Have them sign up via OAuth at `https://admin.masseurmatch.com/login`
2. Get their UUID from `auth.users`:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'new-admin@example.com';
   ```
3. Create admin record as superadmin:
   ```sql
   INSERT INTO public.admins (user_id, role, created_by)
   VALUES (
     'new-admin-uuid',
     'manager',  -- or 'viewer'
     'your-superadmin-uuid'
   );
   ```

### 8.2 Admin Role Levels

- **superadmin**: Full access (create/edit/delete all)
- **manager**: Can approve therapists, manage users (no admin management)
- **viewer**: Read-only access (view data only)

See [DATABASE_GUIDE.md](./DATABASE_GUIDE.md#admin-roles) for detailed permissions.

## Troubleshooting

### Issue: "Access denied: User is not an admin"

**Cause**: User exists in `auth.users` but not in `admins` table.

**Fix**: Create admin record (see Step 3.3)

### Issue: OAuth redirect fails

**Cause**: Redirect URI mismatch.

**Fix**:
1. Check Supabase redirect URLs match Google Cloud Console
2. Verify Site URL in Supabase matches your domain
3. Clear browser cookies and try again

### Issue: "Invalid refresh token"

**Cause**: Refresh token expired or revoked.

**Fix**: Sign out and sign in again

### Issue: RLS policy error

**Cause**: Client trying to access database directly (should use API routes).

**Fix**:
1. Verify all database calls use `supabaseAdmin` (server-side)
2. Check RLS policies are service-role-only
3. Never use `supabaseClient` for database mutations

### Issue: Environment variables not loaded

**Cause**: `.env.local` not created or hosting platform vars not set.

**Fix**:
1. Create `.env.local` for local dev
2. Set environment variables in hosting platform dashboard
3. Restart dev server or redeploy

## Monitoring

### Check Admin Activity Logs

```sql
SELECT
  al.action_name,
  al.target_type,
  al.created_at,
  u.email as admin_email
FROM public.admin_logs al
JOIN public.admins a ON al.admin_id = a.id
JOIN auth.users u ON a.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 20;
```

### Check Active Admins

```sql
SELECT
  a.role,
  u.email,
  u.last_sign_in_at,
  a.created_at
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
ORDER BY u.last_sign_in_at DESC;
```

### Check OAuth Providers Used

```sql
SELECT
  id,
  email,
  raw_user_meta_data->>'provider' as provider,
  last_sign_in_at
FROM auth.users
ORDER BY last_sign_in_at DESC;
```

## Related Documentation

- [COMPLETE_DATABASE_SCHEMA.sql](./COMPLETE_DATABASE_SCHEMA.sql) - Full database schema
- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - Detailed OAuth configuration
- [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) - Database structure and admin roles
- [MIGRATION_FIX_SCHEMA_V2.sql](./MIGRATION_FIX_SCHEMA_V2.sql) - Database migration script

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Test OAuth flow in incognito mode
5. Review RLS policies and ensure service-role access

## Production Domain Configuration Summary

**Production URL**: `https://admin.masseurmatch.com`

**OAuth Callback URL**: `https://admin.masseurmatch.com/api/auth/callback`

**Supabase Redirect URI**: `https://[PROJECT_REF].supabase.co/auth/v1/callback`

**Google OAuth Client ID**: `350336383439-158tm3b58t4nm52f9ddjdo56eak4suce.apps.googleusercontent.com`

---

✅ **Deployment Complete!** Your admin panel is now live at [https://admin.masseurmatch.com](https://admin.masseurmatch.com)
