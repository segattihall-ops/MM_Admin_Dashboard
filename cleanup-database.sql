-- =====================================================
-- CLEANUP SCRIPT - DROP ALL TABLES AND POLICIES
-- =====================================================
-- ATENÇÃO: Este script vai DELETAR todas as tabelas existentes!
-- Use apenas se quiser começar do zero.
-- =====================================================

-- Drop all policies first (todas as variações possíveis)
DROP POLICY IF EXISTS "Service role only" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Service role only" ON public.admins CASCADE;
DROP POLICY IF EXISTS "Service role only" ON public.therapists CASCADE;
DROP POLICY IF EXISTS "Service role only" ON public.verification_data CASCADE;
DROP POLICY IF EXISTS "Service role only" ON public.payments CASCADE;
DROP POLICY IF EXISTS "Service role only" ON public.subscriptions CASCADE;
DROP POLICY IF EXISTS "Service role only" ON public.applications CASCADE;
DROP POLICY IF EXISTS "Service role only" ON public.legal_acceptances CASCADE;
DROP POLICY IF EXISTS "Service role only" ON public.therapist_edits CASCADE;
DROP POLICY IF EXISTS "Service role only" ON public.profile_edits CASCADE;
DROP POLICY IF EXISTS "Service role only" ON public.audit_logs CASCADE;

DROP POLICY IF EXISTS "Service role has full access" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Service role has full access" ON public.admins CASCADE;
DROP POLICY IF EXISTS "Service role has full access" ON public.therapists CASCADE;
DROP POLICY IF EXISTS "Service role has full access" ON public.verification_data CASCADE;
DROP POLICY IF EXISTS "Service role has full access" ON public.payments CASCADE;
DROP POLICY IF EXISTS "Service role has full access" ON public.subscriptions CASCADE;
DROP POLICY IF EXISTS "Service role has full access" ON public.applications CASCADE;
DROP POLICY IF EXISTS "Service role has full access" ON public.legal_acceptances CASCADE;
DROP POLICY IF EXISTS "Service role has full access" ON public.therapist_edits CASCADE;
DROP POLICY IF EXISTS "Service role has full access" ON public.profile_edits CASCADE;
DROP POLICY IF EXISTS "Service role has full access" ON public.audit_logs CASCADE;

-- Desabilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profile_edits DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.therapist_edits DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.legal_acceptances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.therapists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop functions first (dependências)
DROP FUNCTION IF EXISTS public.approve_therapist(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.reject_therapist(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS update_therapists_updated_at ON public.therapists CASCADE;

-- Drop tables with CASCADE (força remoção de todas as dependências)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.profile_edits CASCADE;
DROP TABLE IF EXISTS public.therapist_edits CASCADE;
DROP TABLE IF EXISTS public.legal_acceptances CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.verification_data CASCADE;
DROP TABLE IF EXISTS public.therapists CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Confirmar limpeza
SELECT 'Database cleanup completed! All tables, policies, functions and triggers dropped.' AS status;
