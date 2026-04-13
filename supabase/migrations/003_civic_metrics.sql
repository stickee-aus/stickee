-- ─── Migration 003: Civic Metrics & Scorecards ───────────────────────────────
--
-- Tables for the 5-pillar civic analytics system.
-- All tables are append-only time-series; never UPDATE rows — INSERT new ones.
-- RLS: public read, authenticated write (admin role for bulk ingest).

-- ─── Enums ───────────────────────────────────────────────────────────────────

create type civic_pillar_id as enum (
  'cost-of-living',
  'housing',
  'crime-safety',
  'jobs-economy',
  'future'
);

create type civic_status as enum ('green', 'yellow', 'red');

create type trend_direction as enum ('improving', 'stable', 'worsening');

-- ─── pillar_metrics ──────────────────────────────────────────────────────────
-- One row per metric per period (monthly cadence).
-- Each row is a snapshot; query for the latest by (metric_id) to get current.

create table if not exists pillar_metrics (
  id             uuid primary key default gen_random_uuid(),

  pillar_id      civic_pillar_id not null,
  metric_id      text            not null,  -- e.g. 'cpi', 'rent-national'
  label          text            not null,

  -- Raw values
  value          numeric(12, 4)  not null,
  previous_value numeric(12, 4)  not null,
  unit           text            not null,  -- '%', '$', '/100k', 'index'

  -- Derived (can be recomputed, stored for query perf)
  trend_percent    numeric(8, 2)   not null,
  trend_direction  trend_direction not null,
  status           civic_status    not null,
  positive_when_up boolean         not null default false,

  -- Human-readable insight
  insight        text            not null,
  source         text            not null,

  -- Period this snapshot covers
  period         date            not null,  -- first day of the month, e.g. 2025-03-01

  synced_at      timestamptz     not null default now(),

  -- Unique constraint: one snapshot per metric per period
  unique (metric_id, period)
);

create index if not exists pillar_metrics_pillar_period
  on pillar_metrics (pillar_id, period desc);

create index if not exists pillar_metrics_metric_period
  on pillar_metrics (metric_id, period desc);

-- ─── pillar_time_series ──────────────────────────────────────────────────────
-- Granular time-series points for sparklines and charts.
-- Separate from pillar_metrics to keep that table lean.

create table if not exists pillar_time_series (
  id         uuid    primary key default gen_random_uuid(),
  metric_id  text    not null,
  date       date    not null,
  value      numeric(12, 4) not null,

  unique (metric_id, date)
);

create index if not exists pillar_ts_metric_date
  on pillar_time_series (metric_id, date desc);

-- ─── pillar_scores ───────────────────────────────────────────────────────────
-- Aggregated pillar-level scores per period and optional region.

create table if not exists pillar_scores (
  id              uuid primary key default gen_random_uuid(),

  pillar_id       civic_pillar_id not null,
  period          date            not null,

  -- Optional region scoping (null = national)
  state           text,           -- 'NSW', 'VIC', etc.
  lga             text,           -- Local Government Area

  civic_score     smallint        not null check (civic_score between 0 and 100),
  status          civic_status    not null,
  trend_direction trend_direction not null,
  trend_percent   numeric(8, 2)   not null,
  headline        text            not null,
  summary         text            not null,

  synced_at       timestamptz     not null default now(),

  unique (pillar_id, period, state, lga)
);

create index if not exists pillar_scores_pillar_period
  on pillar_scores (pillar_id, period desc);

-- ─── politician_pillar_ratings ────────────────────────────────────────────────
-- Per-politician rating for each pillar, snapshotted monthly.

create table if not exists politician_pillar_ratings (
  id            uuid primary key default gen_random_uuid(),

  -- References members.tvfy_id if available, else free-form identifier
  politician_id text            not null,
  pillar_id     civic_pillar_id not null,
  period        date            not null,

  status        civic_status    not null,
  score         smallint        not null check (score between 0 and 100),
  rationale     text            not null,
  key_actions   text[]          not null default '{}',

  civic_score   smallint        not null check (civic_score between 0 and 100),

  synced_at     timestamptz     not null default now(),

  unique (politician_id, pillar_id, period)
);

create index if not exists politician_ratings_id_period
  on politician_pillar_ratings (politician_id, period desc);

-- ─── scoring_weights ─────────────────────────────────────────────────────────
-- Configurable weights for custom Level 3 scoring.
-- One row per named configuration (e.g. 'default', 'user-<id>').

create table if not exists scoring_weights (
  id             uuid primary key default gen_random_uuid(),
  config_name    text  not null unique,  -- 'default' or user session id
  pillar_weights jsonb not null,         -- { "housing": 0.3, "cost-of-living": 0.2, ... }
  metric_weights jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table pillar_metrics             enable row level security;
alter table pillar_time_series         enable row level security;
alter table pillar_scores              enable row level security;
alter table politician_pillar_ratings  enable row level security;
alter table scoring_weights            enable row level security;

-- Public read-only
create policy "public read pillar_metrics"
  on pillar_metrics for select using (true);

create policy "public read pillar_time_series"
  on pillar_time_series for select using (true);

create policy "public read pillar_scores"
  on pillar_scores for select using (true);

create policy "public read politician_ratings"
  on politician_pillar_ratings for select using (true);

create policy "public read scoring_weights"
  on scoring_weights for select using (true);

-- ─── Seed: default scoring weights ───────────────────────────────────────────

insert into scoring_weights (config_name, pillar_weights, metric_weights)
values (
  'default',
  '{"cost-of-living": 0.25, "housing": 0.25, "crime-safety": 0.15, "jobs-economy": 0.20, "future": 0.15}',
  '{}'
)
on conflict (config_name) do nothing;

-- ─── Comments ────────────────────────────────────────────────────────────────

comment on table pillar_metrics is
  'Monthly snapshots of individual civic metrics per pillar. Source of truth for current status.';

comment on table pillar_time_series is
  'Granular time-series data points for sparkline charts and trend analysis.';

comment on table pillar_scores is
  'Aggregated pillar-level scores; supports national + state + LGA segmentation.';

comment on table politician_pillar_ratings is
  'Monthly pillar ratings per politician derived from voting record and public commitments.';

comment on table scoring_weights is
  'Configurable pillar weights for Level 3 custom scoring (default + per-user configs).';
