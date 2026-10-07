-- ─────────────────────────────────────────────────────────────────────────────
-- 002_wallet_lockdown.test.sql
--
-- AUTHORED, NOT EXECUTED in this session — this environment has no Supabase
-- CLI, no running Docker, and no local Postgres to run it against.
--
-- Run it locally with:
--   supabase start
--   supabase db reset          # applies all migrations + supabase/seed.sql
--   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" \
--        -f supabase/tests/002_wallet_lockdown.test.sql
--
-- Or against a disposable staging database:
--   psql "$STAGING_DATABASE_URL" -f supabase/tests/002_wallet_lockdown.test.sql
--
-- NEVER run this against a production DATABASE_URL — it creates and deletes
-- a throwaway auth.users row, which is safe in a test project but not
-- something to do against real user data.
-- ─────────────────────────────────────────────────────────────────────────────

\set ON_ERROR_STOP on

begin;

-- ── Setup: one throwaway user, simulating what handle_new_user() does ───────

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'wallet-lockdown-test@example.invalid')
on conflict (id) do nothing;

insert into user_wallets (user_id, balance, total_earned, total_staked)
values ('00000000-0000-0000-0000-000000000001', 5000, 0, 0)
on conflict (user_id) do nothing;

-- ── Test 1: a client acting as this user cannot UPDATE their own balance ────

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000001')::text, true);

-- Correctness note (found during database verification — see
-- docs/audits/DATABASE_VERIFICATION_REPORT.md): an earlier version of this test assumed
-- an RLS-blocked UPDATE raises an `insufficient_privilege` exception. That's
-- true for INSERT violating a WITH CHECK clause (see Test 2 below), but
-- UPDATE/SELECT/DELETE with no matching USING policy do NOT error — they
-- silently affect/return zero rows. The correct check is the row count.
do $$
declare
  v_row_count integer;
begin
  update user_wallets set balance = 999999999 where user_id = '00000000-0000-0000-0000-000000000001';
  get diagnostics v_row_count = row_count;
  if v_row_count <> 0 then
    raise exception 'FAIL: direct UPDATE to user_wallets.balance affected % row(s) — RLS lockdown is not in place', v_row_count;
  end if;
  raise notice 'PASS: direct UPDATE to user_wallets.balance affected 0 rows (RLS silently denied it)';
end;
$$;

reset role;

do $$
declare v_balance integer;
begin
  select balance into v_balance from user_wallets where user_id = '00000000-0000-0000-0000-000000000001';
  if v_balance <> 5000 then
    raise exception 'FAIL: balance changed to % — should still be 5000', v_balance;
  end if;
  raise notice 'PASS: balance unchanged at 5000 after the rejected UPDATE attempt';
end;
$$;

-- ── Test 2: a client cannot INSERT a wallet_positions row directly ──────────

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000001')::text, true);

do $$
begin
  begin
    insert into wallet_positions (user_id, market_id, market_question, category, direction, amount, price, shares, status, payout)
    values ('00000000-0000-0000-0000-000000000001', 'fake-market', 'fake question', 'bill', 'yes', 100, 50, 200, 'won', 999999);
    raise exception 'FAIL: direct INSERT to wallet_positions succeeded — a user could fabricate a winning position';
  exception
    when insufficient_privilege then
      raise notice 'PASS: direct INSERT to wallet_positions was rejected';
  end;
end;
$$;

reset role;

-- ── Test 3: a client cannot UPDATE an existing wallet_positions row ─────────
-- (e.g. flipping their own open position to 'won' before settlement runs)

insert into wallet_positions (id, user_id, market_id, market_question, category, direction, amount, price, shares, status)
values ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'fake-market', 'fake question', 'bill', 'yes', 100, 50, 200, 'open');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000001')::text, true);

do $$
declare
  v_row_count integer;
begin
  update wallet_positions set status = 'won', payout = 999999 where id = '00000000-0000-0000-0000-000000000002';
  get diagnostics v_row_count = row_count;
  if v_row_count <> 0 then
    raise exception 'FAIL: direct UPDATE to wallet_positions affected % row(s) — a user could self-award a payout', v_row_count;
  end if;
  raise notice 'PASS: direct UPDATE to wallet_positions affected 0 rows (RLS silently denied it)';
end;
$$;

reset role;

-- Verify the position's actual state is unchanged (belt and suspenders on
-- top of the row-count check above).
do $$
declare
  v_status text;
  v_payout integer;
begin
  select status, payout into v_status, v_payout from wallet_positions where id = '00000000-0000-0000-0000-000000000002';
  if v_status <> 'open' or v_payout is not null then
    raise exception 'FAIL: position state changed to %/% — should still be open/null', v_status, v_payout;
  end if;
  raise notice 'PASS: wallet_positions row unchanged (open/null) after the rejected UPDATE attempt';
end;
$$;

-- ── Test 4: negative-balance constraint holds even for privileged writers ──

do $$
begin
  begin
    update user_wallets set balance = -1 where user_id = '00000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: balance was allowed to go negative';
  exception
    when check_violation then
      raise notice 'PASS: balance >= 0 constraint rejected a negative balance';
  end;
end;
$$;

-- ── Test 5: place_wallet_stake still works for a valid, sufficient balance ──
-- (requires a real open market fixture — see supabase/seed.sql; this assumes
-- the 'test-market-open' fixture from that file has been loaded.)

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000001')::text, true);

do $$
declare v_new_balance integer;
begin
  select new_balance into v_new_balance
  from place_wallet_stake('test-market-open', '[TEST FIXTURE] open market', 'bill', 'yes', 100, 50);
  if v_new_balance <> 4900 then
    raise exception 'FAIL: expected balance 4900 after a 100pt stake, got %', v_new_balance;
  end if;
  raise notice 'PASS: place_wallet_stake succeeded and debited the correct amount';
end;
$$;

reset role;

-- ── Test 6: place_wallet_stake rejects a stake larger than the balance ──────

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000001')::text, true);

do $$
begin
  begin
    perform place_wallet_stake('test-market-open', '[TEST FIXTURE] open market', 'bill', 'yes', 999999999, 50);
    raise exception 'FAIL: place_wallet_stake accepted a stake far larger than the wallet balance';
  exception
    when others then
      if sqlerrm like '%Insufficient balance%' then
        raise notice 'PASS: place_wallet_stake rejected an over-balance stake';
      else
        raise;
      end if;
  end;
end;
$$;

reset role;

rollback; -- never commit test data, even against a disposable database
