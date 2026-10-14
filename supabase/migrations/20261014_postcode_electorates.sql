-- Postcode-to-electorate mapping for Stickee
-- Seeded from AEC locality-to-electorate dataset
-- Re-pull yearly after redistributions

create table if not exists public.postcode_electorates (
  postcode text primary key,
  electorate text not null,
  state text not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_postcode_electorates_electorate
  on public.postcode_electorates (electorate);

create index if not exists idx_postcode_electorates_state
  on public.postcode_electorates (state);

alter table public.postcode_electorates enable row level security;

-- Public read: anyone can look up their own electorate
drop policy if exists "postcode_electorates_public_read" on public.postcode_electorates;
create policy "postcode_electorates_public_read"
  on public.postcode_electorates
  for select
  using (true);
