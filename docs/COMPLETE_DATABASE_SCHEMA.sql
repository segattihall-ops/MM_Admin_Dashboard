-- =============================================
-- COMPLETE DATABASE SCHEMA - ADMIN DASHBOARD
-- =============================================
-- Version: 2.0
-- Last Updated: 2025
--
-- This is the complete, production-ready database schema for the admin dashboard.
-- It includes:
-- - OAuth/OTP authentication support (Google, Apple, Facebook, Phone, Email)
-- - Three admin role levels: superadmin, manager, viewer
-- - RLS policies (service_role only access)
-- - Automatic profile creation on signup
-- - Audit logging
-- - All necessary indexes for performance
--
-- IMPORTANT: Execute this entire file in your Supabase SQL Editor
-- =============================================

-- =============================================
-- STEP 1: TABLES
-- =============================================

-- Profiles table (extends auth.users with additional user data)
-- Created automatically when a user signs up via OAuth/OTP
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  bio text,
  avatar_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Extended user profile data - linked to auth.users';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users(id) - one profile per user';

-- Admins table (controls who can access the admin dashboard)
-- Three role levels: superadmin, manager, viewer
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('superadmin', 'manager', 'viewer')),
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.admins(id),
  UNIQUE(user_id)
);

COMMENT ON TABLE public.admins IS 'Admin users with role-based access control';
COMMENT ON COLUMN public.admins.role IS 'Admin role: superadmin (full access), manager (moderate access), viewer (read-only)';
COMMENT ON COLUMN public.admins.permissions IS 'Optional: granular permissions per admin';

-- Therapists table
CREATE TABLE IF NOT EXISTS public.therapists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Rejected', 'Suspended')),
  plan text,
  plan_name text,
  subscription_status text,
  slug text UNIQUE,
  phone text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.admins(id),
  rejection_reason text,
  document_url text,
  card_url text,
  selfie_url text,
  signed_term_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

COMMENT ON TABLE public.therapists IS 'Therapist profiles with verification status';
COMMENT ON COLUMN public.therapists.status IS 'Verification status: Pending, Active, Rejected, Suspended';

-- Verification data table
CREATE TABLE IF NOT EXISTS public.verification_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES public.therapists(id) ON DELETE CASCADE,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  document_url text,
  card_url text,
  selfie_url text,
  signed_term_url text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.admins(id),
  notes text
);

COMMENT ON TABLE public.verification_data IS 'Document verification for therapists';

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'BRL',
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
  paid_at timestamptz,
  invoice_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.payments IS 'Payment transactions';

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text,
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Canceled', 'Expired', 'PastDue')),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  canceled_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.subscriptions IS 'User subscriptions';

-- Therapist edits table (for pending profile changes)
CREATE TABLE IF NOT EXISTS public.therapists_edit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES public.therapists(id) ON DELETE CASCADE,
  changes jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.admins(id)
);

COMMENT ON TABLE public.therapists_edit IS 'Pending edits to therapist profiles requiring approval';

-- Profile edits table (for pending profile changes)
CREATE TABLE IF NOT EXISTS public.profile_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  changes jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.admins(id)
);

COMMENT ON TABLE public.profile_edits IS 'Pending edits to user profiles requiring approval';

-- Applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.admins(id),
  notes text
);

COMMENT ON TABLE public.applications IS 'User applications (e.g., to become a therapist)';

-- Legal acceptances table
CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  version text NOT NULL,
  accepted_at timestamptz DEFAULT now(),
  ip_address text
);

COMMENT ON TABLE public.legal_acceptances IS 'Legal document acceptances (Terms, Privacy Policy, etc.)';

-- Admin logs table (audit trail)
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  action_name text NOT NULL,
  target_type text,
  target_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.admin_logs IS 'Audit log of all admin actions';
COMMENT ON COLUMN public.admin_logs.action_name IS 'Action performed (e.g., "approve_therapist", "delete_user")';
COMMENT ON COLUMN public.admin_logs.target_type IS 'Type of entity affected (e.g., "therapist", "user")';
COMMENT ON COLUMN public.admin_logs.target_id IS 'ID of the affected entity';

-- Settings table (for global app configuration)
CREATE TABLE IF NOT EXISTS public.settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.settings IS 'Global application settings';

-- =============================================
-- STEP 2: INDEXES (for better query performance)
-- =============================================

-- Profiles indexes
-- (id is already indexed as PRIMARY KEY)

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
-- STEP 3: TRIGGERS (automatic profile creation on OAuth signup)
-- =============================================

