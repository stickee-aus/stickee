-- ─────────────────────────────────────────────────────────────────────────────
-- 017_market_lifecycle_and_settlement.sql
--
-- Closes two P0 findings from docs/audits/MARKET_ENGINE_AUDIT.md:
--   1. Markets had no real, comparable close time and no server-side check
--      of market status/timing — expired/seeded markets could still be staked.
--   2. The points-staking system had no resolution/payout path at all —
--      points left wallets via staking and never came back.
--
-- Design notes (see docs/audits/IMPLEMENTATION_BATCH_1_REPORT.md for the full duplicate-
-- detection pass that led to this shape):
--   - No new tables. issue_markets already models "one market per issue";
--     resolution fields are added to it directly rather than a separate
--     market_resolutions table. wallet_positions already models "one row
--     per stake"; settlement fields are added to it directly rather than a
--     separate ledger.
--   - Idempotent resolution uses the same atomic-conditional-UPDATE idiom
--     already proven by place_wallet_stake's debit (UPDATE ... WHERE ...
--     RETURNING ...; if null, already happened) — not a new mechanism.
--   - No production market is being seeded as live/stakeable in this batch
--     (reversed from an earlier draft of this plan — see the audit doc for
--     why). Every current market, including the 5 real bill issues, has no
--     backing issue_markets row with real timestamps, so is_market_open()
--     correctly treats all of them as not-currently-stakeable. Dedicated,
--     unmistakably-fake test fixtures live in supabase/seed.sql instead.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Test-fixture marker (structural guard, not just a promise) ───────────
-- Lets read paths exclude fixtures from any public listing even if seed.sql
-- is ever run against the wrong database by mistake.

alter table issues
  add column if not exists is_test_fixture boolean not null default false;

alter table issue_markets
  add column if not exists is_test_fixture boolean not null default false;

-- ── 2. Real open/close timestamps ────────────────────────────────────────────
-- resolves_by (free text, e.g. "May 2025") is left in place for display —
-- changing/removing it is out of scope for this batch — but it is no longer
-- what eligibility is computed from.

alter table issue_markets
  add column if not exists opens_at  timestamptz,
  add column if not exists closes_at timestamptz;

-- Any pre-existing row with no closes_at is treated as already closed for
-- review, not silently granted an open-ended trading window. This only
-- matters if issue_markets already had rows before this migration ran;
-- combined with step 5 below (no new rows are seeded here), it means every
-- market in the table after this migration is explicitly non-stakeable
-- unless a human sets real opens_at/closes_at values later.
update issue_markets
set closes_at = now() - interval '1 minute'
where closes_at is null;

-- ── 3. Extend the lifecycle beyond active/resolved-yes/resolved-no ─────────
-- 'closed' and 'awaiting_resolution' are deliberately NOT separate stored
-- values — they're derived from status='active' AND closes_at <= now(), so
-- the state machine doesn't grow beyond what the data actually needs.

alter table issue_markets drop constraint if exists issue_markets_status_check;
alter table issue_markets add constraint issue_markets_status_check
  check (status in ('active', 'resolved-yes', 'resolved-no', 'voided', 'cancelled'));

-- ── 4. Resolution audit fields, on the market row itself ────────────────────
-- Nullable; populated only once, by resolve_market() below.

alter table issue_markets
  add column if not exists resolved_by       uuid references auth.users(id),
  add column if not exists resolved_at       timestamptz,
  add column if not exists resolution_source text,
  add column if not exists outcome           text check (outcome in ('yes', 'no', 'void'));

-- ── 5. Settlement fields on wallet_positions ─────────────────────────────────

alter table wallet_positions drop constraint if exists wallet_positions_status_check;
alter table wallet_positions add constraint wallet_positions_status_check
  check (status in ('open', 'won', 'lost', 'void'));

alter table wallet_positions
  add column if not exists settled_at timestamptz;

