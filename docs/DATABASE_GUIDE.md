# Guia Completo do Banco de Dados

Este documento explica a estrutura completa do banco de dados do Admin Dashboard.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Tabelas](#estrutura-de-tabelas)
3. [Níveis de Usuário](#níveis-de-usuário)
4. [Suporte OAuth](#suporte-oauth)
5. [Instalação](#instalação)
6. [RLS Policies](#rls-policies)
7. [Funções RPC](#funções-rpc)
8. [Triggers](#triggers)
9. [Exemplos de Uso](#exemplos-de-uso)

---

## Visão Geral

### Tecnologias
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth (OAuth + Email/Phone)
- **ORM**: Supabase Client + TypeScript
- **Security**: Row Level Security (RLS)

### Características Principais
- ✅ Suporte OAuth (Google, Apple, Facebook)
- ✅ Email OTP (Magic Links)
- ✅ Phone OTP (SMS)
- ✅ 3 níveis de admin (superadmin, manager, viewer)
- ✅ Criação automática de profile via trigger
- ✅ RLS em todas as tabelas (service_role only)
- ✅ Audit logging completo
- ✅ Indexes otimizados
- ✅ Triggers para updated_at automático

---

## Estrutura de Tabelas

### Diagrama ER (Simplificado)

```
auth.users (Supabase Auth)
    │
    ├─── profiles (1:1)
    │    └─ profile_edits (1:N)
    │
    ├─── admins (1:1)
    │    └─ admin_logs (1:N)
    │
    ├─── therapists (1:1)
    │    ├─ therapists_edit (1:N)
    │    └─ verification_data (1:N)
    │
    ├─── payments (1:N)
    ├─── subscriptions (1:N)
    ├─── applications (1:N)
    └─── legal_acceptances (1:N)

settings (global config)
```

### Tabelas Principais

#### 1. `profiles`
Dados estendidos do usuário (complementa `auth.users`)

```sql
- id: uuid (PK, FK auth.users)
- display_name: text
- bio: text
- avatar_url: text
- metadata: jsonb
- created_at: timestamptz
- updated_at: timestamptz
```

**Criação automática:** Quando usuário faz signup via OAuth/OTP, o trigger `handle_new_user()` cria o profile automaticamente.

#### 2. `admins`
Controle de acesso ao dashboard

```sql
- id: uuid (PK)
- user_id: uuid (FK auth.users, UNIQUE)
- role: text ('superadmin' | 'manager' | 'viewer')
- permissions: jsonb (granular permissions)
- created_at: timestamptz
- created_by: uuid (FK admins.id)
```

**Roles:**
- `superadmin`: Acesso total, pode criar outros admins
- `manager`: Pode aprovar/rejeitar, sem acesso a settings
- `viewer`: Somente leitura

#### 3. `therapists`
Perfis de terapeutas

```sql
- id: uuid (PK)
- user_id: uuid (FK auth.users, UNIQUE)
- full_name: text
- email: text
- status: text ('Pending' | 'Active' | 'Rejected' | 'Suspended')
- plan: text
- subscription_status: text
- slug: text (UNIQUE)
- phone: text
- reviewed_at: timestamptz
- reviewed_by: uuid (FK admins.id)
- rejection_reason: text
- document_url, card_url, selfie_url, signed_term_url: text
- created_at, updated_at: timestamptz
```

#### 4. `verification_data`
Documentos de verificação de terapeutas

```sql
- id: uuid (PK)
- therapist_id: uuid (FK therapists.id)
- status: text ('Pending' | 'Approved' | 'Rejected')
- document_url, card_url, selfie_url, signed_term_url: text
- submitted_at: timestamptz
- reviewed_at: timestamptz
- reviewed_by: uuid (FK admins.id)
- notes: text
```

#### 5. `payments`
Transações de pagamento

```sql
- id: uuid (PK)
- user_id: uuid (FK auth.users)
- amount: numeric
- currency: text (default 'BRL')
- status: text ('Pending' | 'Completed' | 'Failed' | 'Refunded')
- paid_at: timestamptz
- invoice_id: text
- metadata: jsonb
- created_at: timestamptz
```

#### 6. `subscriptions`
Assinaturas de usuários

```sql
- id: uuid (PK)
- user_id: uuid (FK auth.users)
- plan_id: text
- status: text ('Active' | 'Canceled' | 'Expired' | 'PastDue')
- start_date: timestamptz
- end_date: timestamptz
- canceled_at: timestamptz
- metadata: jsonb
- created_at: timestamptz
```

#### 7. `admin_logs`
Auditoria de ações admin

```sql
- id: uuid (PK)
- admin_id: uuid (FK admins.id)
- action_name: text (e.g., 'approve_therapist')
- target_type: text (e.g., 'therapist')
- target_id: uuid
- metadata: jsonb
- ip_address: text
- user_agent: text
- created_at: timestamptz
```

#### 8. Outras Tabelas

- `therapists_edit`: Edições pendentes de terapeutas
- `profile_edits`: Edições pendentes de profiles
- `applications`: Candidaturas (ex: para se tornar terapeuta)
- `legal_acceptances`: Aceites de termos/privacidade
- `settings`: Configurações globais do app

---

## Níveis de Usuário

### 1. Superadmin (Full Access)

**Permissões:**
- ✅ Criar/editar/deletar outros admins
- ✅ Aprovar/rejeitar terapeutas
- ✅ Gerenciar assinaturas e pagamentos
- ✅ Acessar/editar settings globais
- ✅ Ver todos os logs de auditoria
- ✅ Deletar qualquer conteúdo

**Exemplo de criação:**
```sql
INSERT INTO public.admins (user_id, role)
VALUES ('uuid-do-usuario', 'superadmin');
```

### 2. Manager (Moderate Access)

**Permissões:**
- ✅ Aprovar/rejeitar terapeutas
- ✅ Gerenciar assinaturas (ativar/cancelar)
- ✅ Ver pagamentos e relatórios
- ✅ Ver logs de auditoria
- ❌ Criar/deletar admins
- ❌ Editar settings globais
- ❌ Deletar conteúdo crítico

**Exemplo de criação:**
```sql
INSERT INTO public.admins (user_id, role, created_by)
VALUES ('uuid-do-usuario', 'manager', 'uuid-do-superadmin');
```

### 3. Viewer (Read-Only)

**Permissões:**
- ✅ Ver dashboard
- ✅ Ver terapeutas e seus status
- ✅ Ver assinaturas e pagamentos
- ✅ Ver logs de auditoria
- ❌ Aprovar/rejeitar qualquer coisa
- ❌ Editar ou deletar dados
- ❌ Criar admins

**Exemplo de criação:**
```sql
INSERT INTO public.admins (user_id, role, created_by)
VALUES ('uuid-do-usuario', 'viewer', 'uuid-do-superadmin');
```

### Implementação no Código

```typescript
// src/lib/auth/permissions.ts

export type AdminRole = 'superadmin' | 'manager' | 'viewer';

export const PERMISSIONS = {
  superadmin: {
    canCreateAdmins: true,
    canApproveTherapists: true,
    canManageSubscriptions: true,
    canEditSettings: true,
    canDeleteContent: true,
    canViewLogs: true,
  },
  manager: {
    canCreateAdmins: false,
    canApproveTherapists: true,
    canManageSubscriptions: true,
    canEditSettings: false,
    canDeleteContent: false,
    canViewLogs: true,
  },
  viewer: {
    canCreateAdmins: false,
    canApproveTherapists: false,
    canManageSubscriptions: false,
    canEditSettings: false,
    canDeleteContent: false,
    canViewLogs: true,
  },
};

export function hasPermission(role: AdminRole, permission: keyof typeof PERMISSIONS.superadmin): boolean {
  return PERMISSIONS[role]?.[permission] ?? false;
}
```

---

## Suporte OAuth

### Provedores Suportados

1. **Google OAuth** - Login com Google
2. **Apple OAuth** - Sign in with Apple
3. **Facebook OAuth** - Login com Facebook
4. **Email OTP** - Magic Link via email
5. **Phone OTP** - Código SMS via telefone

### Fluxo de Signup com OAuth

```
1. Usuário clica "Login com Google"
   ↓
2. Redirecionado para Google (OAuth consent)
   ↓
3. Google redireciona para /api/auth/callback com code
   ↓
4. Backend troca code por tokens (access + refresh)
   ↓
5. Supabase Auth cria registro em auth.users
   ↓
6. TRIGGER handle_new_user() cria profile automaticamente
   ↓
7. Backend verifica se user_id está em admins table
   ↓
8. Se SIM: seta cookies httpOnly e redireciona para /dashboard
   Se NÃO: retorna erro 403 "Not an admin"
```

### Trigger de Criação Automática de Profile

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**O que faz:**
- Quando usuário faz signup (OAuth ou email/phone)
- Automaticamente cria registro em `profiles`
- Usa dados do OAuth provider (nome, avatar)
- Se não tiver nome, usa parte do email antes do @

---

## Instalação

### Passo 1: Executar Schema SQL

```bash
# 1. Abra Supabase SQL Editor
# 2. Cole o conteúdo de docs/COMPLETE_DATABASE_SCHEMA.sql
# 3. Execute (Ctrl+Enter ou Cmd+Enter)
```

### Passo 2: Verificar Criação

```sql
-- Verificar tabelas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deve retornar 12 tabelas:
-- admin_logs, admins, applications, legal_acceptances,
-- payments, profile_edits, profiles, settings,
-- subscriptions, therapists, therapists_edit, verification_data
```

### Passo 3: Configurar OAuth Providers

Siga o guia em [docs/OAUTH_SETUP.md](OAUTH_SETUP.md) para configurar Google, Apple, Facebook.

### Passo 4: Criar Primeiro Admin

```sql
-- 1. Faça signup via OAuth (Google/Apple/Facebook)
-- 2. Copie seu UUID de auth.users
SELECT id, email FROM auth.users WHERE email = 'seu-email@example.com';

-- 3. Insira como superadmin
INSERT INTO public.admins (user_id, role)
VALUES ('uuid-copiado', 'superadmin');
```

### Passo 5: Configurar .env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key # NUNCA expor no client!
```

---

## RLS Policies

### Estratégia de Segurança

**Todas as tabelas usam a mesma policy:**

```sql
CREATE POLICY "Service role only" ON public.TABLE_NAME
  FOR ALL USING (auth.role() = 'service_role');
```

**O que isso significa:**
- ✅ Backend (usando `SUPABASE_SERVICE_ROLE_KEY`) tem acesso total
- ❌ Cliente (usando `NEXT_PUBLIC_SUPABASE_ANON_KEY`) NÃO tem acesso direto
- ❌ Usuários autenticados NÃO podem acessar via client-side

**Por que isso é seguro:**
- Tokens nunca expostos ao JavaScript do cliente
- Todas operações passam pelo backend Next.js
- Middleware valida admin em cada requisição
- Impossível bypass RLS via client-side

### Exemplo de Acesso Correto

```typescript
// ❌ ERRADO - Cliente tentando acessar direto
// src/components/UsersList.tsx
const { data } = await supabaseClient.from('users').select('*');
// Retorna: [] (vazio, bloqueado por RLS)

// ✅ CORRETO - Via API route (server-side)
// src/app/api/users/route.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('users').select('*');
  return Response.json({ data, error });
}

// src/components/UsersList.tsx
const response = await fetch('/api/users');
const { data } = await response.json();
```

---

## Funções RPC

### 1. `approve_therapist()`

Aprova um terapeuta e registra no audit log.

```typescript
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const { data, error } = await supabaseAdmin.rpc('approve_therapist', {
  therapist_id: 'uuid-do-terapeuta',
  admin_id: 'uuid-do-admin',
  notes: 'Documentos válidos',
});
```

**O que faz:**
1. Atualiza `therapists.status` para 'Active'
2. Define `reviewed_at` e `reviewed_by`
3. Limpa `rejection_reason`
4. Insere log em `admin_logs`

### 2. `reject_therapist()`

Rejeita um terapeuta com motivo.

```typescript
await supabaseAdmin.rpc('reject_therapist', {
  therapist_id: 'uuid',
  admin_id: 'uuid',
  rejection_reason: 'Documentos inválidos',
});
```

### 3. `activate_subscription()`

Ativa uma assinatura cancelada.

```typescript
await supabaseAdmin.rpc('activate_subscription', {
  subscription_id: 'uuid',
  admin_id: 'uuid',
});
```

### 4. `cancel_subscription()`

Cancela uma assinatura ativa.

```typescript
await supabaseAdmin.rpc('cancel_subscription', {
  subscription_id: 'uuid',
  admin_id: 'uuid',
});
```

### 5. `log_admin_action()`

Registra ação manual no audit log.

```typescript
await supabaseAdmin.rpc('log_admin_action', {
  action_name: 'delete_user',
  admin_id: 'uuid',
  target_type: 'user',
  target_id: 'uuid',
  metadata: { reason: 'Spam account' },
});
```

---

## Triggers

### 1. `on_auth_user_created`

**Quando:** Usuário faz signup (OAuth, Email OTP, Phone OTP)
**Ação:** Cria profile automaticamente
**Dados:** Nome e avatar do OAuth provider

### 2. `set_updated_at`

**Quando:** UPDATE em `profiles`, `therapists`, `settings`
**Ação:** Atualiza campo `updated_at` para `NOW()`
**Benefício:** Timestamp automático, não precisa passar no código

---

## Exemplos de Uso

### Exemplo 1: Criar Admin via API

```typescript
// src/app/api/admins/create/route.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth/server';

export async function POST(request: Request) {
  // Validar que é superadmin
  const { admin } = await requireAdmin();
  if (admin.role !== 'superadmin') {
    return Response.json({ error: 'Permission denied' }, { status: 403 });
  }

  const { user_id, role } = await request.json();

  // Criar admin
  const { data, error } = await supabaseAdmin
    .from('admins')
    .insert({ user_id, role, created_by: admin.id })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Log da ação
  await supabaseAdmin.rpc('log_admin_action', {
    action_name: 'create_admin',
    admin_id: admin.id,
    target_type: 'admin',
    target_id: data.id,
    metadata: { role },
  });

  return Response.json({ data });
}
```

### Exemplo 2: Listar Terapeutas com Filtros

```typescript
// src/app/api/therapists/route.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth/server';

export async function GET(request: Request) {
  await requireAdmin(); // Valida admin

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('therapists')
    .select('*, reviewed_by:admins!reviewed_by(id, user_id, role)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  return Response.json({
    data,
    error,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
```

### Exemplo 3: Dashboard Analytics

```typescript
// src/app/api/analytics/overview/route.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/auth/server';

export async function GET() {
  await requireAdmin();

  const [
    { count: totalUsers },
    { count: totalTherapists },
    { count: activeSubscriptions },
    { data: recentPayments },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('therapists').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
    supabaseAdmin.from('payments').select('*').order('created_at', { ascending: false }).limit(10),
  ]);

  return Response.json({
    overview: {
      totalUsers,
      totalTherapists,
      activeSubscriptions,
    },
    recentPayments,
  });
}
```

---

## Manutenção e Backups

### Backup Automático

Supabase faz backup automático diário. Para fazer backup manual:

```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Restore
supabase db reset
psql -d postgres -f backup.sql
```

### Monitoramento

```sql
-- Ver tamanho das tabelas
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver queries lentas
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Troubleshooting

### Erro: "permission denied for table X"

**Causa:** Cliente tentando acessar tabela diretamente.
**Solução:** Use `supabaseAdmin` em API route (server-side).

### Erro: "new row violates row-level security policy"

**Causa:** Tentando INSERT/UPDATE com `supabaseClient`.
**Solução:** Use `supabaseAdmin` (service role).

### Profile não criado automaticamente

**Causa:** Trigger não executou.
**Solução:** Verificar se trigger está ativo:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Usuário não consegue fazer login

**Causa:** `user_id` não está na tabela `admins`.
**Solução:** Inserir manualmente:

```sql
INSERT INTO public.admins (user_id, role)
VALUES ('uuid-do-usuario', 'viewer');
```

---

## Recursos Adicionais

- 📚 [Documentação Supabase](https://supabase.com/docs)
- 🔐 [Guia RLS](https://supabase.com/docs/guides/auth/row-level-security)
- 🔑 [OAuth Setup](./OAUTH_SETUP.md)
- 🚀 [Deploy Guide](./DEPLOY.md)

---

**Última atualização:** 2025
**Versão do Schema:** 2.0
