-- Onboarding, moderation, and donation tracking.

create table if not exists app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from app_admins
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_app_admin() to authenticated;

alter table app_admins enable row level security;

create policy "Admins can read admin list"
  on app_admins for select
  using (public.is_app_admin());

alter table user_profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_first_action text;

create table if not exists onboarding_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  electorate text,
  top_issues text[] not null default '{}',
  first_action text,
  source text not null default 'modal',
  created_at timestamptz not null default now()
);

create index if not exists idx_onboarding_events_created_at
  on onboarding_events(created_at desc);

create index if not exists idx_onboarding_events_user_id
  on onboarding_events(user_id);

alter table onboarding_events enable row level security;

create policy "Users can insert own onboarding events"
  on onboarding_events for insert
  with check (auth.uid() = user_id);

create policy "Users can read own onboarding events"
  on onboarding_events for select
  using (auth.uid() = user_id or public.is_app_admin());

create table if not exists content_reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null,
  target_id text not null,
  reason text not null,
  notes text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_content_reports_status_created
  on content_reports(status, created_at desc);

alter table content_reports enable row level security;

create policy "Authenticated users can create reports"
  on content_reports for insert
  with check (auth.uid() = reporter_id);

create policy "Admins can read reports"
  on content_reports for select
  using (public.is_app_admin());

create policy "Admins can update reports"
  on content_reports for update
  using (public.is_app_admin())
  with check (public.is_app_admin());

create table if not exists moderation_actions (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users(id) on delete set null,
  target_type text not null,
  target_id text not null,
  action text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_moderation_actions_created_at
  on moderation_actions(created_at desc);

alter table moderation_actions enable row level security;

create policy "Admins can read moderation actions"
  on moderation_actions for select
  using (public.is_app_admin());

create policy "Admins can create moderation actions"
  on moderation_actions for insert
  with check (public.is_app_admin() and auth.uid() = admin_id);

create table if not exists donation_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  amount_cents integer,
  currency text not null default 'aud',
  cadence text not null default 'one_time' check (cadence in ('one_time', 'monthly')),
  status text not null default 'started' check (status in ('started', 'paid', 'failed', 'refunded')),
  stripe_checkout_session_id text unique,
  source text not null default 'donate_page',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_donation_records_status_created
  on donation_records(status, created_at desc);

create index if not exists idx_donation_records_user_id
  on donation_records(user_id);

alter table donation_records enable row level security;

create policy "Users can read own donation records"
  on donation_records for select
  using (auth.uid() = user_id or public.is_app_admin());

create policy "Users can create own donation records"
  on donation_records for insert
  with check (auth.uid() = user_id);

create policy "Admins can update donation records"
  on donation_records for update
  using (public.is_app_admin())
  with check (public.is_app_admin());
