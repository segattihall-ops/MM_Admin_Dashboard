-- =====================================================
-- CRIAR USUÁRIOS ADMIN DE TESTE
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Cole e Execute

-- IMPORTANTE: Estes são usuários de TESTE
-- Para produção, use emails reais e senhas fortes!

-- =====================================================
-- 1. SUPERADMIN (Acesso Total)
-- =====================================================
-- Email: superadmin@test.com
-- Senha: Test@2024Super (defina uma senha forte!)
-- Role: superadmin

-- Primeiro, crie o usuário no Supabase Auth (faça isso manualmente via Dashboard)
-- Auth → Users → Add user
-- Email: superadmin@test.com
-- Password: [sua senha segura]
-- Auto-confirm user: YES

-- Depois execute este SQL para adicionar à tabela admins:
-- SUBSTITUA 'USER_ID_AQUI' pelo ID do usuário criado acima

INSERT INTO public.admins (user_id, role, created_at, updated_at)
VALUES (
  'USER_ID_SUPERADMIN',  -- ← SUBSTITUA pelo ID real do usuário
  'superadmin',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET role = 'superadmin', updated_at = NOW();

-- =====================================================
-- 2. MANAGER (Gerenciador)
-- =====================================================
-- Email: manager@test.com
-- Senha: Test@2024Manager
-- Role: manager

INSERT INTO public.admins (user_id, role, created_at, updated_at)
VALUES (
  'USER_ID_MANAGER',  -- ← SUBSTITUA pelo ID real do usuário
  'manager',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET role = 'manager', updated_at = NOW();

-- =====================================================
-- 3. VIEWER (Visualizador)
-- =====================================================
-- Email: viewer@test.com
-- Senha: Test@2024Viewer
-- Role: viewer

INSERT INTO public.admins (user_id, role, created_at, updated_at)
VALUES (
  'USER_ID_VIEWER',  -- ← SUBSTITUA pelo ID real do usuário
  'viewer',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET role = 'viewer', updated_at = NOW();

-- =====================================================
-- VERIFICAR ADMINS CRIADOS
-- =====================================================
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
-- INSTRUÇÕES DE USO:
-- =====================================================
--
-- 1. Acesse Supabase Dashboard → Authentication → Users
-- 2. Clique em "Add user" para cada admin:
--    a) superadmin@test.com
--    b) manager@test.com
--    c) viewer@test.com
-- 3. Para cada usuário:
--    - Defina uma senha forte
--    - Marque "Auto Confirm User" como YES
--    - Copie o USER ID gerado
-- 4. Volte ao SQL Editor e execute os INSERTs acima
--    substituindo USER_ID_XXX pelos IDs reais
-- 5. Execute a query de verificação no final
--
-- =====================================================
