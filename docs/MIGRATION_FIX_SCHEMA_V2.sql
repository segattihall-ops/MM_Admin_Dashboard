-- =============================================
-- DATABASE SCHEMA MIGRATION FIX V2
-- =============================================
-- This migration handles cases where the admins table has a severely
-- incomplete structure, potentially missing even basic columns like 'id'.
--
-- SAFE TO RUN MULTIPLE TIMES - Idempotent migration
-- =============================================

-- =============================================
-- STEP 1: CHECK AND FIX ADMINS TABLE STRUCTURE
-- =============================================

-- First, let's see what we're working with
DO $$
DECLARE
  table_exists boolean;
  id_exists boolean;
  user_id_exists boolean;
  role_exists boolean;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admins'
  ) INTO table_exists;

  IF table_exists THEN
    RAISE NOTICE 'admins table exists, checking structure...';

    -- Check for id column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'id'
    ) INTO id_exists;

    -- Check for user_id column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'user_id'
    ) INTO user_id_exists;

    -- Check for role column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'role'
    ) INTO role_exists;

    RAISE NOTICE 'Current structure: id=%, user_id=%, role=%', id_exists, user_id_exists, role_exists;
  ELSE
    RAISE NOTICE 'admins table does not exist - will be created';
  END IF;
END $$;

-- =============================================
-- STEP 2: RECREATE TABLE IF STRUCTURE IS BROKEN
-- =============================================
-- If the table is missing critical columns like id, it's safer to recreate it
-- This assumes the table is either empty or has test data only

DO $$
DECLARE
  table_exists boolean;
  id_exists boolean;
  row_count integer;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admins'
  ) INTO table_exists;

  IF table_exists THEN
    -- Check if id column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'id'
    ) INTO id_exists;

    IF NOT id_exists THEN
      -- Check how many rows exist
      EXECUTE 'SELECT COUNT(*) FROM public.admins' INTO row_count;

      IF row_count = 0 THEN
        RAISE NOTICE 'Table exists but has broken structure and no data - recreating...';

        -- Drop the broken table
        DROP TABLE IF EXISTS public.admins CASCADE;

        -- Create properly
        CREATE TABLE public.admins (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('superadmin', 'manager', 'viewer')),
          permissions jsonb DEFAULT '{}'::jsonb,
          created_at timestamptz DEFAULT now(),
          created_by uuid REFERENCES public.admins(id),
          UNIQUE(user_id)
        );

        RAISE NOTICE '✅ Created admins table with correct structure';
      ELSE
        RAISE WARNING '⚠️ Table has data (% rows) but missing id column - manual intervention needed', row_count;
        RAISE EXCEPTION 'Cannot auto-fix table with data. Please backup and manually fix.';
      END IF;
    END IF;
  ELSE
    -- Table doesn't exist, create it
    RAISE NOTICE 'Creating admins table from scratch...';

    CREATE TABLE public.admins (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('superadmin', 'manager', 'viewer')),
      permissions jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      created_by uuid REFERENCES public.admins(id),
      UNIQUE(user_id)
    );

    RAISE NOTICE '✅ Created admins table';
  END IF;
END $$;

-- =============================================
-- STEP 3: ADD MISSING COLUMNS (IF TABLE EXISTS WITH PARTIAL STRUCTURE)
-- =============================================

-- Add role column if missing (for tables that have id but not role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.admins
    ADD COLUMN role text NOT NULL DEFAULT 'viewer';

    -- Add check constraint
    ALTER TABLE public.admins
    ADD CONSTRAINT admins_role_check CHECK (role IN ('superadmin', 'manager', 'viewer'));

    RAISE NOTICE 'Added role column';
  ELSE
    RAISE NOTICE 'role column already exists';
  END IF;
END $$;

-- Add permissions column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE public.admins
    ADD COLUMN permissions jsonb DEFAULT '{}'::jsonb;

    RAISE NOTICE 'Added permissions column';
  ELSE
    RAISE NOTICE 'permissions column already exists';
  END IF;
END $$;

-- Add created_at column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.admins
    ADD COLUMN created_at timestamptz DEFAULT now();

    RAISE NOTICE 'Added created_at column';
  ELSE
    RAISE NOTICE 'created_at column already exists';
  END IF;
END $$;

-- Add created_by column if missing (AFTER ensuring id exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'created_by'
  ) THEN
    -- Only add if id column exists (it should by now)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'id'
    ) THEN
      ALTER TABLE public.admins
      ADD COLUMN created_by uuid REFERENCES public.admins(id);

      RAISE NOTICE 'Added created_by column';
    ELSE
      RAISE WARNING 'Cannot add created_by - id column missing!';
    END IF;
  ELSE
    RAISE NOTICE 'created_by column already exists';
  END IF;