-- Function: Create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, display_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Trigger: Create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates profile when user signs up via OAuth/OTP';

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers: Auto-update updated_at on profiles
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Triggers: Auto-update updated_at on therapists
DROP TRIGGER IF EXISTS set_updated_at ON public.therapists;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.therapists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Triggers: Auto-update updated_at on settings
DROP TRIGGER IF EXISTS set_updated_at ON public.settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- STEP 4: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
-- These policies ensure that ONLY the service role can perform operations.
-- The anon key and authenticated users have NO direct database access.
-- All access must go through the Next.js API routes (server-side).
-- =============================================

-- Enable RLS on all tables
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

-- Service role only policies (applies to ALL tables)
-- Only the backend (using SUPABASE_SERVICE_ROLE_KEY) can access data

-- Profiles policies
CREATE POLICY "Service role only" ON public.profiles FOR ALL USING (auth.role() = 'service_role');

-- Admins policies
CREATE POLICY "Service role only" ON public.admins FOR ALL USING (auth.role() = 'service_role');

-- Therapists policies
CREATE POLICY "Service role only" ON public.therapists FOR ALL USING (auth.role() = 'service_role');

-- Verification data policies
CREATE POLICY "Service role only" ON public.verification_data FOR ALL USING (auth.role() = 'service_role');

-- Payments policies
CREATE POLICY "Service role only" ON public.payments FOR ALL USING (auth.role() = 'service_role');

-- Subscriptions policies
CREATE POLICY "Service role only" ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');

-- Therapist edits policies
CREATE POLICY "Service role only" ON public.therapists_edit FOR ALL USING (auth.role() = 'service_role');

-- Profile edits policies
CREATE POLICY "Service role only" ON public.profile_edits FOR ALL USING (auth.role() = 'service_role');

-- Applications policies
CREATE POLICY "Service role only" ON public.applications FOR ALL USING (auth.role() = 'service_role');

-- Legal acceptances policies
CREATE POLICY "Service role only" ON public.legal_acceptances FOR ALL USING (auth.role() = 'service_role');

-- Admin logs policies
CREATE POLICY "Service role only" ON public.admin_logs FOR ALL USING (auth.role() = 'service_role');

-- Settings policies
CREATE POLICY "Service role only" ON public.settings FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- STEP 5: RPC FUNCTIONS (Stored Procedures)
-- =============================================

-- Function: Approve therapist profile
CREATE OR REPLACE FUNCTION public.approve_therapist(
  therapist_id uuid,
  admin_id uuid,
  notes text DEFAULT NULL
)
RETURNS public.therapists
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_therapist public.therapists;
BEGIN
  -- Update therapist status
  UPDATE public.therapists
  SET
    status = 'Active',
    reviewed_at = NOW(),
    reviewed_by = admin_id,
    rejection_reason = NULL
  WHERE id = therapist_id
  RETURNING * INTO updated_therapist;

  -- Log the action
  INSERT INTO public.admin_logs (admin_id, action_name, target_type, target_id, metadata)
  VALUES (admin_id, 'approve_therapist', 'therapist', therapist_id, jsonb_build_object('notes', notes));

  RETURN updated_therapist;
END;
$$;

COMMENT ON FUNCTION public.approve_therapist IS 'Approve a therapist profile and log the action';

-- Function: Reject therapist profile
CREATE OR REPLACE FUNCTION public.reject_therapist(
  therapist_id uuid,
  admin_id uuid,
  rejection_reason text DEFAULT NULL
)
RETURNS public.therapists
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_therapist public.therapists;
BEGIN
  -- Update therapist status
  UPDATE public.therapists
  SET
    status = 'Rejected',
    reviewed_at = NOW(),
    reviewed_by = admin_id,
    rejection_reason = rejection_reason
  WHERE id = therapist_id
  RETURNING * INTO updated_therapist;

  -- Log the action
  INSERT INTO public.admin_logs (admin_id, action_name, target_type, target_id, metadata)
  VALUES (admin_id, 'reject_therapist', 'therapist', therapist_id, jsonb_build_object('reason', rejection_reason));

  RETURN updated_therapist;
END;
$$;

COMMENT ON FUNCTION public.reject_therapist IS 'Reject a therapist profile and log the action';

-- Function: Activate subscription
CREATE OR REPLACE FUNCTION public.activate_subscription(
  subscription_id uuid,
  admin_id uuid
)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_subscription public.subscriptions;
BEGIN
  -- Update subscription status
  UPDATE public.subscriptions
  SET
    status = 'Active',
    canceled_at = NULL
  WHERE id = subscription_id
  RETURNING * INTO updated_subscription;

  -- Log the action
  INSERT INTO public.admin_logs (admin_id, action_name, target_type, target_id)
  VALUES (admin_id, 'activate_subscription', 'subscription', subscription_id);

  RETURN updated_subscription;
