-- 027_ballots_ledger_reputation_election_modes.sql
--
-- Slim layer on top of the existing market engine:
--   007 issue_markets  -> one market per issue, probability + volumes
--   008 wallet staking -> user_wallets + wallet_positions + place_wallet_stake()
--   017 lifecycle      -> opens_at/closes_at, resolve_market(), is_market_open()
--
-- This migration adds ONLY what does not already exist:
--   1. ballots + ballot_items          (ballot builder)
--   2. point_ledger                    (append-only audit log)
--   3. user_reputation                 (derived accuracy + visibility)
--   4. election_modes                  (per-election config)
--   5. issue_markets.ballot_id         (link auto-generated markets to ballots)
--
-- Deliberately NOT added: predictions, prediction_resolutions, or any
-- parallel settlement path. Those duplicate 007/008/017 and would fork
-- the money-equivalent unit. When real-money lands later, swap the unit
-- in user_wallets/wallet_positions — the ledger and reputation keep working.

-- ── 1. Ballots ───────────────────────────────────────────────────────────────

create table if not exists ballots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ballot_items (
  id uuid primary key default gen_random_uuid(),
  ballot_id uuid not null references ballots(id) on delete cascade,
  rank integer not null check (rank >= 1),
  issue_id text references issues(id) on delete set null,
  position_text text not null default '',
  weight numeric(5,2) not null default 1 check (weight > 0),
  created_at timestamptz not null default now(),
  unique (ballot_id, rank)
);

create index if not exists idx_ballots_user_id on ballots(user_id);
create index if not exists idx_ballots_public on ballots(is_public) where is_public = true;
create index if not exists idx_ballot_items_ballot_id on ballot_items(ballot_id);
create index if not exists idx_ballot_items_issue_id on ballot_items(issue_id) where issue_id is not null;

alter table ballots enable row level security;
alter table ballot_items enable row level security;

create policy "Users read own ballots"
  on ballots for select
  using (auth.uid() = user_id or is_public = true);

create policy "Users insert own ballots"
  on ballots for insert
  with check (auth.uid() = user_id);

create policy "Users update own ballots"
  on ballots for update
  using (auth.uid() = user_id);

create policy "Users delete own ballots"
  on ballots for delete
  using (auth.uid() = user_id);

create policy "Public read ballot items of public ballots"
  on ballot_items for select
  using (
    exists (
      select 1 from ballots b
      where b.id = ballot_items.ballot_id
        and (b.is_public = true or b.user_id = auth.uid())
    )
  );

create policy "Users manage own ballot items"
  on ballot_items for all
  using (
    exists (
      select 1 from ballots b
      where b.id = ballot_items.ballot_id
        and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from ballots b
      where b.id = ballot_items.ballot_id
        and b.user_id = auth.uid()
    )
  );

-- ── 2. Point ledger (append-only) ────────────────────────────────────────────

create table if not exists point_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  balance_after integer not null,
  reference_type text not null check (reference_type in (
    'stake', 'payout', 'refund', 'bonus', 'penalty', 'admin_adjust'
  )),
  reference_id text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_point_ledger_user_created
  on point_ledger(user_id, created_at desc);
create index if not exists idx_point_ledger_reference
  on point_ledger(reference_type, reference_id) where reference_id is not null;

alter table point_ledger enable row level security;

create policy "Users read own ledger"
  on point_ledger for select
  using (auth.uid() = user_id);

-- Append-only: no update or delete policies. Inserts go through
-- security-definer RPCs (place_wallet_stake, resolve_market) or admin tools.

-- ── 3. User reputation (derived, updated on resolution) ───────────────────────

create table if not exists user_reputation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  predictions_made integer not null default 0,
  predictions_resolved integer not null default 0,
  predictions_correct integer not null default 0,
  accuracy numeric(5,2) check (accuracy >= 0 and accuracy <= 100),
  confidence_score numeric(5,2) not null default 0,
  visibility_boost numeric(5,2) not null default 1,
  total_points integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_reputation_visibility
  on user_reputation(visibility_boost desc);
create index if not exists idx_user_reputation_accuracy
  on user_reputation(accuracy desc nulls last);

alter table user_reputation enable row level security;

create policy "Public read reputation"
  on user_reputation for select
  using (true);

-- ── 4. Election modes ────────────────────────────────────────────────────────

create table if not exists election_modes (
  id text primary key,
  name text not null,
  election_date date not null,
  is_active boolean not null default false,
  countdown_enabled boolean not null default true,
  briefing_enabled boolean not null default true,
  feed_weighting_enabled boolean not null default false,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_election_modes_active
  on election_modes(is_active) where is_active = true;
create index if not exists idx_election_modes_date
  on election_modes(election_date);

alter table election_modes enable row level security;

create policy "Public read election modes"
  on election_modes for select
  using (true);

-- ── 5. Link auto-generated markets back to ballots ────────────────────────────

alter table issue_markets
  add column if not exists ballot_id uuid references ballots(id) on delete set null;

create index if not exists idx_issue_markets_ballot_id
  on issue_markets(ballot_id) where ballot_id is not null;