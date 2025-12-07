-- Administrative stored procedures for the dashboard.

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

-- Table + function to log admin actions
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admins(id),
  action_name text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create or replace function public.log_admin_action(action_name text, admin_id uuid, metadata jsonb default '{}'::jsonb)
returns admin_logs
language sql
security definer
as $$
  insert into admin_logs (action_name, admin_id, metadata)
  values (action_name, admin_id, coalesce(metadata, '{}'::jsonb))
  returning *;
$$;
