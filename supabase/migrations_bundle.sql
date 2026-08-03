-- ════════════════════════════════════════════════════════════════════════════
-- STICKEE — Combined migration bundle
-- ════════════════════════════════════════════════════════════════════════════
-- Paste this entire file into Supabase Studio → SQL Editor → Run.
-- Run once on a fresh project. Idempotent: safe to re-run (uses IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════════════════


-- ──────────────────────────────────────────────────────────────────────────
-- 001_initial.sql — predictions
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists predictions (
  id uuid default gen_random_uuid() primary key,
  issue_id text not null,
  prediction text not null check (prediction in ('yes', 'no')),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  created_at timestamptz default now()
);

create unique index if not exists unique_user_prediction
  on predictions (issue_id, user_id)
  where user_id is not null;

create unique index if not exists unique_session_prediction
  on predictions (issue_id, session_id)
  where session_id is not null;

alter table predictions enable row level security;

drop policy if exists "Anyone can read predictions" on predictions;
create policy "Anyone can read predictions"
  on predictions for select using (true);

drop policy if exists "Anyone can insert a prediction" on predictions;
create policy "Anyone can insert a prediction"
  on predictions for insert with check (true);


-- ──────────────────────────────────────────────────────────────────────────
-- 002_external_data.sql — members, divisions, member_votes
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists members (
  id uuid default gen_random_uuid() primary key,
  tvfy_id integer unique not null,
  name text not null,
  electorate text,
  party text,
  house text check (house in ('representatives', 'senate')),
  image_url text,
  synced_at timestamptz default now()
);

create table if not exists divisions (
  id uuid default gen_random_uuid() primary key,
  tvfy_id integer unique not null,
  name text not null,
  date date not null,
  house text check (house in ('representatives', 'senate')),
  source_url text,
  summary text,
  passed boolean,
  aye_count integer default 0,
  no_count integer default 0,
  abstain_count integer default 0,
  synced_at timestamptz default now()
);

create table if not exists member_votes (
  id uuid default gen_random_uuid() primary key,
  member_tvfy_id integer not null references members(tvfy_id) on delete cascade,
  division_tvfy_id integer not null references divisions(tvfy_id) on delete cascade,
  vote text not null check (vote in ('aye', 'no', 'abstain')),
  unique (member_tvfy_id, division_tvfy_id)
);

create index if not exists idx_member_votes_division on member_votes (division_tvfy_id);
create index if not exists idx_member_votes_member on member_votes (member_tvfy_id);
create index if not exists idx_divisions_date on divisions (date desc);
create index if not exists idx_members_house on members (house);

alter table members enable row level security;
alter table divisions enable row level security;
alter table member_votes enable row level security;

drop policy if exists "Public read members" on members;
create policy "Public read members" on members for select using (true);

drop policy if exists "Public read divisions" on divisions;
create policy "Public read divisions" on divisions for select using (true);

drop policy if exists "Public read member_votes" on member_votes;
create policy "Public read member_votes" on member_votes for select using (true);


-- ──────────────────────────────────────────────────────────────────────────
-- 003_civic_metrics.sql — pillar metrics, scores, ratings
-- ──────────────────────────────────────────────────────────────────────────

do $$ begin
  create type civic_pillar_id as enum (
    'cost-of-living', 'housing', 'crime-safety', 'jobs-economy', 'future'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type civic_status as enum ('green', 'yellow', 'red');
exception when duplicate_object then null; end $$;

do $$ begin
  create type trend_direction as enum ('improving', 'stable', 'worsening');
exception when duplicate_object then null; end $$;

create table if not exists pillar_metrics (
  id             uuid primary key default gen_random_uuid(),
  pillar_id      civic_pillar_id not null,
  metric_id      text not null,
  label          text not null,
  value          numeric(12, 4) not null,
  previous_value numeric(12, 4) not null,
  unit           text not null,
  trend_percent    numeric(8, 2) not null,
  trend_direction  trend_direction not null,
  status           civic_status not null,
  positive_when_up boolean not null default false,
  insight        text not null,
  source         text not null,
  period         date not null,
  synced_at      timestamptz not null default now(),
  unique (metric_id, period)
);

create index if not exists pillar_metrics_pillar_period
  on pillar_metrics (pillar_id, period desc);
create index if not exists pillar_metrics_metric_period
  on pillar_metrics (metric_id, period desc);

create table if not exists pillar_time_series (
  id        uuid primary key default gen_random_uuid(),
  metric_id text not null,
  date      date not null,
  value     numeric(12, 4) not null,
  unique (metric_id, date)
);

create index if not exists pillar_ts_metric_date
  on pillar_time_series (metric_id, date desc);

create table if not exists pillar_scores (
  id              uuid primary key default gen_random_uuid(),
  pillar_id       civic_pillar_id not null,
  period          date not null,
  state           text,
  lga             text,
  civic_score     smallint not null check (civic_score between 0 and 100),
  status          civic_status not null,
  trend_direction trend_direction not null,
  trend_percent   numeric(8, 2) not null,
  headline        text not null,
  summary         text not null,
  synced_at       timestamptz not null default now(),
  unique (pillar_id, period, state, lga)
);

create index if not exists pillar_scores_pillar_period
  on pillar_scores (pillar_id, period desc);

create table if not exists politician_pillar_ratings (
  id            uuid primary key default gen_random_uuid(),
  politician_id text not null,
  pillar_id     civic_pillar_id not null,
  period        date not null,
  status        civic_status not null,
  score         smallint not null check (score between 0 and 100),
  rationale     text not null,
  key_actions   text[] not null default '{}',
  civic_score   smallint not null check (civic_score between 0 and 100),
  synced_at     timestamptz not null default now(),
  unique (politician_id, pillar_id, period)
);

create index if not exists politician_ratings_id_period
  on politician_pillar_ratings (politician_id, period desc);

create table if not exists scoring_weights (
  id             uuid primary key default gen_random_uuid(),
  config_name    text not null unique,
  pillar_weights jsonb not null,
  metric_weights jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

alter table pillar_metrics enable row level security;
alter table pillar_time_series enable row level security;
alter table pillar_scores enable row level security;
alter table politician_pillar_ratings enable row level security;
alter table scoring_weights enable row level security;

drop policy if exists "public read pillar_metrics" on pillar_metrics;
create policy "public read pillar_metrics" on pillar_metrics for select using (true);

drop policy if exists "public read pillar_time_series" on pillar_time_series;
create policy "public read pillar_time_series" on pillar_time_series for select using (true);

drop policy if exists "public read pillar_scores" on pillar_scores;
create policy "public read pillar_scores" on pillar_scores for select using (true);

drop policy if exists "public read politician_ratings" on politician_pillar_ratings;
create policy "public read politician_ratings" on politician_pillar_ratings for select using (true);

drop policy if exists "public read scoring_weights" on scoring_weights;
create policy "public read scoring_weights" on scoring_weights for select using (true);

insert into scoring_weights (config_name, pillar_weights, metric_weights)
values (
  'default',
  '{"cost-of-living": 0.25, "housing": 0.25, "crime-safety": 0.15, "jobs-economy": 0.20, "future": 0.15}',
  '{}'
)
on conflict (config_name) do nothing;


-- ──────────────────────────────────────────────────────────────────────────
-- 004_leader_supports.sql
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists leader_supports (
  id             uuid default gen_random_uuid() primary key,
  leader_id      text not null,
  user_id        uuid not null references auth.users(id) on delete cascade,
  support_types  text[] not null,
  skills         text[] not null default '{}',
  availability   text check (availability in ('Weekend warrior', 'Few hours/week', 'Full-time')),
  postcode       text check (postcode ~ '^[0-9]{4}$'),
  state          text check (state in ('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT')),
  is_public      boolean not null default true,
  created_at     timestamptz not null default now()
);

create unique index if not exists unique_user_leader_support
  on leader_supports (leader_id, user_id);
create index if not exists idx_leader_supports_leader_id on leader_supports (leader_id);
create index if not exists idx_leader_supports_leader_state on leader_supports (leader_id, state);

alter table leader_supports enable row level security;

drop policy if exists "Public supports readable by all" on leader_supports;
create policy "Public supports readable by all"
  on leader_supports for select using (is_public = true);

drop policy if exists "Users can read their own support" on leader_supports;
create policy "Users can read their own support"
  on leader_supports for select using (auth.uid() = user_id);

drop policy if exists "Authenticated users can insert their own support" on leader_supports;
create policy "Authenticated users can insert their own support"
  on leader_supports for insert with check (auth.uid() = user_id and auth.uid() is not null);

drop policy if exists "Users can delete their own support" on leader_supports;
create policy "Users can delete their own support"
  on leader_supports for delete using (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────────────────
-- 005_bill_pressures.sql
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists bill_pressures (
  id           uuid primary key default gen_random_uuid(),
  bill_id      text not null,
  user_id      uuid references auth.users on delete cascade,
  session_id   text,
  stance       text not null check (stance in ('support', 'oppose')),
  action_type  text not null check (action_type in ('stance', 'email', 'share', 'campaign')),
  electorate   text,
  created_at   timestamptz default now() not null
);

create unique index if not exists bill_pressures_user_bill
  on bill_pressures (bill_id, user_id) where user_id is not null;
create unique index if not exists bill_pressures_session_bill
  on bill_pressures (bill_id, session_id) where session_id is not null;
create index if not exists bill_pressures_bill_id on bill_pressures (bill_id);
create index if not exists bill_pressures_created_at on bill_pressures (created_at);
create index if not exists bill_pressures_electorate on bill_pressures (bill_id, electorate)
  where electorate is not null;

alter table bill_pressures enable row level security;

drop policy if exists "public read bill_pressures" on bill_pressures;
create policy "public read bill_pressures"
  on bill_pressures for select using (true);

drop policy if exists "auth insert bill_pressures" on bill_pressures;
create policy "auth insert bill_pressures"
  on bill_pressures for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "auth update bill_pressures" on bill_pressures;
create policy "auth update bill_pressures"
  on bill_pressures for update using (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────────────────
-- 006_engagement.sql — wallets, streaks, reactions, comments, follows,
--                     profiles, notifications, push subs, signup trigger
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists user_wallets (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  balance            integer not null default 5000,
  total_earned       integer not null default 0,
  total_staked       integer not null default 0,
  last_daily_bonus   date,
  updated_at         timestamptz default now()
);

alter table user_wallets enable row level security;
drop policy if exists "Users can read own wallet" on user_wallets;
create policy "Users can read own wallet" on user_wallets for select using (auth.uid() = user_id);
drop policy if exists "Users can update own wallet" on user_wallets;
create policy "Users can update own wallet" on user_wallets for update using (auth.uid() = user_id);
drop policy if exists "Users can insert own wallet" on user_wallets;
create policy "Users can insert own wallet" on user_wallets for insert with check (auth.uid() = user_id);

create table if not exists wallet_positions (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  market_id       text not null,
  market_question text not null,
  category        text not null,
  direction       text not null check (direction in ('yes','no')),
  amount          integer not null,
  price           integer not null,
  shares          numeric(10,1) not null,
  status          text not null default 'open' check (status in ('open','won','lost')),
  payout          integer,
  created_at      timestamptz default now()
);

alter table wallet_positions enable row level security;
drop policy if exists "Users can manage own positions" on wallet_positions;
create policy "Users can manage own positions"
  on wallet_positions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists user_streaks (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  current_count     integer not null default 0,
  longest_count     integer not null default 0,
  last_action_date  date,
  freezes_available integer not null default 0,
  updated_at        timestamptz default now()
);

alter table user_streaks enable row level security;
drop policy if exists "Users can manage own streak" on user_streaks;
create policy "Users can manage own streak"
  on user_streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists feed_reactions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  post_id     text not null,
  reaction    text not null check (reaction in ('heart','fire','flag')),
  created_at  timestamptz default now(),
  unique (user_id, post_id, reaction)
);

alter table feed_reactions enable row level security;
drop policy if exists "Anyone can read reactions" on feed_reactions;
create policy "Anyone can read reactions" on feed_reactions for select using (true);
drop policy if exists "Users can manage own reactions" on feed_reactions;
create policy "Users can manage own reactions"
  on feed_reactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace view feed_reaction_counts as
  select post_id, reaction, count(*) as total
  from feed_reactions
  group by post_id, reaction;

create table if not exists comments (
  id          uuid default gen_random_uuid() primary key,
  post_id     text not null,
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null default 'Anonymous',
  author_handle text,
  body        text not null,
  parent_id   uuid references comments(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_comments_post_id on comments(post_id);
create index if not exists idx_comments_parent  on comments(parent_id);

alter table comments enable row level security;
drop policy if exists "Anyone can read comments" on comments;
create policy "Anyone can read comments" on comments for select using (true);
drop policy if exists "Authenticated users can insert comments" on comments;
create policy "Authenticated users can insert comments"
  on comments for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own comments" on comments;
create policy "Users can update own comments" on comments for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own comments" on comments;
create policy "Users can delete own comments" on comments for delete using (auth.uid() = user_id);

create table if not exists user_follows (
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id)
);

alter table user_follows enable row level security;
drop policy if exists "Anyone can read follows" on user_follows;
create policy "Anyone can read follows" on user_follows for select using (true);
drop policy if exists "Users can manage own follows" on user_follows;
create policy "Users can manage own follows"
  on user_follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

create table if not exists user_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  handle        text unique,
  display_name  text,
  bio           text,
  electorate    text,
  top_issues    text[],
  civic_score   integer default 0,
  avatar_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table user_profiles enable row level security;
drop policy if exists "Anyone can read profiles" on user_profiles;
create policy "Anyone can read profiles" on user_profiles for select using (true);
drop policy if exists "Users can manage own profile" on user_profiles;
create policy "Users can manage own profile"
  on user_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists notifications (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text not null,
  href        text,
  read        boolean not null default false,
  created_at  timestamptz default now()
);

create index if not exists idx_notifications_user on notifications(user_id, created_at desc);

alter table notifications enable row level security;
drop policy if exists "Users can read own notifications" on notifications;
create policy "Users can read own notifications" on notifications for select using (auth.uid() = user_id);
drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);
drop policy if exists "Service role can insert notifications" on notifications;
create policy "Service role can insert notifications" on notifications for insert with check (true);

create table if not exists push_subscriptions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth_key    text not null,
  created_at  timestamptz default now()
);

alter table push_subscriptions enable row level security;
drop policy if exists "Users can manage own push subscriptions" on push_subscriptions;
create policy "Users can manage own push subscriptions"
  on push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create wallet/streak/profile/welcome on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into user_wallets (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into user_streaks (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into user_profiles (user_id, handle, display_name)
  values (
    new.id,
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '', 'g')),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  insert into notifications (user_id, type, title, body, href)
  values (
    new.id,
    'bonus',
    'Welcome to Stickee!',
    'Your civic identity is ready. Start with 5,000 prediction points and make your first stake.',
    '/predictions'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ──────────────────────────────────────────────────────────────────────────
-- 007_issues_and_markets.sql
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists issues (
  id text primary key,
  title text not null,
  summary text not null,
  content text not null default '',
  what_is_happening text not null default '',
  who_supports text not null default '',
  who_opposes text not null default '',
  status text not null check (status in ('active', 'passed', 'rejected')),
  mp_yes_count integer not null default 0,
  mp_no_count integer not null default 0,
  mp_abstain_count integer not null default 0,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists issue_markets (
  issue_id text primary key references issues(id) on delete cascade,
  question text not null,
  category text not null default 'bill',
  status text not null default 'active' check (status in ('active', 'resolved-yes', 'resolved-no')),
  probability numeric(5,2) not null check (probability >= 0 and probability <= 100),
  total_participants integer not null default 0,
  resolves_by text not null,
  yes_change numeric(6,2) not null default 0,
  yes_volume integer not null default 0,
  no_volume integer not null default 0,
  yes_history integer[] not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists idx_issues_status on issues(status);
create index if not exists idx_issues_updated_at on issues(updated_at desc);
create index if not exists idx_issue_markets_updated_at on issue_markets(updated_at desc);

alter table issues enable row level security;
alter table issue_markets enable row level security;

drop policy if exists "Public read issues" on issues;
create policy "Public read issues" on issues for select using (true);
drop policy if exists "Public read issue_markets" on issue_markets;
create policy "Public read issue_markets" on issue_markets for select using (true);

do $$ begin alter publication supabase_realtime add table issues;
exception when duplicate_object then null; when others then null; end $$;
do $$ begin alter publication supabase_realtime add table issue_markets;
exception when duplicate_object then null; when others then null; end $$;
do $$ begin alter publication supabase_realtime add table predictions;
exception when duplicate_object then null; when others then null; end $$;


-- ──────────────────────────────────────────────────────────────────────────
-- 008_wallet_staking.sql — place_wallet_stake RPC
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.place_wallet_stake(
  p_market_id text,
  p_market_question text,
  p_category text,
  p_direction text,
  p_amount integer,
  p_price integer
)
returns table (position_id uuid, new_balance integer)
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_new_balance integer;
  v_position_id uuid;
  v_shares numeric(10,1);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_direction not in ('yes', 'no') then raise exception 'Invalid direction'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be greater than zero'; end if;
  if p_price is null or p_price <= 0 or p_price > 100 then raise exception 'Price must be between 1 and 100'; end if;

  insert into user_wallets (user_id) values (v_user_id) on conflict (user_id) do nothing;

  update user_wallets
    set balance = balance - p_amount,
        total_staked = total_staked + p_amount,
        updated_at = now()
    where user_id = v_user_id and balance >= p_amount
    returning balance into v_new_balance;

  if v_new_balance is null then raise exception 'Insufficient balance'; end if;

  v_shares := round(((p_amount::numeric / p_price::numeric) * 100) * 10) / 10;

  insert into wallet_positions (
    user_id, market_id, market_question, category, direction, amount, price, shares
  ) values (
    v_user_id, p_market_id, p_market_question, p_category, p_direction, p_amount, p_price, v_shares
  )
  returning id into v_position_id;

  return query select v_position_id, v_new_balance;
end;
$$;

grant execute on function public.place_wallet_stake(text, text, text, text, integer, integer) to authenticated;

do $$ begin alter publication supabase_realtime add table user_wallets;
exception when duplicate_object then null; when others then null; end $$;
do $$ begin alter publication supabase_realtime add table wallet_positions;
exception when duplicate_object then null; when others then null; end $$;


-- ──────────────────────────────────────────────────────────────────────────
-- 009_onboarding_admin_donations.sql
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_app_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_admins where user_id = auth.uid());
$$;

grant execute on function public.is_app_admin() to authenticated;

alter table app_admins enable row level security;
drop policy if exists "Admins can read admin list" on app_admins;
create policy "Admins can read admin list" on app_admins for select using (public.is_app_admin());

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

create index if not exists idx_onboarding_events_created_at on onboarding_events(created_at desc);
create index if not exists idx_onboarding_events_user_id on onboarding_events(user_id);

alter table onboarding_events enable row level security;
drop policy if exists "Users can insert own onboarding events" on onboarding_events;
create policy "Users can insert own onboarding events"
  on onboarding_events for insert with check (auth.uid() = user_id);
drop policy if exists "Users can read own onboarding events" on onboarding_events;
create policy "Users can read own onboarding events"
  on onboarding_events for select using (auth.uid() = user_id or public.is_app_admin());

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
drop policy if exists "Authenticated users can create reports" on content_reports;
create policy "Authenticated users can create reports"
  on content_reports for insert with check (auth.uid() = reporter_id);
drop policy if exists "Admins can read reports" on content_reports;
create policy "Admins can read reports" on content_reports for select using (public.is_app_admin());
drop policy if exists "Admins can update reports" on content_reports;
create policy "Admins can update reports"
  on content_reports for update using (public.is_app_admin()) with check (public.is_app_admin());

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
drop policy if exists "Admins can read moderation actions" on moderation_actions;
create policy "Admins can read moderation actions"
  on moderation_actions for select using (public.is_app_admin());
drop policy if exists "Admins can create moderation actions" on moderation_actions;
create policy "Admins can create moderation actions"
  on moderation_actions for insert with check (public.is_app_admin() and auth.uid() = admin_id);

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
create index if not exists idx_donation_records_user_id on donation_records(user_id);

alter table donation_records enable row level security;
drop policy if exists "Users can read own donation records" on donation_records;
create policy "Users can read own donation records"
  on donation_records for select using (auth.uid() = user_id or public.is_app_admin());
drop policy if exists "Users can create own donation records" on donation_records;
create policy "Users can create own donation records"
  on donation_records for insert with check (auth.uid() = user_id);
drop policy if exists "Admins can update donation records" on donation_records;
create policy "Admins can update donation records"
  on donation_records for update using (public.is_app_admin()) with check (public.is_app_admin());


-- ──────────────────────────────────────────────────────────────────────────
-- 010_donation_stripe_metadata.sql
-- ──────────────────────────────────────────────────────────────────────────

alter table donation_records
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists failure_reason text;

create index if not exists idx_donation_records_stripe_customer
  on donation_records(stripe_customer_id);
create index if not exists idx_donation_records_stripe_subscription
  on donation_records(stripe_subscription_id);


-- ──────────────────────────────────────────────────────────────────────────
-- 011_signup_handle_collision.sql
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  candidate_handle text;
  user_suffix text;
  attempt integer := 0;
begin
  insert into public.user_wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  base_handle := lower(regexp_replace(coalesce(split_part(new.email, '@', 1), ''), '[^a-z0-9]', '', 'g'));
  if base_handle = '' then
    base_handle := 'user';
  end if;

  candidate_handle := base_handle;
  user_suffix := substr(replace(new.id::text, '-', ''), 1, 8);

  loop
    begin
      insert into public.user_profiles (user_id, handle, display_name)
      values (
        new.id,
        candidate_handle,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), candidate_handle)
      )
      on conflict (user_id) do nothing;

      exit;
    exception
      when unique_violation then
        attempt := attempt + 1;
        if attempt = 1 then
          candidate_handle := base_handle || '_' || user_suffix;
        else
          candidate_handle := base_handle || '_' || user_suffix || '_' || attempt::text;
        end if;
    end;
  end loop;

  insert into public.notifications (user_id, type, title, body, href)
  values (
    new.id,
    'bonus',
    'Welcome to Stickee!',
    'Your civic identity is ready. Start with 5,000 prediction points and make your first stake.',
    '/predictions'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ──────────────────────────────────────────────────────────────────────────
-- 012_signup_metadata_handle.sql
-- The new multi-step sign-up flow lets users pick their own handle and
-- display name. Both arrive via supabase.auth.signUp({ options: { data }})
-- (raw_user_meta_data). Trigger now reads them when present, falls back
-- to email-derived behaviour otherwise.
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_handle      text;
  meta_display     text;
  base_handle      text;
  candidate_handle text;
  user_suffix      text;
  attempt          integer := 0;
begin
  insert into public.user_wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  meta_handle := nullif(
    lower(regexp_replace(coalesce(new.raw_user_meta_data->>'handle', ''), '[^a-z0-9_]', '', 'g')),
    ''
  );
  meta_display := nullif(
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name'
    ),
    ''
  );

  if meta_handle is not null and char_length(meta_handle) between 3 and 20 then
    base_handle := meta_handle;
  else
    base_handle := lower(regexp_replace(coalesce(split_part(new.email, '@', 1), ''), '[^a-z0-9]', '', 'g'));
    if base_handle = '' then
      base_handle := 'user';
    end if;
  end if;

  candidate_handle := base_handle;
  user_suffix := substr(replace(new.id::text, '-', ''), 1, 8);

  loop
    begin
      insert into public.user_profiles (user_id, handle, display_name)
      values (
        new.id,
        candidate_handle,
        coalesce(meta_display, split_part(new.email, '@', 1), candidate_handle)
      )
      on conflict (user_id) do nothing;

      exit;
    exception
      when unique_violation then
        attempt := attempt + 1;
        if attempt = 1 then
          candidate_handle := base_handle || '_' || user_suffix;
        else
          candidate_handle := base_handle || '_' || user_suffix || '_' || attempt::text;
        end if;
    end;
  end loop;

  insert into public.notifications (user_id, type, title, body, href)
  values (
    new.id,
    'bonus',
    'Welcome to Stickee!',
    'Your civic identity is ready. Start with 5,000 prediction points and make your first stake.',
    '/predictions'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ════════════════════════════════════════════════════════════════════════════
-- DONE. Verify by running:
--   select count(*) from user_profiles;            -- table exists
--   select tgname from pg_trigger where tgname = 'on_auth_user_created';  -- trigger present
-- ════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 014_daily_bonus_agent.sql
-- Seeds the Daily Bonus Distributor agent into the agents catalogue.
-- ─────────────────────────────────────────────────────────────────────────────

insert into agents (id, name, description, schedule_cron, enabled, config) values
  ('daily-bonus',
   'Daily Bonus Distributor',
   'Credits 100 civic points to every user wallet where last_daily_bonus < today. Runs once per day at 2 AM AEST (14:00 UTC). Non-destructive: skips wallets already credited today.',
   '0 14 * * *',
   true,
   '{"bonusPts": 100, "maxBatch": 5000}'::jsonb)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      schedule_cron = excluded.schedule_cron,
      config = excluded.config,
      updated_at = now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 015_feed_rpc.sql
-- Helper RPCs for atomic feed_posts count increments/decrements.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.increment_feed_count(p_post_id text, p_col text)
returns void language plpgsql security definer as $$
begin
  if p_col = 'hearts' then
    update feed_posts set hearts = hearts + 1 where id = p_post_id;
  elsif p_col = 'fires' then
    update feed_posts set fires = fires + 1 where id = p_post_id;
  elsif p_col = 'flags' then
    update feed_posts set flags = flags + 1 where id = p_post_id;
  elsif p_col = 'comment_count' then
    update feed_posts set comment_count = comment_count + 1 where id = p_post_id;
  elsif p_col = 'share_count' then
    update feed_posts set share_count = share_count + 1 where id = p_post_id;
  end if;
end; $$;

create or replace function public.decrement_feed_count(p_post_id text, p_col text)
returns void language plpgsql security definer as $$
begin
  if p_col = 'hearts' then
    update feed_posts set hearts = greatest(0, hearts - 1) where id = p_post_id;
  elsif p_col = 'fires' then
    update feed_posts set fires = greatest(0, fires - 1) where id = p_post_id;
  elsif p_col = 'flags' then
    update feed_posts set flags = greatest(0, flags - 1) where id = p_post_id;
  elsif p_col = 'comment_count' then
    update feed_posts set comment_count = greatest(0, comment_count - 1) where id = p_post_id;
  elsif p_col = 'share_count' then
    update feed_posts set share_count = greatest(0, share_count - 1) where id = p_post_id;
  end if;
end; $$;

grant execute on function public.increment_feed_count(text, text) to service_role;
grant execute on function public.decrement_feed_count(text, text) to service_role;
