# Quick Start Guide - MasseurMatch Admin Panel

Get your admin panel running in 5 steps.

## Production URL

**https://admin.masseurmatch.com**

## Step 1: Database Setup (5 minutes)

1. Open Supabase SQL Editor
2. Copy and paste `docs/MIGRATION_FIX_SCHEMA_V2.sql`
3. Click "Run"
4. Verify you see `✅ MIGRATION SUCCESSFUL!`

**What this does**: Creates all tables, RLS policies, triggers, and indexes.

## Step 2: Configure Google OAuth (5 minutes)

### In Supabase Dashboard:

1. Go to **Authentication → Providers**
2. Enable **Google**
3. Enter:
   - **Client ID**: `350336383439-158tm3b58t4nm52f9ddjdo56eak4suce.apps.googleusercontent.com`
   - **Client Secret**: (get from Google Cloud Console)
4. Go to **Authentication → URL Configuration**:
   - **Site URL**: `https://admin.masseurmatch.com`
   - **Redirect URLs**: Add `https://admin.masseurmatch.com/api/auth/callback`

### In Google Cloud Console:

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Copy the **Client Secret** → paste into Supabase (step 2.3 above)
4. Add **Authorized redirect URI**: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
   - Replace `[YOUR_PROJECT_REF]` with your Supabase project reference

## Step 3: Set Environment Variables (2 minutes)

### Get Supabase Credentials:

1. Go to **Project Settings → API**
2. Copy these 3 values:
   - Project URL
   - Anon public key
   - Service role key (keep secret!)

### For Local Development:

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Production:

Set the same variables in your hosting platform (Vercel/Netlify), but change:

```bash
NEXT_PUBLIC_APP_URL=https://admin.masseurmatch.com
```

## Step 4: Create Your First Admin (3 minutes)

### Local Test First:

```bash
npm install
npm run dev
```

1. Go to `http://localhost:3000/login`
2. Click "Sign in with Google"
3. Complete OAuth (you'll get 403 - expected!)

### Make Yourself Admin:

In Supabase SQL Editor:

```sql
-- Get your UUID
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;
```

Copy your UUID, then:

```sql
-- Replace 'your-uuid-here' with your actual UUID
INSERT INTO public.admins (user_id, role)
VALUES ('your-uuid-here', 'superadmin');
```

### Test Admin Access:

1. Go back to `http://localhost:3000/login`
2. Sign in with Google
3. You should now see the dashboard ✅

## Step 5: Deploy to Production (5 minutes)

### For Vercel:

```bash
vercel --prod
```

Then in Vercel Dashboard:
1. Settings → Environment Variables
2. Add all 4 variables (from Step 3)
3. Redeploy

### For Netlify:

```bash
netlify deploy --prod
```

Then in Netlify Dashboard:
1. Site Settings → Environment Variables
2. Add all 4 variables (from Step 3)
3. Redeploy

### Verify Deployment:

1. Visit `https://admin.masseurmatch.com/login`
2. Sign in with Google
3. Should redirect to dashboard ✅

## Done! 🎉

Your admin panel is now live at **https://admin.masseurmatch.com**

## Next Steps

### Add More Admins:

```sql
-- Have them sign up first, then get their UUID and run:
INSERT INTO public.admins (user_id, role, created_by)
VALUES (
  'new-admin-uuid',
  'manager',  -- or 'viewer'
  'your-superadmin-uuid'
);
```

### Admin Roles:

- **superadmin**: Full access (create/edit/delete everything)
- **manager**: Approve therapists, manage users (no admin management)
- **viewer**: Read-only access

### Optional: Enable More OAuth Providers:

- Apple Sign In
- Facebook Login
- Email OTP (Magic Links)
- Phone OTP (SMS)

See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for instructions.

## Troubleshooting

### "Access denied: User is not an admin"

You haven't created an admin record. Run Step 4 again.

### OAuth redirect fails

Check that:
1. Supabase redirect URLs include your callback URL
2. Google Cloud Console has the Supabase callback URL
3. Site URL is set correctly in Supabase

### Environment variables not working

1. Verify `.env.local` exists (local dev)
2. Verify variables are set in hosting platform (production)
3. Restart dev server or redeploy

### Still stuck?

See detailed guides:
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Full deployment guide
- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - OAuth configuration details
- [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) - Database structure and admin roles
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Complete checklist

## Support

Check Supabase logs: **Dashboard → Logs → API**

Check browser console: **DevTools → Console**

Verify RLS policies:
```sql
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

---

**Need help?** Review the detailed documentation in the `docs/` folder.
