-- =============================================
-- SUPABASE SCHEMA MIGRATION
-- =============================================
-- This file contains the complete database schema for the admin dashboard.
-- Execute this in your Supabase SQL editor.
--
-- After running this:
-- 1. Set NEXT_PUBLIC_SUPABASE_URL in your environment
-- 2. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment
-- 3. Set SUPABASE_SERVICE_ROLE_KEY in your environment (KEEP SECRET!)
-- =============================================

-- =============================================
-- TABLES
-- =============================================
-- Note: Supabase already provides auth.users table for authentication
-- We reference it instead of creating a duplicate users table

-- Profiles table (extends auth.users with additional user data)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Admins table (must be created before admin_logs due to foreign key)
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text check (role in ('superadmin', 'manager', 'viewer')),
  created_at timestamptz default now(),
  unique(user_id)
);

-- Therapists table
create table if not exists public.therapists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  email text,
  status text,
  plan text,
  plan_name text,
  subscription_status text,
  slug text unique,
  phone text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.admins(id),
  rejection_reason text,
  document_url text,
  card_url text,
  selfie_url text,
  signed_term_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Verification data table
create table if not exists public.verification_data (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid references public.therapists(id) on delete cascade,
  status text,
  document_url text,
  card_url text,
  selfie_url text,
  signed_term_url text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.admins(id),
  notes text
);

-- Payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric,
  status text,
  paid_at timestamptz,
  invoice_id text,
  created_at timestamptz default now()
);

-- Subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan_id text,
  status text,
  start_date timestamptz,
  end_date timestamptz,
  canceled_at timestamptz,
  created_at timestamptz default now()
);

-- Therapist edits table (for pending profile changes)
create table if not exists public.therapists_edit (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid references public.therapists(id) on delete cascade,
  changes jsonb default '{}'::jsonb,
  status text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Profile edits table (for pending profile changes)
create table if not exists public.profile_edits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  changes jsonb default '{}'::jsonb,
  status text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Applications table
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text,
  email text,
  status text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  notes text
);

-- Legal acceptances table
create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  version text,
  accepted_at timestamptz,
  ip_address text
);

-- Admin logs table (for audit trail)
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admins(id) on delete cascade,
  action_name text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- =============================================
