-- =====================================================
-- VERIFICAÇÃO COMPLETA DO BANCO DE DADOS
-- =====================================================
-- Este script verifica se a estrutura do banco está
-- correta e compatível com o código do frontend
-- =====================================================

-- =====================================================
-- 1. LISTAR TODAS AS TABELAS
-- =====================================================
SELECT '========== TABELAS EXISTENTES ==========' AS info;

SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND columns.table_name = tables.table_name) as total_columns
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 2. ESTRUTURA DETALHADA DE CADA TABELA
-- =====================================================
SELECT '========== ESTRUTURA: profiles ==========' AS info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT '========== ESTRUTURA: admins ==========' AS info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admins'
ORDER BY ordinal_position;

SELECT '========== ESTRUTURA: therapists ==========' AS info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'therapists'
ORDER BY ordinal_position;

SELECT '========== ESTRUTURA: verification_data ==========' AS info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'verification_data'
ORDER BY ordinal_position;

SELECT '========== ESTRUTURA: payments ==========' AS info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'payments'
ORDER BY ordinal_position;

SELECT '========== ESTRUTURA: subscriptions ==========' AS info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subscriptions'
ORDER BY ordinal_position;

SELECT '========== ESTRUTURA: applications ==========' AS info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'applications'
ORDER BY ordinal_position;

SELECT '========== ESTRUTURA: legal_acceptances ==========' AS info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'legal_acceptances'
ORDER BY ordinal_position;

SELECT '========== ESTRUTURA: therapist_edits ==========' AS info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'therapist_edits'
ORDER BY ordinal_position;

SELECT '========== ESTRUTURA: profile_edits ==========' AS info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profile_edits'
ORDER BY ordinal_position;

SELECT '========== ESTRUTURA: audit_logs ==========' AS info;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- =====================================================
-- 3. FOREIGN KEYS (RELACIONAMENTOS)
-- =====================================================
SELECT '========== FOREIGN KEYS ==========' AS info;

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 4. INDEXES
-- =====================================================
SELECT '========== INDEXES ==========' AS info;

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================
SELECT '========== RLS POLICIES ==========' AS info;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 6. FUNCTIONS/PROCEDURES
-- =====================================================
SELECT '========== FUNCTIONS ==========' AS info;

SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================
SELECT '========== TRIGGERS ==========' AS info;

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 8. VERIFICAÇÕES ESPECÍFICAS DO FRONTEND
-- =====================================================
SELECT '========== VERIFICAÇÕES FRONTEND ==========' AS info;

-- Verifica se a tabela admins tem as colunas esperadas
SELECT
  'admins table check' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'admins'
        AND column_name IN ('id', 'user_id', 'role', 'permissions', 'created_at', 'created_by')
      HAVING count(*) = 6
    ) THEN '✅ OK'
    ELSE '❌ FALTANDO COLUNAS'
  END as status;

-- Verifica se therapists tem colunas necessárias
SELECT
  'therapists table check' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'therapists'
        AND column_name IN ('id', 'user_id', 'full_name', 'email', 'status', 'plan')
      HAVING count(*) = 6
    ) THEN '✅ OK'
    ELSE '❌ FALTANDO COLUNAS'
  END as status;

-- Verifica se verification_data existe
SELECT
  'verification_data table check' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'verification_data'
    ) THEN '✅ OK'
    ELSE '❌ TABELA NÃO EXISTE'
  END as status;

-- Verifica se payments existe
SELECT
  'payments table check' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'payments'
    ) THEN '✅ OK'
    ELSE '❌ TABELA NÃO EXISTE'
  END as status;

-- Verifica se subscriptions existe
SELECT
  'subscriptions table check' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'subscriptions'
    ) THEN '✅ OK'
    ELSE '❌ TABELA NÃO EXISTE'
  END as status;

-- =====================================================
-- 9. CONTAGEM DE REGISTROS
-- =====================================================
SELECT '========== CONTAGEM DE REGISTROS ==========' AS info;

SELECT 'profiles' as table_name, count(*) as total FROM public.profiles
UNION ALL
SELECT 'admins', count(*) FROM public.admins
UNION ALL
SELECT 'therapists', count(*) FROM public.therapists
UNION ALL
SELECT 'verification_data', count(*) FROM public.verification_data
UNION ALL
SELECT 'payments', count(*) FROM public.payments
UNION ALL
SELECT 'subscriptions', count(*) FROM public.subscriptions
UNION ALL
SELECT 'applications', count(*) FROM public.applications
UNION ALL
SELECT 'legal_acceptances', count(*) FROM public.legal_acceptances
UNION ALL
SELECT 'therapist_edits', count(*) FROM public.therapist_edits
UNION ALL
SELECT 'profile_edits', count(*) FROM public.profile_edits
UNION ALL
SELECT 'audit_logs', count(*) FROM public.audit_logs
ORDER BY table_name;

-- =====================================================
-- 10. USUÁRIOS DE AUTH E ADMINS
-- =====================================================
SELECT '========== USUÁRIOS AUTH ==========' AS info;

SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

SELECT '========== ADMINS CADASTRADOS ==========' AS info;

SELECT
  a.id,
  a.user_id,
  a.role,
  au.email,
  a.created_at
FROM public.admins a
LEFT JOIN auth.users au ON au.id = a.user_id
ORDER BY a.created_at DESC;

-- =====================================================
-- FIM DA VERIFICAÇÃO
-- =====================================================
SELECT '========== VERIFICAÇÃO COMPLETA ==========' AS info;
SELECT 'Execute este script para ver toda a estrutura do banco!' AS message;
