-- Predictions table: stores user predictions on whether issues will pass
create table if not exists predictions (
  id uuid default gen_random_uuid() primary key,
  issue_id text not null,
  prediction text not null check (prediction in ('yes', 'no')),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  created_at timestamptz default now()
);

-- Partial unique indexes: one prediction per authenticated user per issue,
-- and one prediction per anonymous session per issue
create unique index if not exists unique_user_prediction
  on predictions (issue_id, user_id)
  where user_id is not null;

create unique index if not exists unique_session_prediction
  on predictions (issue_id, session_id)
  where session_id is not null;

-- Enable Row Level Security
alter table predictions enable row level security;

-- Anyone can read predictions (needed for public counts)
create policy "Anyone can read predictions"
  on predictions for select
  using (true);

-- Anyone can insert a prediction
create policy "Anyone can insert a prediction"
  on predictions for insert
  with check (true);