END;
$$;

COMMENT ON FUNCTION public.activate_subscription IS 'Activate a subscription and log the action';

-- Function: Cancel subscription
CREATE OR REPLACE FUNCTION public.cancel_subscription(
  subscription_id uuid,
  admin_id uuid
)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_subscription public.subscriptions;
BEGIN
  -- Update subscription status
  UPDATE public.subscriptions
  SET
    status = 'Canceled',
    canceled_at = NOW()
  WHERE id = subscription_id
  RETURNING * INTO updated_subscription;

  -- Log the action
  INSERT INTO public.admin_logs (admin_id, action_name, target_type, target_id)
  VALUES (admin_id, 'cancel_subscription', 'subscription', subscription_id);

  RETURN updated_subscription;
END;
$$;

COMMENT ON FUNCTION public.cancel_subscription IS 'Cancel a subscription and log the action';

-- Function: Log admin action
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_name text,
  admin_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  target_type text DEFAULT NULL,
  target_id uuid DEFAULT NULL
)
RETURNS public.admin_logs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.admin_logs (admin_id, action_name, target_type, target_id, metadata)
  VALUES (admin_id, action_name, target_type, target_id, COALESCE(metadata, '{}'::jsonb))
  RETURNING *;
$$;

COMMENT ON FUNCTION public.log_admin_action IS 'Log an admin action for audit trail';

-- =============================================
-- STEP 6: GRANT PERMISSIONS
-- =============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table permissions (service_role only through RLS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute on functions (service_role only)
GRANT EXECUTE ON FUNCTION public.approve_therapist TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_therapist TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_subscription TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_subscription TO service_role;
GRANT EXECUTE ON FUNCTION public.log_admin_action TO service_role;

-- =============================================
-- STEP 7: SEED DATA (Initial Setup)
-- =============================================

-- Insert default settings
INSERT INTO public.settings (id, value, description)
VALUES
  ('maintenance_mode', 'false'::jsonb, 'Enable/disable maintenance mode'),
  ('registration_enabled', 'true'::jsonb, 'Enable/disable new user registration'),
  ('therapist_approval_required', 'true'::jsonb, 'Require admin approval for therapist profiles')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 8: CREATE FIRST ADMIN (MANUAL STEP)
-- =============================================
-- IMPORTANT: After running this schema, you need to manually create your first admin.
--
-- Instructions:
-- 1. Sign up via OAuth (Google/Apple/Facebook) or create a user in Supabase Dashboard
-- 2. Copy the user's UUID from auth.users table
-- 3. Run this SQL (replace YOUR_USER_UUID with the actual UUID):
--
-- INSERT INTO public.admins (user_id, role)
-- VALUES ('YOUR_USER_UUID', 'superadmin')
-- ON CONFLICT (user_id) DO NOTHING;
--
-- Example:
-- INSERT INTO public.admins (user_id, role)
-- VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'superadmin');
--
-- =============================================

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
--
-- ✅ Database schema created successfully!
--
-- Next Steps:
-- 1. Verify all tables were created: Check Supabase Table Editor
-- 2. Test RLS policies: Try accessing tables with anon key (should fail)
-- 3. Test service role: Use service role key in backend (should work)
-- 4. Create your first admin user (see STEP 8 above)
-- 5. Set environment variables in .env.local:
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
--    - SUPABASE_SERVICE_ROLE_KEY
-- 6. Configure OAuth providers in Supabase Dashboard
-- 7. Deploy your application
--
-- OAuth Provider Setup:
-- - Google: https://console.cloud.google.com
-- - Apple: https://developer.apple.com
-- - Facebook: https://developers.facebook.com
-- - Phone/Email: Configure in Supabase Auth settings
--
-- Documentation:
-- - See docs/OAUTH_SETUP.md for detailed OAuth configuration
-- - See docs/SUPABASE_SETUP.md for general setup instructions
--
-- Security Notes:
-- ✅ All tables protected by RLS (service_role only)
-- ✅ OAuth signup automatically creates profile
-- ✅ Three admin role levels (superadmin, manager, viewer)
-- ✅ Full audit logging via admin_logs
-- ✅ Automatic timestamps via triggers
-- ✅ Performance optimized with indexes
--
-- Support:
-- - GitHub: https://github.com/anthropics/claude-code/issues
-- - Supabase Docs: https://supabase.com/docs
-- =============================================
