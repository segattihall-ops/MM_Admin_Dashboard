## Supabase: estrutura e RPCs

Use este script completo no SQL Editor do Supabase (ajuste o UUID do admin e as políticas de RLS conforme seu projeto).

```sql
-- 1) Tabela de settings para metadata/admin config
create table if not exists public.settings (
  id text primary key,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 2) Admin bootstrap (use o user_id/uuid do usuário do Supabase Auth, NÃO o e-mail literal)
-- Substitua pelo UUID real do usuário admin@xrankflow.com
insert into public.admins (id, user_id, role)
values (gen_random_uuid(), '<<AUTH_USER_UUID_AQUI>>', 'superadmin')
on conflict (user_id) do nothing;

-- 3) Tabela opcional para logs de ação administrativa
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admins(id),
  action_name text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 4) RPCs / procedures
-- Aprovar terapeuta
create or replace function public.approve_therapist(therapist_id uuid, admin_id uuid, notes text default null)
returns public.therapists
language plpgsql
security definer
as $$
declare
  updated public.therapists;
begin
  update public.therapists
  set status = 'Active',
      reviewed_at = now(),
      reviewed_by = admin_id,
      rejection_reason = null
  where id = therapist_id
  returning * into updated;

  return updated;
end;
$$;

-- Rejeitar terapeuta
create or replace function public.reject_therapist(therapist_id uuid, admin_id uuid, rejection_reason text default null)
returns public.therapists
language plpgsql
security definer
as $$
declare
  updated public.therapists;
begin
  update public.therapists
  set status = 'Rejected',
      reviewed_at = now(),
      reviewed_by = admin_id,
      rejection_reason = rejection_reason
  where id = therapist_id
  returning * into updated;

  return updated;
end;
$$;

-- Ativar assinatura
create or replace function public.activate_subscription(subscription_id uuid, admin_id uuid)
returns public.subscriptions
language plpgsql
security definer
as $$
declare
  updated public.subscriptions;
begin
  update public.subscriptions
  set status = 'Active',
      canceled_at = null
  where id = subscription_id
  returning * into updated;

  return updated;
end;
$$;

-- Cancelar assinatura
create or replace function public.cancel_subscription(subscription_id uuid, admin_id uuid)
returns public.subscriptions
language plpgsql
security definer
as $$
declare
  updated public.subscriptions;
begin
  update public.subscriptions
  set status = 'Canceled',
      canceled_at = now()
  where id = subscription_id
  returning * into updated;

  return updated;
end;
$$;

-- Log de ação admin
create or replace function public.log_admin_action(action_name text, admin_id uuid, metadata jsonb default '{}'::jsonb)
returns public.admin_logs
language sql
security definer
as $$
  insert into public.admin_logs (action_name, admin_id, metadata)
  values (action_name, admin_id, coalesce(metadata, '{}'::jsonb))
  returning *;
$$;

-- (Opcional) Políticas RLS de exemplo: liberar apenas service_role e admins
-- Ajuste conforme seu modelo; aqui só para referência rápida.
-- Exemplo para settings:
-- alter table public.settings enable row level security;
-- create policy "service_role_full_access_settings" on public.settings
--   for all using (auth.role() = 'service_role');
-- Recomendações adicionais:
-- enable row level security on verification_data, profile_edits, therapists_edit, payments, subscriptions
-- policies para permitir apenas auth.role() = 'service_role' ou user_id em admins com papel permitido.
```