-- ── 6. The single authoritative "can this market accept a stake right now?"
--       definition ────────────────────────────────────────────────────────
-- Deliberately excludes test fixtures from being treated as real-money-
-- equivalent markets in any *production* context is not needed here — this
-- function only answers "is it open," not "is it a fixture." The exclusion
-- of fixtures from *public listings* is handled at the read-path layer
-- (issues-db.ts / predictions-db.ts), not here, so that the same fixtures
-- remain fully testable via this function in a dev/staging database.

create or replace function public.is_market_open(p_issue_id text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from issue_markets
    where issue_id = p_issue_id
      and status = 'active'
      and (opens_at is null or opens_at <= now())
      and closes_at is not null
      and closes_at > now()
  );
$$;

-- This one is intentionally public/anon-readable (checking eligibility
-- shouldn't require auth) — no revoke-from-public needed here, unlike the
-- functions below.
grant execute on function public.is_market_open(text) to authenticated, anon;

-- ── 7. Wire eligibility into the existing stake RPC ──────────────────────────
-- Signature and debit behaviour are unchanged; only the new first check
-- (after auth, before touching the wallet) is added.

create or replace function public.place_wallet_stake(
  p_market_id text,
  p_market_question text,
  p_category text,
  p_direction text,
  p_amount integer,
  p_price integer
)
returns table (
  position_id uuid,
  new_balance integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_new_balance integer;
  v_position_id uuid;
  v_shares numeric(10,1);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_market_open(p_market_id) then
    raise exception 'Market is not open for staking';
  end if;

  if p_direction not in ('yes', 'no') then
    raise exception 'Invalid direction';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_price is null or p_price <= 0 or p_price > 100 then
    raise exception 'Price must be between 1 and 100';
  end if;

  insert into user_wallets (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  update user_wallets
  set
    balance = balance - p_amount,
    total_staked = total_staked + p_amount,
    updated_at = now()
  where user_id = v_user_id
    and balance >= p_amount
  returning balance into v_new_balance;

  if v_new_balance is null then
    raise exception 'Insufficient balance';
  end if;

  v_shares := round(((p_amount::numeric / p_price::numeric) * 100) * 10) / 10;

  insert into wallet_positions (
    user_id,
    market_id,
    market_question,
    category,
    direction,
    amount,
    price,
    shares
  ) values (
    v_user_id,
    p_market_id,
    p_market_question,
    p_category,
    p_direction,
    p_amount,
    p_price,
    v_shares
  )
  returning id into v_position_id;

  return query select v_position_id, v_new_balance;
end;
$$;

-- Internal `if v_user_id is null then raise exception` already rejects
-- unauthenticated (anon) callers, but Postgres grants EXECUTE to PUBLIC by
-- default on creation — revoke that explicitly so the grant surface matches
-- documented intent (authenticated only) rather than relying solely on the
-- internal check (see the apply_daily_bonus fix above for why that matters:
-- an internal check alone is not a substitute for correct GRANTs).
revoke all on function public.place_wallet_stake(text, text, text, text, integer, integer) from public, anon;
grant execute on function public.place_wallet_stake(text, text, text, text, integer, integer) to authenticated;

-- ── 8. Settlement ─────────────────────────────────────────────────────────────
-- Payout model implemented here is not new: StakeModal.tsx already computes
-- shares = (amount / price) * 100 at stake time and tells the user "if
-- correct: +shares pts" — this is the first place that promise is actually
-- honoured. Winning positions receive round(shares) points; losing
-- positions receive 0; a void market refunds the original `amount` (not
-- shares) to every still-open position.
--
-- Idempotency: the very first statement is an atomic conditional UPDATE on
-- issue_markets (`WHERE status = 'active' ... RETURNING`) — the same idiom
-- place_wallet_stake already uses for its debit. If the market was already
-- resolved, that UPDATE matches zero rows and the function returns
-- immediately with already_resolved = true, touching nothing else. Two
-- concurrent calls on the same market are serialized by Postgres's normal
-- row-level locking on that UPDATE; only one can ever see status = 'active'.
--
-- The whole function body is one implicit transaction: any exception rolls
-- back every write in it, so there is no path to a partially-settled market
-- or a partially-credited wallet.

create or replace function public.resolve_market(
  p_issue_id text,
  p_outcome text,
  p_resolution_source text
)
returns table (
  already_resolved  boolean,
  positions_settled integer,
  total_paid        integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin       uuid := auth.uid();
  v_new_status  text;
  v_resolved_id text;
  v_settled     integer := 0;
  v_paid        integer := 0;
begin
  if v_admin is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_app_admin() then
    raise exception 'Admin access required';
  end if;

  if p_outcome not in ('yes', 'no', 'void') then
    raise exception 'Invalid outcome: must be yes, no, or void';
  end if;

  if not exists (select 1 from issue_markets where issue_id = p_issue_id) then
    raise exception 'Unknown market: %', p_issue_id;
  end if;

  v_new_status := case p_outcome
    when 'yes'  then 'resolved-yes'
    when 'no'   then 'resolved-no'
    else             'voided'
  end;

  -- Atomic, idempotent claim on the market row itself.
  update issue_markets
  set
    status            = v_new_status,
    outcome           = p_outcome,
    resolved_by       = v_admin,
    resolved_at       = now(),
    resolution_source = p_resolution_source,
    updated_at        = now()
  where issue_id = p_issue_id
    and status = 'active'
  returning issue_id into v_resolved_id;

  if v_resolved_id is null then
    -- Already resolved (or voided/cancelled) — no-op, no double payment.
    return query select true, 0, 0;
    return;
  end if;

  if p_outcome = 'void' then
    -- Step 1: mark every open position for this market as refunded. The CTE
    -- is directly referenced by the UPDATE below (via its FROM subquery),
    -- so its execution isn't dependent on any "unreferenced CTEs still run"
    -- behavior — it's a normal, unambiguous data dependency.
    with refunded as (
      update wallet_positions
      set status = 'void', payout = amount, settled_at = now()
      where market_id = p_issue_id and status = 'open'
      returning user_id, amount
    )
    update user_wallets uw
    set balance      = uw.balance + agg.total,
        total_earned = uw.total_earned + agg.total,
        updated_at   = now()
    from (select user_id, sum(amount) as total from refunded group by user_id) agg
    where uw.user_id = agg.user_id;

    -- Step 2: re-read the now-settled rows for the return values (a plain
    -- SELECT, not part of the write above, so there's no ambiguity about
    -- what ran).
    select count(*), coalesce(sum(payout), 0) into v_settled, v_paid
    from wallet_positions
    where market_id = p_issue_id and status = 'void';

  else
    with settled as (
      update wallet_positions
      set
        status     = case when direction = p_outcome then 'won' else 'lost' end,
        payout     = case when direction = p_outcome then round(shares)::integer else 0 end,
        settled_at = now()
      where market_id = p_issue_id and status = 'open'
      returning user_id, payout
    )
    update user_wallets uw
    set balance      = uw.balance + agg.total,
        total_earned = uw.total_earned + agg.total,
        updated_at   = now()
    from (select user_id, sum(payout) as total from settled where payout > 0 group by user_id) agg
    where uw.user_id = agg.user_id;

    select count(*), coalesce(sum(payout), 0) into v_settled, v_paid
    from wallet_positions
    where market_id = p_issue_id and status in ('won', 'lost');
  end if;

  return query select false, v_settled, v_paid;
end;
$$;

-- Same reasoning as place_wallet_stake above: is_app_admin() is the real
-- authorization check, but the grant surface should still match intent.
revoke all on function public.resolve_market(text, text, text) from public, anon;
grant execute on function public.resolve_market(text, text, text) to authenticated;
