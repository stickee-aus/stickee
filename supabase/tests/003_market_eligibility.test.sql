-- ─────────────────────────────────────────────────────────────────────────────
-- 003_market_eligibility.test.sql
--
-- AUTHORED, NOT EXECUTED in this session (no local Postgres/Supabase CLI
-- available). Run against a local/dev database that has had supabase/seed.sql
-- applied — see the header of 002_wallet_lockdown.test.sql for the exact
-- commands. Never run against production.
-- ─────────────────────────────────────────────────────────────────────────────

\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000010', 'market-eligibility-test@example.invalid')
on conflict (id) do nothing;

insert into user_wallets (user_id, balance) values
  ('00000000-0000-0000-0000-000000000010', 5000)
on conflict (user_id) do nothing;

-- ── Test 1: an open fixture accepts a stake ─────────────────────────────────

do $$
begin
  if not is_market_open('test-market-open') then
    raise exception 'FAIL: test-market-open should be open (opens_at in the past, closes_at in the future, status active)';
  end if;
  raise notice 'PASS: is_market_open(test-market-open) = true';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000010')::text, true);

do $$
begin
  perform place_wallet_stake('test-market-open', '[TEST FIXTURE]', 'bill', 'yes', 100, 50);
  raise notice 'PASS: stake accepted on an open fixture';
end;
$$;

reset role;

-- ── Test 2: an expired fixture rejects a stake, at both layers ─────────────

do $$
begin
  if is_market_open('test-market-expired') then
    raise exception 'FAIL: test-market-expired should be closed (closes_at in the past)';
  end if;
  raise notice 'PASS: is_market_open(test-market-expired) = false';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000010')::text, true);

do $$
begin
  begin
    perform place_wallet_stake('test-market-expired', '[TEST FIXTURE]', 'bill', 'yes', 100, 50);
    raise exception 'FAIL: place_wallet_stake accepted a stake on an expired market';
  exception
    when others then
      if sqlerrm like '%not open for staking%' then
        raise notice 'PASS: place_wallet_stake rejected a stake on an expired market';
      else
        raise;
      end if;
  end;
end;
$$;

reset role;

-- ── Test 3: a market_id with no backing issue_markets row is rejected ───────
-- This is the case every current real/mock market falls into today (bill,
-- civic, election, mp-vote alike) — none has a real opens_at/closes_at row
-- yet, so none is currently stakeable. This test confirms that's enforced
-- by the RPC, not just by the UI hiding the buttons.

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000010')::text, true);

do $$
begin
  begin
    perform place_wallet_stake('housing-affordability', '[real content, no DB row yet]', 'bill', 'yes', 100, 50);
    raise exception 'FAIL: place_wallet_stake accepted a stake on a market with no backing row';
  exception
    when others then
      if sqlerrm like '%not open for staking%' then
        raise notice 'PASS: a market_id with no issue_markets row was rejected';
      else
        raise;
      end if;
  end;
end;
$$;

reset role;

-- ── Test 4: boundary — closes_at exactly now() is treated as closed ────────

update issue_markets set closes_at = now() where issue_id = 'test-market-no-settlement';

do $$
begin
  -- closes_at > now() is required (strictly greater), so a closes_at that
  -- equals "now" by the time this check runs must be closed. There is an
  -- inherent few-millisecond race in testing this exactly at psql speed;
  -- the assertion allows either outcome only if closes_at is provably not
  -- in the future, which it isn't here.
  if is_market_open('test-market-no-settlement') then
    raise exception 'FAIL: a market whose closes_at is not in the future should not be open';
  end if;
  raise notice 'PASS: boundary case (closes_at <= now()) is treated as closed';
end;
$$;

-- Restore the fixture's real window for the settlement tests that follow.
update issue_markets set closes_at = now() + interval '30 days' where issue_id = 'test-market-no-settlement';

rollback;
