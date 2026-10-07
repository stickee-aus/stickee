-- ─────────────────────────────────────────────────────────────────────────────
-- 006_engagement.sql
-- Adds: wallet, streaks, reactions, comments, follows, notifications, push subs
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. User wallet ────────────────────────────────────────────────────────────

create table if not exists user_wallets (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  balance            integer not null default 5000,
  total_earned       integer not null default 0,
  total_staked       integer not null default 0,
  last_daily_bonus   date,
  updated_at         timestamptz default now()
);

alter table user_wallets enable row level security;

create policy "Users can read own wallet"
  on user_wallets for select
  using (auth.uid() = user_id);

create policy "Users can update own wallet"
  on user_wallets for update
  using (auth.uid() = user_id);

create policy "Users can insert own wallet"
  on user_wallets for insert
  with check (auth.uid() = user_id);

-- ── 2. Wallet positions (stakes) ─────────────────────────────────────────────

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

create policy "Users can manage own positions"
  on wallet_positions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 3. User streaks ───────────────────────────────────────────────────────────

create table if not exists user_streaks (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  current_count     integer not null default 0,
  longest_count     integer not null default 0,
  last_action_date  date,
  freezes_available integer not null default 0,
  updated_at        timestamptz default now()
);

alter table user_streaks enable row level security;

create policy "Users can manage own streak"
  on user_streaks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 4. Feed reactions ─────────────────────────────────────────────────────────

create table if not exists feed_reactions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  post_id     text not null,
  reaction    text not null check (reaction in ('heart','fire','flag')),
  created_at  timestamptz default now(),
  unique (user_id, post_id, reaction)
);

alter table feed_reactions enable row level security;

create policy "Anyone can read reactions"
  on feed_reactions for select using (true);

create policy "Users can manage own reactions"
  on feed_reactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Aggregate reaction counts per post (refreshable view)
create or replace view feed_reaction_counts as
  select post_id, reaction, count(*) as total
  from feed_reactions
  group by post_id, reaction;

-- ── 5. Comments ───────────────────────────────────────────────────────────────

create table if not exists comments (
  id          uuid default gen_random_uuid() primary key,
  post_id     text not null,          -- feed post ID (string, not FK to keep flexible)
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null default 'Anonymous',
  author_handle text,
  body        text not null,
  parent_id   uuid references comments(id) on delete cascade,  -- for threading
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_comments_post_id on comments(post_id);
create index if not exists idx_comments_parent  on comments(parent_id);

alter table comments enable row level security;

create policy "Anyone can read comments"
  on comments for select using (true);

create policy "Authenticated users can insert comments"
  on comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on comments for update
  using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on comments for delete
  using (auth.uid() = user_id);

-- ── 6. User follows ───────────────────────────────────────────────────────────

create table if not exists user_follows (
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id)
);

alter table user_follows enable row level security;

create policy "Anyone can read follows"
  on user_follows for select using (true);

create policy "Users can manage own follows"
  on user_follows for all
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

-- ── 7. User profiles (public) ─────────────────────────────────────────────────

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

create policy "Anyone can read profiles"
  on user_profiles for select using (true);

create policy "Users can manage own profile"
  on user_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 8. Notifications ──────────────────────────────────────────────────────────

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

create policy "Users can read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- Service role can insert notifications (for Edge Functions)
create policy "Service role can insert notifications"
  on notifications for insert
  with check (true);

-- ── 9. Push subscriptions ─────────────────────────────────────────────────────

create table if not exists push_subscriptions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth_key    text not null,
  created_at  timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "Users can manage own push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 10. Helper: auto-create wallet + streak + profile on user signup ──────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Wallet
  insert into user_wallets (user_id) values (new.id)
  on conflict (user_id) do nothing;

  -- Streak
  insert into user_streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;

  -- Profile (derive handle from email)
  insert into user_profiles (user_id, handle, display_name)
  values (
    new.id,
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '', 'g')),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;

  -- Welcome notification
  insert into notifications (user_id, type, title, body, href)
  values (
    new.id,
    'bonus',
    '🎉 Welcome to Stickee!',
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
