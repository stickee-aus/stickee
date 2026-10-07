-- Members sourced from TheyVoteForYou (current House + Senate members)
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

-- Parliamentary divisions (votes on bills/motions) from TheyVoteForYou
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

-- Per-member vote on each division
create table if not exists member_votes (
  id uuid default gen_random_uuid() primary key,
  member_tvfy_id integer not null references members(tvfy_id) on delete cascade,
  division_tvfy_id integer not null references divisions(tvfy_id) on delete cascade,
  vote text not null check (vote in ('aye', 'no', 'abstain')),
  unique (member_tvfy_id, division_tvfy_id)
);

-- Indexes for fast lookups
create index if not exists idx_member_votes_division on member_votes (division_tvfy_id);
create index if not exists idx_member_votes_member on member_votes (member_tvfy_id);
create index if not exists idx_divisions_date on divisions (date desc);
create index if not exists idx_members_house on members (house);

-- RLS: public read-only
alter table members enable row level security;
alter table divisions enable row level security;
alter table member_votes enable row level security;

create policy "Public read members"
  on members for select using (true);

create policy "Public read divisions"
  on divisions for select using (true);

create policy "Public read member_votes"
  on member_votes for select using (true);
