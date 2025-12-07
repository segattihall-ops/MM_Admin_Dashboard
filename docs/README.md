# Documentation - MasseurMatch Admin Panel

Complete documentation for setting up and deploying the admin panel to **admin.masseurmatch.com**.

## Quick Links

- **🚀 [Quick Start Guide](./QUICK_START.md)** - Get started in 5 steps (20 minutes)
- **✅ [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step production deployment checklist
- **📦 [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)** - Comprehensive deployment documentation

## Documentation Index

### Getting Started

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [QUICK_START.md](./QUICK_START.md) | Fast setup guide (5 steps) | First time setup |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Production deployment checklist | Before/during deployment |
| [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) | Detailed deployment guide | Reference during deployment |

### Database

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [COMPLETE_DATABASE_SCHEMA.sql](./COMPLETE_DATABASE_SCHEMA.sql) | Full production database schema | New database setup |
| [MIGRATION_FIX_SCHEMA_V2.sql](./MIGRATION_FIX_SCHEMA_V2.sql) | Fix incomplete/broken schema | Migrating existing database |
| [MIGRATION_FIX_SCHEMA.sql](./MIGRATION_FIX_SCHEMA.sql) | Legacy migration (use V2 instead) | - |
| [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) | Database structure documentation | Understanding the schema |
| [supabase-rpcs.sql](./supabase-rpcs.sql) | RPC functions | Additional database functions |

### Authentication

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [OAUTH_SETUP.md](./OAUTH_SETUP.md) | OAuth provider configuration | Setting up Google/Apple/Facebook login |

## Setup Flow

### For New Projects:

```
1. QUICK_START.md (follow all 5 steps)
   ↓
2. Run MIGRATION_FIX_SCHEMA_V2.sql OR COMPLETE_DATABASE_SCHEMA.sql
   ↓
3. Configure OAuth (OAUTH_SETUP.md)
   ↓
4. Deploy (PRODUCTION_DEPLOYMENT.md)
   ↓
5. Verify (DEPLOYMENT_CHECKLIST.md)
```

### For Existing Projects with Broken Schema:

```
1. Run MIGRATION_FIX_SCHEMA_V2.sql
   ↓
2. Verify migration success
   ↓
3. Create first admin
   ↓
4. Test locally
   ↓
5. Deploy to production
```

## Key Information

### Production Configuration

- **Domain**: https://admin.masseurmatch.com
- **OAuth Callback**: https://admin.masseurmatch.com/api/auth/callback
- **Google Client ID**: `350336383439-158tm3b58t4nm52f9ddjdo56eak4suce.apps.googleusercontent.com`

### Environment Variables

Required for both development and production:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://admin.masseurmatch.com  # or http://localhost:3000 for dev
```

See [../.env.example](../.env.example) for template.

### Admin Role Levels

- **superadmin**: Full access (create/edit/delete everything including admins)
- **manager**: Approve therapists, manage users (no admin management)
- **viewer**: Read-only access (view data only)

### Database Tables

- `auth.users` - User accounts (managed by Supabase Auth)
- `public.profiles` - User profiles (auto-created on signup)
- `public.admins` - Admin users with roles
- `public.therapists` - Therapist accounts
- `public.verification_data` - Therapist verification documents
- `public.payments` - Payment records
- `public.subscriptions` - Subscription records
- `public.therapists_edit` - Pending therapist edits
- `public.profile_edits` - Pending profile edits
- `public.applications` - Therapist applications
- `public.legal_acceptances` - Terms of service acceptances
- `public.admin_logs` - Audit log of admin actions
- `public.settings` - Application settings

### OAuth Providers Supported

- ✅ Google (configured)
- ⚪ Apple (optional)
- ⚪ Facebook (optional)
- ⚪ Email OTP / Magic Links (optional)
- ⚪ Phone OTP / SMS (optional)

## Common Tasks

### Create a New Admin

```sql
-- 1. Get user UUID from auth.users
SELECT id, email FROM auth.users WHERE email = 'new-admin@example.com';

-- 2. Insert admin record
INSERT INTO public.admins (user_id, role, created_by)
VALUES ('user-uuid', 'manager', 'your-superadmin-uuid');
```

### Check Admin Logs

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

### List All Admins

```sql
SELECT
  a.role,
  u.email,
  u.last_sign_in_at,
  a.created_at
FROM public.admins a
JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at;
```

### Verify RLS Policies

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Security Architecture

### Row Level Security (RLS)

All tables have RLS enabled with a **service-role-only policy**:

```sql
CREATE POLICY "Service role only" ON public.table_name
  FOR ALL USING (auth.role() = 'service_role');
```

This means:
- ✅ Client cannot directly access database
- ✅ All requests go through Next.js API routes (server-side)
- ✅ API routes use `supabaseAdmin` (service role)
- ✅ Middleware validates admin role before allowing access

### Token Storage

- **Access Token**: Stored in httpOnly cookie (1 hour expiry)
- **Refresh Token**: Stored in httpOnly cookie (7 days expiry)
- **httpOnly**: Prevents JavaScript access (XSS protection)
- **Secure**: Only sent over HTTPS in production
- **SameSite**: Lax mode (CSRF protection)

### Middleware Protection

All admin routes (`/dashboard/*`) are protected by middleware that:
1. Reads tokens from httpOnly cookies
2. Validates tokens with Supabase
3. Checks user is in `admins` table
4. Verifies role is valid (superadmin/manager/viewer)
5. Auto-refreshes expired tokens
6. Redirects to `/login` if validation fails

## Troubleshooting

### Issue: "column 'role' of relation 'public.admins' does not exist"

**Solution**: Run [MIGRATION_FIX_SCHEMA_V2.sql](./MIGRATION_FIX_SCHEMA_V2.sql)

### Issue: "Access denied: User is not an admin"

**Solution**: Create admin record in `admins` table (see "Create a New Admin" above)

### Issue: OAuth redirect fails

**Solution**:
1. Check Supabase → Authentication → URL Configuration
2. Verify Site URL and Redirect URLs are correct
3. Check Google Cloud Console → Authorized redirect URIs
4. Clear browser cookies and try again

### Issue: Environment variables not loaded

**Solution**:
- Local dev: Create `.env.local` file
- Production: Set env vars in hosting platform dashboard
- Restart dev server or redeploy after changes

### Issue: "Invalid refresh token"

**Solution**: Sign out (`/api/auth/signout`) and sign in again

## Deployment Targets

### Supported Platforms

- ✅ Vercel (recommended)
- ✅ Netlify
- ✅ Custom Node.js server
- ✅ Docker containers

### Build Commands

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## Monitoring & Maintenance

### Health Checks

- **Database**: Check Supabase Dashboard → Database → Health
- **API Routes**: Monitor response times and error rates
- **OAuth**: Check Supabase → Logs → API for auth errors
- **Admin Activity**: Query `admin_logs` table regularly

### Backup Strategy

- **Supabase**: Automatic point-in-time recovery enabled
- **Database Snapshots**: Weekly manual backups recommended
- **Environment Variables**: Store securely in password manager

### Update Procedures

1. Test changes locally
2. Run database migrations if needed
3. Deploy to staging (if available)
4. Verify functionality
5. Deploy to production
6. Monitor for errors

## Support Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **OAuth 2.0 Specification**: https://oauth.net/2/

## Project Structure

```
studio/
├── src/
│   ├── app/
│   │   ├── api/auth/          # OAuth endpoints
│   │   ├── dashboard/          # Admin pages
│   │   ├── login/              # Login page
│   │   └── ...
│   ├── lib/
│   │   ├── auth/               # Auth helpers
│   │   ├── supabase/           # Supabase clients and types
│   │   └── http/               # HTTP utilities
│   ├── components/             # React components
│   └── middleware.ts           # Route protection
├── docs/                       # Documentation (you are here)
│   ├── QUICK_START.md
│   ├── PRODUCTION_DEPLOYMENT.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   ├── OAUTH_SETUP.md
│   ├── DATABASE_GUIDE.md
│   ├── COMPLETE_DATABASE_SCHEMA.sql
│   ├── MIGRATION_FIX_SCHEMA_V2.sql
│   └── supabase-rpcs.sql
├── .env.example                # Environment variable template
└── package.json
```

## Version History

- **V2**: Complete OAuth implementation with httpOnly cookies
- **V1**: Initial database schema

## Contact

For questions or issues, check:
1. This documentation first
2. Supabase Dashboard → Logs
3. Browser console for errors
4. Hosting platform logs

---

**Last Updated**: 2025-12-06

**Production URL**: https://admin.masseurmatch.com

**Status**: Ready for deployment
