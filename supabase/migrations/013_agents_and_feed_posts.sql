-- ─────────────────────────────────────────────────────────────────────────────
-- 013_agents_and_feed_posts.sql
-- Background agents + persisted feed posts (for ranked feed).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Agents catalogue ──────────────────────────────────────────────────────

create table if not exists agents (
  id              text primary key,                -- slug, e.g. "parliament-watcher"
  name            text not null,
  description     text not null,
  schedule_cron   text,                            -- cron expression, null = manual only
  enabled         boolean not null default true,
  last_run_at     timestamptz,
  last_status     text check (last_status in ('ok','warn','error') or last_status is null),
  last_summary    text,
  last_items      integer not null default 0,      -- items written in last run
  next_run_at     timestamptz,
  config          jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table agents enable row level security;

create policy "Admins can read agents"
  on agents for select
  using (public.is_app_admin());

create policy "Admins can update agents"
  on agents for update
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- ── 2. Agent runs (history) ──────────────────────────────────────────────────

create table if not exists agent_runs (
  id               uuid default gen_random_uuid() primary key,
  agent_id         text not null references agents(id) on delete cascade,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  status           text not null default 'running'
                     check (status in ('running','ok','warn','error')),
  items_processed  integer not null default 0,
  items_written    integer not null default 0,
  summary          text,
  error            text,
  trigger          text not null default 'cron'
                     check (trigger in ('cron','manual','webhook'))
);

create index if not exists idx_agent_runs_agent_started
  on agent_runs (agent_id, started_at desc);

create index if not exists idx_agent_runs_started
  on agent_runs (started_at desc);

alter table agent_runs enable row level security;

create policy "Admins can read agent runs"
  on agent_runs for select
  using (public.is_app_admin());

-- ── 3. Persisted feed posts (used by ranked feed) ────────────────────────────
-- Mirrors the FeedPost shape in src/lib/mock-feed-data.ts so the existing UI
-- can be backed by real rows once the ranker is wired up.

create table if not exists feed_posts (
  id                   text primary key,                  -- slug; agents pick a stable id
  type                 text not null
                         check (type in ('user_post','civic_alert','leader_update','decision_update')),
  author_id            text,                              -- e.g. 'system', user_id, leader slug
  author_name          text not null,
  author_handle        text not null,
  author_verified      boolean not null default false,
  civic_score          integer,
  content              text not null,
  linked_pillar_id     text,
  linked_decision_id   text,
  linked_leader_id     text,
  linked_bill_id       text,
  linked_electorate    text,
  posted_at            timestamptz not null default now(),
  hearts               integer not null default 0,
  fires                integer not null default 0,
  flags                integer not null default 0,
  comment_count        integer not null default 0,
  share_count          integer not null default 0,
  is_boost             boolean not null default false,    -- algorithmic boost flag
  source_agent_id      text references agents(id) on delete set null,
  created_at           timestamptz not null default now()
);

create index if not exists idx_feed_posts_posted_at on feed_posts (posted_at desc);
create index if not exists idx_feed_posts_type      on feed_posts (type);
create index if not exists idx_feed_posts_pillar    on feed_posts (linked_pillar_id) where linked_pillar_id is not null;
create index if not exists idx_feed_posts_author    on feed_posts (author_id) where author_id is not null;

alter table feed_posts enable row level security;

create policy "Public read feed_posts"
  on feed_posts for select
  using (true);

-- Authenticated users may write their own user_post entries
create policy "Users can insert own posts"
  on feed_posts for insert
  with check (
    auth.uid()::text = author_id
    and type = 'user_post'
  );

create policy "Users can update own posts"
  on feed_posts for update
  using (auth.uid()::text = author_id);

-- ── 4. Feed impression / interaction log (lightweight, for ranker) ───────────

create table if not exists feed_impressions (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete set null,
  post_id     text not null,
  surface     text not null default 'feed',
  dwell_ms    integer,
  created_at  timestamptz not null default now()
);

create index if not exists idx_feed_impressions_user_post
  on feed_impressions (user_id, post_id, created_at desc);

alter table feed_impressions enable row level security;

create policy "Users can insert own impressions"
  on feed_impressions for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can read own impressions"
  on feed_impressions for select
  using (auth.uid() = user_id or public.is_app_admin());

-- ── 5. Seed the six default agents ───────────────────────────────────────────

insert into agents (id, name, description, schedule_cron, enabled, config) values
  ('parliament-watcher',
   'Parliament Watcher',
   'Polls TheyVoteForYou for new divisions and posts civic alerts when a member''s vote diverges from their party line.',
   '*/15 * * * *',
   true,
   '{"house":"representatives","lookbackDays":1}'::jsonb),

  ('bill-stage-tracker',
   'Bill Stage Tracker',
   'Detects bill stage transitions (introduced → 2nd reading → committee → assent) and emits decision_update posts plus notifications to users who pressured the bill.',
   '0 */2 * * *',
   true,
   '{"lookbackDays":3}'::jsonb),

  ('mp-scorecard',
   'MP Scorecard Recalculator',
   'Recomputes each MP''s civic score (alignment with their electorate''s priorities). Posts leader_update when a score moves by more than 5 points.',
   '0 3 * * *',
   true,
   '{"thresholdDelta":5}'::jsonb),

  ('electorate-pulse',
   'Electorate Pulse',
   'Aggregates weekly user activity per electorate and posts a digest tagged to the pillar that moved most.',
   '0 9 * * MON',
   true,
   '{"minActivity":3}'::jsonb),

  ('prediction-resolver',
   'Prediction Resolver',
   'Grades predictions whose underlying bill or vote has resolved, updates civic scores, posts a results card.',
   '*/30 * * * *',
   true,
   '{}'::jsonb),

  ('moderation-triage',
   'Moderation Triage',
   'Classifies new content_reports (spam / harassment / policy / real flag), auto-resolves obvious spam, escalates the rest with a suggested action label.',
   '*/5 * * * *',
   true,
   '{"autoResolveSpam":true}'::jsonb)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      schedule_cron = excluded.schedule_cron,
      config = excluded.config,
      updated_at = now();
