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

create policy "Public read issues"
  on issues for select
  using (true);

create policy "Public read issue_markets"
  on issue_markets for select
  using (true);

do $$
begin
  alter publication supabase_realtime add table issues;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table issue_markets;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table predictions;
exception
  when duplicate_object then null;
end
$$;
