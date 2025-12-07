-- =============================================
-- DATABASE SCHEMA MIGRATION FIX
-- =============================================
-- This migration safely adds missing columns to existing tables
-- without dropping any data.
--
-- Problem: The admins table (and others) were created with an older
-- schema that's missing columns needed by the application.
--
-- Solution: Add missing columns with safe ALTER TABLE statements
-- that check for existence first.
--
-- SAFE TO RUN MULTIPLE TIMES - Idempotent migration
-- =============================================

-- =============================================
-- STEP 1: FIX ADMINS TABLE (CRITICAL)
-- =============================================

-- Add role column (REQUIRED by application code)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'admins'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.admins
    ADD COLUMN role text NOT NULL DEFAULT 'viewer';

    -- Add check constraint separately
    ALTER TABLE public.admins
    ADD CONSTRAINT admins_role_check CHECK (role IN ('superadmin', 'manager', 'viewer'));

    RAISE NOTICE 'Added role column to admins table';
  ELSE
    RAISE NOTICE 'role column already exists in admins table';
  END IF;
END $$;

-- Add permissions column (optional feature for granular permissions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'admins'
    AND column_name = 'permissions'
  ) THEN
    ALTER TABLE public.admins
    ADD COLUMN permissions jsonb DEFAULT '{}'::jsonb;

    RAISE NOTICE 'Added permissions column to admins table';
  ELSE
    RAISE NOTICE 'permissions column already exists in admins table';
  END IF;
END $$;

-- Add created_by column (tracks which admin created this admin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'admins'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.admins
    ADD COLUMN created_by uuid REFERENCES public.admins(id);

    RAISE NOTICE 'Added created_by column to admins table';
  ELSE
    RAISE NOTICE 'created_by column already exists in admins table';
  END IF;
END $$;

-- =============================================
-- STEP 2: FIX THERAPISTS_EDIT TABLE
-- =============================================

-- Add resolved_by column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'therapists_edit'
    AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE public.therapists_edit
    ADD COLUMN resolved_by uuid REFERENCES public.admins(id);

    RAISE NOTICE 'Added resolved_by column to therapists_edit table';
  ELSE
    RAISE NOTICE 'resolved_by column already exists in therapists_edit table';
  END IF;
END $$;

-- =============================================
-- STEP 3: FIX PROFILE_EDITS TABLE
-- =============================================

-- Add resolved_by column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profile_edits'
    AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE public.profile_edits
    ADD COLUMN resolved_by uuid REFERENCES public.admins(id);

    RAISE NOTICE 'Added resolved_by column to profile_edits table';
  ELSE
    RAISE NOTICE 'resolved_by column already exists in profile_edits table';
  END IF;
END $$;

-- =============================================
-- STEP 4: ENSURE ALL INDEXES EXIST
-- =============================================

-- Admins indexes
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins(role);

-- Therapists indexes
CREATE INDEX IF NOT EXISTS idx_therapists_user_id ON public.therapists(user_id);
CREATE INDEX IF NOT EXISTS idx_therapists_status ON public.therapists(status);
CREATE INDEX IF NOT EXISTS idx_therapists_slug ON public.therapists(slug);
CREATE INDEX IF NOT EXISTS idx_therapists_email ON public.therapists(email);

-- Verification data indexes
CREATE INDEX IF NOT EXISTS idx_verification_therapist_id ON public.verification_data(therapist_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON public.verification_data(status);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);

-- Admin logs indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_name ON public.admin_logs(action_name);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- =============================================
-- STEP 5: ENSURE RLS POLICIES ARE CORRECT
-- =============================================

-- Enable RLS on all tables (safe if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists_edit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop old split policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Service role only: admins select" ON public.admins;
  DROP POLICY IF EXISTS "Service role only: admins insert" ON public.admins;
  DROP POLICY IF EXISTS "Service role only: admins update" ON public.admins;
  DROP POLICY IF EXISTS "Service role only: admins delete" ON public.admins;

  RAISE NOTICE 'Dropped old split policies (if they existed)';
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'No old policies to drop';
END $$;

-- Create unified service role only policy
DO $$
BEGIN
  -- Drop if exists, then create
  DROP POLICY IF EXISTS "Service role only" ON public.admins;
  CREATE POLICY "Service role only" ON public.admins
    FOR ALL USING (auth.role() = 'service_role');

  RAISE NOTICE 'Created unified service_role policy for admins';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Unified policy already exists for admins';
END $$;

-- Apply same pattern to other tables
DO $$
BEGIN
  DROP POLICY IF EXISTS "Service role only" ON public.therapists_edit;
  CREATE POLICY "Service role only" ON public.therapists_edit
    FOR ALL USING (auth.role() = 'service_role');
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Service role only" ON public.profile_edits;
  CREATE POLICY "Service role only" ON public.profile_edits
    FOR ALL USING (auth.role() = 'service_role');
END $$;

-- =============================================
-- STEP 6: VERIFY MIGRATION SUCCESS
-- =============================================

DO $$
DECLARE
  role_exists boolean;
  permissions_exists boolean;
  created_by_exists boolean;
BEGIN
  -- Check if role column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'admins'
    AND column_name = 'role'
  ) INTO role_exists;

  -- Check if permissions column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'admins'
    AND column_name = 'permissions'
  ) INTO permissions_exists;

  -- Check if created_by column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'admins'
    AND column_name = 'created_by'
  ) INTO created_by_exists;

  -- Report results
  IF role_exists AND permissions_exists AND created_by_exists THEN
    RAISE NOTICE '✅ MIGRATION SUCCESSFUL - All columns added to admins table';
  ELSE
    RAISE WARNING '⚠️ MIGRATION INCOMPLETE:';
    IF NOT role_exists THEN
      RAISE WARNING '  - role column MISSING';
    END IF;
    IF NOT permissions_exists THEN
      RAISE WARNING '  - permissions column MISSING';
    END IF;
    IF NOT created_by_exists THEN
      RAISE WARNING '  - created_by column MISSING';
    END IF;
  END IF;
END $$;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
--
-- ✅ What was fixed:
-- 1. Added 'role' column to admins table (CRITICAL)
-- 2. Added 'permissions' column to admins table
-- 3. Added 'created_by' column to admins table
-- 4. Added 'resolved_by' columns to edit tables
-- 5. Created all necessary indexes
-- 6. Ensured RLS policies are correct
--
-- Next steps:
-- 1. Verify the migration messages above show success
-- 2. Test creating an admin:
--    INSERT INTO public.admins (user_id, role)
--    VALUES ('your-uuid', 'superadmin');
-- 3. Test that the application loads without errors
-- 4. Verify OAuth login works
-- 5. Check that middleware validates admin roles
--
-- Rollback (if needed):
-- ALTER TABLE public.admins DROP COLUMN IF EXISTS role;
-- ALTER TABLE public.admins DROP COLUMN IF EXISTS permissions;
-- ALTER TABLE public.admins DROP COLUMN IF EXISTS created_by;
-- =============================================

-- Show final table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'admins'
ORDER BY ordinal_position;