-- INDEXES (for better query performance)
-- =============================================
-- Note: profiles.id is the primary key (references auth.users), so no need for separate index
create index if not exists idx_therapists_user_id on public.therapists(user_id);
create index if not exists idx_therapists_status on public.therapists(status);
create index if not exists idx_verification_therapist_id on public.verification_data(therapist_id);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_admin_logs_admin_id on public.admin_logs(admin_id);
create index if not exists idx_admins_user_id on public.admins(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
-- These policies ensure that ONLY the service role can perform mutations.
-- The anon key will have read-only access (if needed) or no access.
-- =============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.therapists enable row level security;
alter table public.verification_data enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.therapists_edit enable row level security;
alter table public.profile_edits enable row level security;
alter table public.applications enable row level security;
alter table public.admins enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.admin_logs enable row level security;

-- =============================================
-- SERVICE ROLE ONLY POLICIES
-- =============================================
-- Only the service role (authenticated backend) can perform any operations.
-- This prevents direct client access to sensitive data.
-- Note: auth.users is managed by Supabase Auth, no policies needed
-- =============================================

-- Profiles policies
create policy "Service role only: profiles select" on public.profiles
  for select using (auth.role() = 'service_role');
create policy "Service role only: profiles insert" on public.profiles
  for insert with check (auth.role() = 'service_role');
create policy "Service role only: profiles update" on public.profiles
  for update using (auth.role() = 'service_role');
create policy "Service role only: profiles delete" on public.profiles
  for delete using (auth.role() = 'service_role');

-- Therapists policies
create policy "Service role only: therapists select" on public.therapists
  for select using (auth.role() = 'service_role');
create policy "Service role only: therapists insert" on public.therapists
  for insert with check (auth.role() = 'service_role');
create policy "Service role only: therapists update" on public.therapists
  for update using (auth.role() = 'service_role');
create policy "Service role only: therapists delete" on public.therapists
  for delete using (auth.role() = 'service_role');

-- Verification data policies
create policy "Service role only: verification_data select" on public.verification_data
  for select using (auth.role() = 'service_role');
create policy "Service role only: verification_data insert" on public.verification_data
  for insert with check (auth.role() = 'service_role');
create policy "Service role only: verification_data update" on public.verification_data
  for update using (auth.role() = 'service_role');
create policy "Service role only: verification_data delete" on public.verification_data
  for delete using (auth.role() = 'service_role');

-- Payments policies
create policy "Service role only: payments select" on public.payments
  for select using (auth.role() = 'service_role');
create policy "Service role only: payments insert" on public.payments
  for insert with check (auth.role() = 'service_role');
create policy "Service role only: payments update" on public.payments
  for update using (auth.role() = 'service_role');
create policy "Service role only: payments delete" on public.payments
  for delete using (auth.role() = 'service_role');

-- Subscriptions policies
create policy "Service role only: subscriptions select" on public.subscriptions
  for select using (auth.role() = 'service_role');
create policy "Service role only: subscriptions insert" on public.subscriptions
  for insert with check (auth.role() = 'service_role');
create policy "Service role only: subscriptions update" on public.subscriptions
  for update using (auth.role() = 'service_role');
create policy "Service role only: subscriptions delete" on public.subscriptions
  for delete using (auth.role() = 'service_role');

-- Therapist edits policies
create policy "Service role only: therapists_edit select" on public.therapists_edit
  for select using (auth.role() = 'service_role');
create policy "Service role only: therapists_edit insert" on public.therapists_edit
  for insert with check (auth.role() = 'service_role');
create policy "Service role only: therapists_edit update" on public.therapists_edit
  for update using (auth.role() = 'service_role');
create policy "Service role only: therapists_edit delete" on public.therapists_edit
  for delete using (auth.role() = 'service_role');

-- Profile edits policies
create policy "Service role only: profile_edits select" on public.profile_edits
  for select using (auth.role() = 'service_role');
create policy "Service role only: profile_edits insert" on public.profile_edits
  for insert with check (auth.role() = 'service_role');
create policy "Service role only: profile_edits update" on public.profile_edits
  for update using (auth.role() = 'service_role');
create policy "Service role only: profile_edits delete" on public.profile_edits
  for delete using (auth.role() = 'service_role');

-- Applications policies
create policy "Service role only: applications select" on public.applications
  for select using (auth.role() = 'service_role');
create policy "Service role only: applications insert" on public.applications
  for insert with check (auth.role() = 'service_role');
create policy "Service role only: applications update" on public.applications
  for update using (auth.role() = 'service_role');
create policy "Service role only: applications delete" on public.applications
  for delete using (auth.role() = 'service_role');

-- Admins policies
create policy "Service role only: admins select" on public.admins
  for select using (auth.role() = 'service_role');
create policy "Service role only: admins insert" on public.admins
  for insert with check (auth.role() = 'service_role');
create policy "Service role only: admins update" on public.admins
  for update using (auth.role() = 'service_role');
create policy "Service role only: admins delete" on public.admins
  for delete using (auth.role() = 'service_role');

-- Legal acceptances policies
create policy "Service role only: legal_acceptances select" on public.legal_acceptances
  for select using (auth.role() = 'service_role');
create policy "Service role only: legal_acceptances insert" on public.legal_acceptances
  for insert with check (auth.role() = 'service_role');
create policy "Service role only: legal_acceptances update" on public.legal_acceptances
  for update using (auth.role() = 'service_role');
create policy "Service role only: legal_acceptances delete" on public.legal_acceptances
  for delete using (auth.role() = 'service_role');

-- Admin logs policies
create policy "Service role only: admin_logs select" on public.admin_logs
  for select using (auth.role() = 'service_role');
create policy "Service role only: admin_logs insert" on public.admin_logs
  for insert with check (auth.role() = 'service_role');
create policy "Service role only: admin_logs update" on public.admin_logs
  for update using (auth.role() = 'service_role');
create policy "Service role only: admin_logs delete" on public.admin_logs
  for delete using (auth.role() = 'service_role');

-- =============================================
-- STORED PROCEDURES / RPC FUNCTIONS
-- =============================================

-- Approve therapist profile
create or replace function public.approve_therapist(therapist_id uuid, admin_id uuid, notes text default null)
returns therapists
language plpgsql
security definer
as $$
declare
  updated therapists;
begin
  update therapists
  set status = 'Active',
      reviewed_at = now(),
      reviewed_by = admin_id,
      rejection_reason = null
  where id = therapist_id
  returning * into updated;

  return updated;
end;
$$;

-- Reject therapist profile
create or replace function public.reject_therapist(therapist_id uuid, admin_id uuid, rejection_reason text default null)
returns therapists
language plpgsql
security definer
as $$
declare
  updated therapists;
begin
  update therapists
  set status = 'Rejected',
      reviewed_at = now(),
      reviewed_by = admin_id,
      rejection_reason = rejection_reason
  where id = therapist_id
  returning * into updated;

  return updated;
end;
$$;

-- Activate a subscription
create or replace function public.activate_subscription(subscription_id uuid, admin_id uuid)
returns subscriptions
language plpgsql
security definer
as $$
declare
  updated subscriptions;
begin
  update subscriptions
  set status = 'Active',
      canceled_at = null
  where id = subscription_id
  returning * into updated;

  return updated;
end;
$$;

-- Cancel a subscription
create or replace function public.cancel_subscription(subscription_id uuid, admin_id uuid)
returns subscriptions
language plpgsql
security definer
as $$
declare
  updated subscriptions;
begin
  update subscriptions
  set status = 'Canceled',
      canceled_at = now()
  where id = subscription_id
  returning * into updated;

  return updated;
end;
$$;

-- Log admin action
create or replace function public.log_admin_action(action_name text, admin_id uuid, metadata jsonb default '{}'::jsonb)
returns admin_logs
language sql
security definer
as $$
  insert into admin_logs (action_name, admin_id, metadata)
  values (action_name, admin_id, coalesce(metadata, '{}'::jsonb))
  returning *;
$$;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
-- Grant usage on schema to authenticated and anon roles (but RLS will control access)
grant usage on schema public to anon, authenticated, service_role;

-- Grant execute on functions to service_role only
grant execute on function public.approve_therapist to service_role;
grant execute on function public.reject_therapist to service_role;
grant execute on function public.activate_subscription to service_role;
grant execute on function public.cancel_subscription to service_role;
grant execute on function public.log_admin_action to service_role;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Next steps:
-- 1. Verify all tables were created: Check Supabase Table Editor
-- 2. Test RLS policies: Try accessing tables with anon key (should fail)
-- 3. Test service role: Use service role key in backend (should work)
-- 4. Set environment variables in your .env.local file
-- =============================================
