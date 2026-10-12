-- Security remediation prepared for review. Do not apply to production without
-- an explicit environment check and approval.

-- Stripe checkout retries use one durable application attempt id. This is
-- separate from the Stripe Session id because it exists before Stripe replies.
alter table public.donation_records
  add column if not exists checkout_attempt_id uuid;

create unique index if not exists donation_records_checkout_attempt_id_key
  on public.donation_records(checkout_attempt_id);

-- Browsers must not be able to create a row already labelled paid. Donation
-- records are created and mutated only by the server-side service role.
drop policy if exists "Users can create own donation records" on public.donation_records;
revoke insert, update, delete on public.donation_records from anon, authenticated;

-- Durable Stripe event claims. No client policies are intentionally created.
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  object_id text not null,
  livemode boolean not null,
  status text not null check (status in ('processing', 'processed', 'failed')),
  attempts integer not null default 1 check (attempts > 0),
  received_at timestamptz not null default now(),
  processing_started_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from public, anon, authenticated;

create or replace function public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_object_id text,
  p_livemode boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required';
  end if;

  if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]+$' then
    raise exception 'invalid Stripe event id';
  end if;

  insert into public.stripe_webhook_events (
    event_id, event_type, object_id, livemode, status
  ) values (
    p_event_id, p_event_type, p_object_id, p_livemode, 'processing'
  )
  on conflict (event_id) do update
    set status = 'processing',
        attempts = public.stripe_webhook_events.attempts + 1,
        processing_started_at = now(),
        last_error = null
    where public.stripe_webhook_events.status = 'failed'
       or (
         public.stripe_webhook_events.status = 'processing'
         and public.stripe_webhook_events.processing_started_at < now() - interval '5 minutes'
       )
  returning event_id into v_claimed;

  return v_claimed is not null;
end;
$$;

revoke all on function public.claim_stripe_webhook_event(text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.claim_stripe_webhook_event(text, text, text, boolean)
  to service_role;

-- Authenticated users may mark their own notifications read, but may not
-- rewrite notification content, links, type, ownership, or create arbitrary
-- notifications. The service role bypasses RLS for legitimate delivery.
drop policy if exists "Service role can insert notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can mark own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read) on public.notifications to authenticated;

-- civic_score is computed, not self-asserted. Preserve ordinary profile edits
-- with an explicit column grant while removing table-wide update access.
revoke insert, update, delete on public.user_profiles from anon, authenticated;
grant update (
  handle, display_name, bio, electorate, top_issues, avatar_url,
  onboarding_completed_at, onboarding_first_action, updated_at
) on public.user_profiles to authenticated;

-- Record one civic-score award per issue and user, even if an issue status is
-- corrected or the resolver is retried concurrently.
create table if not exists public.prediction_civic_awards (
  issue_id text not null references public.issues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  resolved_status text not null check (resolved_status in ('passed', 'rejected')),
  points integer not null check (points > 0),
  awarded_at timestamptz not null default now(),
  primary key (issue_id, user_id)
);

alter table public.prediction_civic_awards enable row level security;
revoke all on public.prediction_civic_awards from public, anon, authenticated;

create or replace function public.award_prediction_civic_score(
  p_issue_id text,
  p_user_id uuid,
  p_resolved_status text,
  p_points integer default 2
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted uuid;
  v_expected_prediction text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required';
  end if;
  if p_resolved_status not in ('passed', 'rejected') or p_points <= 0 then
    raise exception 'invalid award';
  end if;

  v_expected_prediction := case when p_resolved_status = 'passed' then 'yes' else 'no' end;
  if not exists (
    select 1 from public.issues
    where id = p_issue_id and status = p_resolved_status
  ) or not exists (
    select 1 from public.predictions
    where issue_id = p_issue_id
      and user_id = p_user_id
      and prediction = v_expected_prediction
  ) then
    return false;
  end if;

  insert into public.prediction_civic_awards (
    issue_id, user_id, resolved_status, points
  ) values (
    p_issue_id, p_user_id, p_resolved_status, p_points
  )
  on conflict (issue_id, user_id) do nothing
  returning user_id into v_inserted;

  if v_inserted is null then return false; end if;

  update public.user_profiles
  set civic_score = coalesce(civic_score, 0) + p_points,
      updated_at = now()
  where user_id = p_user_id;

  return true;
end;
$$;

revoke all on function public.award_prediction_civic_score(text, uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.award_prediction_civic_score(text, uuid, text, integer)
  to service_role;

-- Harden the existing admin predicate against PUBLIC execution and search-path
-- substitution. App code still supports explicit environment allowlists, but
-- ordinary database callers cannot use this function anonymously.
create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins where user_id = auth.uid()
  );
$$;
revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to anon, authenticated, service_role;

-- Migration 015 granted service_role but did not revoke PostgreSQL's default
-- PUBLIC execute privilege.
revoke all on function public.increment_feed_count(text, text) from public, anon, authenticated;
revoke all on function public.decrement_feed_count(text, text) from public, anon, authenticated;
grant execute on function public.increment_feed_count(text, text) to service_role;
grant execute on function public.decrement_feed_count(text, text) to service_role;
