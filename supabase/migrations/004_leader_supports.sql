-- Leader supports table
-- Captures structured civic support for future leaders.
-- Auth required: user_id references auth.users and is enforced by RLS.
-- Rate limiting: unique index on (leader_id, user_id) — one record per user per leader.

create table if not exists leader_supports (
  id             uuid        default gen_random_uuid() primary key,
  leader_id      text        not null,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  support_types  text[]      not null,
  skills         text[]      not null default '{}',
  availability   text        check (availability in ('Weekend warrior', 'Few hours/week', 'Full-time')),
  postcode       text        check (postcode ~ '^[0-9]{4}$'),
  state          text        check (state in ('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT')),
  is_public      boolean     not null default true,
  created_at     timestamptz not null default now()
);

-- One support record per user per leader
create unique index if not exists unique_user_leader_support
  on leader_supports (leader_id, user_id);

-- Index for counting supporters by leader
create index if not exists idx_leader_supports_leader_id
  on leader_supports (leader_id);

-- Index for local momentum queries (leader + state)
create index if not exists idx_leader_supports_leader_state
  on leader_supports (leader_id, state);

-- Row Level Security
alter table leader_supports enable row level security;

create policy "Public supports readable by all"
  on leader_supports for select
  using (is_public = true);

create policy "Users can read their own support"
  on leader_supports for select
  using (auth.uid() = user_id);

create policy "Authenticated users can insert their own support"
  on leader_supports for insert
  with check (auth.uid() = user_id and auth.uid() is not null);

create policy "Users can delete their own support"
  on leader_supports for delete
  using (auth.uid() = user_id);