END $$;

-- =============================================
-- STEP 4: FIX OTHER TABLES
-- =============================================

-- Add resolved_by to therapists_edit
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'therapists_edit'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'therapists_edit' AND column_name = 'resolved_by'
    ) THEN
      ALTER TABLE public.therapists_edit
      ADD COLUMN resolved_by uuid REFERENCES public.admins(id);

      RAISE NOTICE 'Added resolved_by to therapists_edit';
    ELSE
      RAISE NOTICE 'resolved_by already exists in therapists_edit';
    END IF;
  ELSE
    RAISE NOTICE 'therapists_edit table does not exist';
  END IF;
END $$;

-- Add resolved_by to profile_edits
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profile_edits'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profile_edits' AND column_name = 'resolved_by'
    ) THEN
      ALTER TABLE public.profile_edits
      ADD COLUMN resolved_by uuid REFERENCES public.admins(id);

      RAISE NOTICE 'Added resolved_by to profile_edits';
    ELSE
      RAISE NOTICE 'resolved_by already exists in profile_edits';
    END IF;
  ELSE
    RAISE NOTICE 'profile_edits table does not exist';
  END IF;
END $$;

-- =============================================
-- STEP 5: CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins(role);

-- =============================================
-- STEP 6: ENABLE RLS AND CREATE POLICIES
-- =============================================

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Service role only: admins select" ON public.admins;
DROP POLICY IF EXISTS "Service role only: admins insert" ON public.admins;
DROP POLICY IF EXISTS "Service role only: admins update" ON public.admins;
DROP POLICY IF EXISTS "Service role only: admins delete" ON public.admins;

-- Create unified policy
DROP POLICY IF EXISTS "Service role only" ON public.admins;
CREATE POLICY "Service role only" ON public.admins
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- STEP 7: VERIFY MIGRATION
-- =============================================

DO $$
DECLARE
  id_exists boolean;
  user_id_exists boolean;
  role_exists boolean;
  permissions_exists boolean;
  created_by_exists boolean;
  created_at_exists boolean;
BEGIN
  -- Check all columns
  SELECT
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'user_id'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'role'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'permissions'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'created_by'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'created_at')
  INTO id_exists, user_id_exists, role_exists, permissions_exists, created_by_exists, created_at_exists;

  -- Report
  IF id_exists AND user_id_exists AND role_exists THEN
    RAISE NOTICE '✅ MIGRATION SUCCESSFUL!';
    RAISE NOTICE '   Core columns: id=%, user_id=%, role=%', id_exists, user_id_exists, role_exists;
    RAISE NOTICE '   Optional columns: permissions=%, created_by=%, created_at=%', permissions_exists, created_by_exists, created_at_exists;
  ELSE
    RAISE WARNING '⚠️ MIGRATION INCOMPLETE:';
    RAISE WARNING '   id=%, user_id=%, role=%', id_exists, user_id_exists, role_exists;
  END IF;
END $$;

-- Show final structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'admins'
ORDER BY ordinal_position;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
--
-- Next step: Create your first admin
--
-- First, sign up via OAuth or create user in Supabase Dashboard
-- Then run:
--
-- INSERT INTO public.admins (user_id, role)
-- VALUES ('YOUR_USER_UUID_FROM_AUTH_USERS', 'superadmin');
--
-- =============================================
