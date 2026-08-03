-- ─────────────────────────────────────────────────────────────────────────────
-- 004_settlement.test.sql
--
-- Run against a local/dev database that has had supabase/seed.sql applied —
-- see 002_wallet_lockdown.test.sql's header for exact commands. Never run
-- against production; this test credits/debits real-looking wallet balances
-- against the [TEST FIXTURE]-labeled markets only.
--
-- Role-switching note (fixed after a real bug found during database
-- verification — see docs/audits/DATABASE_VERIFICATION_REPORT.md): only the actual call
-- to resolve_market() needs to run as the simulated admin (`authenticated`
-- role + that admin's JWT `sub`), because resolve_market's own
-- is_app_admin() check needs a real admin session. Verifying the *results*
-- (reading other users' wallet_positions/user_wallets rows afterward) must
-- run as `postgres` (or any role that bypasses RLS) — an authenticated
-- admin session has no RLS-level right to read another user's private rows
-- directly; only resolve_market's SECURITY DEFINER context can touch them.
-- An earlier version of this file tried to do both under `authenticated`
-- and failed with "permission denied for table wallet_positions" — that
-- was the RLS added in migration 016 working correctly, not a bug in the
-- schema. `reset role` always returns to `postgres` (the psql session's
-- connecting role), which owns every table and bypasses RLS by default.
-- ─────────────────────────────────────────────────────────────────────────────

\set ON_ERROR_STOP on

begin;

-- ── Setup: two regular users + one admin ────────────────────────────────────

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000020', 'settlement-test-user-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000021', 'settlement-test-user-b@example.invalid'),
  ('00000000-0000-0000-0000-000000000022', 'settlement-test-admin@example.invalid')
on conflict (id) do nothing;

insert into user_wallets (user_id, balance) values
  ('00000000-0000-0000-0000-000000000020', 5000),
  ('00000000-0000-0000-0000-000000000021', 5000),
  ('00000000-0000-0000-0000-000000000022', 5000)
on conflict (user_id) do nothing;

insert into app_admins (user_id) values ('00000000-0000-0000-0000-000000000022')
on conflict (user_id) do nothing;

-- User A stakes YES 100 @ price 50 -> shares = (100/50)*100 = 200 -> payout if YES = 200
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000020')::text, true);
select place_wallet_stake('test-market-open', '[TEST FIXTURE]', 'bill', 'yes', 100, 50);
reset role;

-- User B stakes NO 100 @ price 50 -> shares = 200 -> payout if YES = 0 (loses)
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000021')::text, true);
select place_wallet_stake('test-market-open', '[TEST FIXTURE]', 'bill', 'no', 100, 50);
reset role;

-- ── Test 1: a non-admin cannot call resolve_market ──────────────────────────

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000020')::text, true);

do $$
begin
  begin
    perform resolve_market('test-market-open', 'yes', 'unit test — should be rejected');
    raise exception 'FAIL: a non-admin was able to resolve a market';
  exception
    when others then
      if sqlerrm like '%Admin access required%' then
        raise notice 'PASS: non-admin resolve_market call was rejected';
      else
        raise;
      end if;
  end;
end;
$$;

reset role;

-- ── Test 2: admin resolves YES — winner paid, loser gets 0 ──────────────────
-- Part A (as admin): call resolve_market and check its OWN return values
-- only (no cross-user table reads here — those are RLS-restricted for a
-- plain authenticated session, admin or not).

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000022')::text, true);

do $$
declare
  v_already_resolved boolean;
  v_settled integer;
  v_paid integer;
begin
  select already_resolved, positions_settled, total_paid
  into v_already_resolved, v_settled, v_paid
  from resolve_market('test-market-open', 'yes', 'unit test fixture resolution');

  if v_already_resolved then
    raise exception 'FAIL: first resolution should not report already_resolved';
  end if;
  if v_settled <> 2 then
    raise exception 'FAIL: expected 2 positions settled, got %', v_settled;
  end if;
  if v_paid <> 200 then
    raise exception 'FAIL: expected total_paid = 200 (only the YES winner), got %', v_paid;
  end if;

  raise notice 'PASS: resolve_market(yes) returned settled=2, paid=200 as expected';
end;
$$;

reset role;

-- Part B (as postgres, bypassing RLS): verify the actual rows.

do $$
declare
  v_balance_a integer;
  v_balance_b integer;
  v_status_a text;
  v_status_b text;
  v_payout_a integer;
  v_payout_b integer;
  v_settled_at_a timestamptz;
  v_settled_at_b timestamptz;
begin
  select status, payout, settled_at into v_status_a, v_payout_a, v_settled_at_a from wallet_positions
    where user_id = '00000000-0000-0000-0000-000000000020' and market_id = 'test-market-open';
  select status, payout, settled_at into v_status_b, v_payout_b, v_settled_at_b from wallet_positions
    where user_id = '00000000-0000-0000-0000-000000000021' and market_id = 'test-market-open';

  if v_status_a <> 'won' or v_payout_a <> 200 then
    raise exception 'FAIL: winner should be won/200, got %/%', v_status_a, v_payout_a;
  end if;
  if v_status_b <> 'lost' or v_payout_b <> 0 then
    raise exception 'FAIL: loser should be lost/0, got %/%', v_status_b, v_payout_b;
  end if;
  if v_settled_at_a is null or v_settled_at_b is null then
    raise exception 'FAIL: settled_at should be stamped on every settled position (winner: %, loser: %)', v_settled_at_a, v_settled_at_b;
  end if;

  select balance into v_balance_a from user_wallets where user_id = '00000000-0000-0000-0000-000000000020';
  select balance into v_balance_b from user_wallets where user_id = '00000000-0000-0000-0000-000000000021';

  if v_balance_a <> 5100 then -- 5000 - 100 stake + 200 payout
    raise exception 'FAIL: winner balance should be 5100, got %', v_balance_a;
  end if;
  if v_balance_b <> 4900 then -- 5000 - 100 stake, no payout
    raise exception 'FAIL: loser balance should be 4900, got %', v_balance_b;
  end if;

  raise notice 'PASS: YES settlement paid only the winner, correct amounts, correct balances, settled_at stamped on both';
end;
$$;

-- Verify the market-level audit fields, also as postgres.

do $$
declare
  v_status text;
  v_outcome text;
  v_resolved_by uuid;
  v_resolved_at timestamptz;
  v_resolution_source text;
begin
  select status, outcome, resolved_by, resolved_at, resolution_source
  into v_status, v_outcome, v_resolved_by, v_resolved_at, v_resolution_source
  from issue_markets where issue_id = 'test-market-open';

  if v_status <> 'resolved-yes' then raise exception 'FAIL: status should be resolved-yes, got %', v_status; end if;
  if v_outcome <> 'yes' then raise exception 'FAIL: outcome should be yes, got %', v_outcome; end if;
  if v_resolved_by <> '00000000-0000-0000-0000-000000000022' then raise exception 'FAIL: resolved_by should be the admin, got %', v_resolved_by; end if;
  if v_resolved_at is null then raise exception 'FAIL: resolved_at should be stamped'; end if;
  if v_resolution_source <> 'unit test fixture resolution' then raise exception 'FAIL: resolution_source not stored correctly, got %', v_resolution_source; end if;

  raise notice 'PASS: issue_markets audit fields (outcome/resolved_by/resolved_at/resolution_source) stored correctly';
end;
$$;

-- ── Test 3: resolving the same market again is a no-op (idempotent) ────────

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000022')::text, true);

do $$
declare
  v_already_resolved boolean;
begin
  select already_resolved into v_already_resolved
  from resolve_market('test-market-open', 'yes', 'unit test — retry, should be a no-op');

  if not v_already_resolved then
    raise exception 'FAIL: second resolve_market call should report already_resolved = true';
  end if;

  raise notice 'PASS: duplicate resolve_market call reported already_resolved = true';
end;
$$;

reset role;

do $$
declare
  v_balance_a integer;
begin
  select balance into v_balance_a from user_wallets where user_id = '00000000-0000-0000-0000-000000000020';
  if v_balance_a <> 5100 then
    raise exception 'FAIL: balance changed on a duplicate resolution (expected still 5100, got %) — double payment occurred', v_balance_a;
  end if;
  raise notice 'PASS: no double payment after the duplicate resolution';
end;
$$;

-- ── Test 4: a second call with a DIFFERENT outcome also can't change the result ──

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000022')::text, true);

do $$
declare
  v_already_resolved boolean;
begin
  select already_resolved into v_already_resolved
  from resolve_market('test-market-open', 'void', 'unit test — attempt to change the outcome after close');

  if not v_already_resolved then
    raise exception 'FAIL: resolving with a different outcome after the fact should still be a no-op';
  end if;
  raise notice 'PASS: attempting a different outcome after resolution reported already_resolved = true';
end;
$$;

reset role;

do $$
declare
  v_status text;
begin
  select status into v_status from issue_markets where issue_id = 'test-market-open';
  if v_status <> 'resolved-yes' then
    raise exception 'FAIL: market status should remain resolved-yes, got %', v_status;
  end if;
  raise notice 'PASS: market rules were not silently changed after the first resolution';
end;
$$;

-- ── Test 5: VOID refunds the original stake amount to every open position ──

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000020')::text, true);
select place_wallet_stake('test-market-void', '[TEST FIXTURE]', 'bill', 'yes', 150, 60);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000022')::text, true);

do $$
declare
  v_settled integer;
  v_paid integer;
begin
  select positions_settled, total_paid into v_settled, v_paid
  from resolve_market('test-market-void', 'void', 'unit test — void refund');

  if v_settled <> 1 or v_paid <> 150 then
    raise exception 'FAIL: expected 1 position refunded totaling 150, got %/%', v_settled, v_paid;
  end if;
  raise notice 'PASS: resolve_market(void) returned settled=1, paid=150 as expected';
end;
$$;

reset role;

do $$
declare
  v_status text;
  v_payout integer;
  v_balance integer;
begin
  select status, payout into v_status, v_payout from wallet_positions
    where user_id = '00000000-0000-0000-0000-000000000020' and market_id = 'test-market-void';
  if v_status <> 'void' or v_payout <> 150 then
    raise exception 'FAIL: refunded position should be void/150 (the stake amount, not shares), got %/%', v_status, v_payout;
  end if;

  select balance into v_balance from user_wallets where user_id = '00000000-0000-0000-0000-000000000020';
  -- balance after test 2 was 5100, minus the 150 stake, plus the 150 refund = 5100
  if v_balance <> 5100 then
    raise exception 'FAIL: balance after a full refund should be unchanged at 5100, got %', v_balance;
  end if;

  raise notice 'PASS: VOID settlement refunded the stake amount, not shares, and left balance net-neutral';
end;
$$;

-- ── Test 6: a market with zero open positions resolves cleanly ─────────────

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000022')::text, true);

do $$
declare
  v_settled integer;
  v_paid integer;
begin
  select positions_settled, total_paid into v_settled, v_paid
  from resolve_market('test-market-no-settlement', 'no', 'unit test — no stakes placed on this fixture');

  if v_settled <> 0 or v_paid <> 0 then
    raise exception 'FAIL: a market with no stakes should settle 0 positions for 0 points, got %/%', v_settled, v_paid;
  end if;

  raise notice 'PASS: a zero-stake market resolves cleanly with no error';
end;
$$;

reset role;

-- ── Test 7: an invalid outcome value is rejected and changes nothing ───────

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000022')::text, true);

do $$
declare
  v_status_before text;
  v_status_after text;
begin
  select status into v_status_before from issue_markets where issue_id = 'test-market-expired';

  begin
    perform resolve_market('test-market-expired', 'maybe', 'unit test — invalid outcome');
    raise exception 'FAIL: an invalid outcome value was accepted';
  exception
    when others then
      if sqlerrm not like '%Invalid outcome%' then
        raise;
      end if;
  end;

  select status into v_status_after from issue_markets where issue_id = 'test-market-expired';
  if v_status_before <> v_status_after then
    raise exception 'FAIL: a rejected resolve_market call should not have changed market status';
  end if;

  raise notice 'PASS: invalid outcome rejected, no partial state change';
end;
$$;

reset role;

rollback;
