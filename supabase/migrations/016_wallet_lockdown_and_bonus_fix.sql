-- ─────────────────────────────────────────────────────────────────────────────
-- 016_wallet_lockdown_and_bonus_fix.sql
--
-- Closes the P0 finding from docs/audits/SECURITY_AND_PERMISSIONS_AUDIT.md: the
-- "Users can update own wallet" policy on user_wallets let any authenticated
-- user set their own balance directly via PostgREST, bypassing the app's
-- atomic place_wallet_stake RPC entirely. Same class of gap existed on
-- wallet_positions via its "for all" policy.
--
-- Also fixes a real lost-update race in the daily-bonus agent: it was
-- computing `wallet.balance + bonusPts` from a batch SELECT taken *before*
-- looping over wallets, then writing that stale sum back — a concurrent
-- stake placed between the SELECT and this row's UPDATE would be silently
-- overwritten. apply_daily_bonus() does the increment atomically in SQL
-- instead, exactly like place_wallet_stake's existing debit already does.
--
-- No new tables. wallet_positions already records the debit side of every
-- stake (amount, created_at); this migration does not duplicate that with
-- a separate ledger.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Remove the client-writable wallet-balance hole ────────────────────────

drop policy if exists "Users can update own wallet" on user_wallets;

-- Tighten the insert policy so a user can only ever insert the *default*
-- fresh-wallet row for themselves (matching what handle_new_user() already
-- creates), not an arbitrary starting balance. This is a defensive fix for
-- the same exploit shape on the insert path (the client fallback insert in
-- usePredictionWallet.ts only ever inserts a bare {user_id}, so this doesn't
-- change any legitimate behavior).
drop policy if exists "Users can insert own wallet" on user_wallets;
drop policy if exists "Users can insert own default wallet" on user_wallets;
create policy "Users can insert own default wallet"
  on user_wallets for insert
  with check (
    auth.uid() = user_id
    and balance = 5000
    and total_earned = 0
    and total_staked = 0
  );

-- Defense in depth: a balance can never go negative, regardless of future
-- code changes to this table. ADD CONSTRAINT has no IF NOT EXISTS form in
-- Postgres, so drop-then-add is the idempotent idiom (matches the status
-- CHECK constraints in migration 017).
alter table user_wallets drop constraint if exists user_wallets_balance_nonnegative;
alter table user_wallets
  add constraint user_wallets_balance_nonnegative check (balance >= 0);

-- ── 2. Remove the client-writable wallet_positions hole ──────────────────────
-- Positions must only ever be created/mutated by place_wallet_stake (stake)
-- and resolve_market (settlement, added in the next migration) — both
-- SECURITY DEFINER functions owned by the table owner, which bypass RLS the
-- same way place_wallet_stake already does today. Clients only need to read
-- their own positions.

drop policy if exists "Users can manage own positions" on wallet_positions;
drop policy if exists "Users can read own positions" on wallet_positions;
create policy "Users can read own positions"
  on wallet_positions for select
  using (auth.uid() = user_id);

-- ── 3. Atomic, idempotent daily-bonus credit ─────────────────────────────────
-- Same shape as place_wallet_stake's atomic debit: the WHERE clause is
-- re-evaluated by Postgres at UPDATE time (not from a stale application-side
-- read), so a concurrent stake between "decide to credit" and "write it" can
-- no longer be clobbered, and a wallet already credited today (last_daily_bonus
-- not older than p_today) simply matches zero rows — idempotent by construction,
-- not by a race-prone SELECT-then-UPDATE in application code.

create or replace function public.apply_daily_bonus(
  p_user_id uuid,
  p_amount integer,
  p_today date
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance integer;
begin
  -- CORRECTNESS NOTE (found during database verification — see
  -- docs/audits/DATABASE_VERIFICATION_REPORT.md): this check went through two wrong
  -- versions before landing here. v1 used `if auth.uid() is not null` —
  -- wrong, because an entirely unauthenticated `anon` call also has no JWT
  -- `sub` claim, so it let anyone credit an arbitrary p_user_id with zero
  -- authentication (proven exploitable against a real Postgres instance).
  -- v2 used `session_user <> 'service_role'` — also wrong, but in the
  -- opposite direction: session_user reflects the role that authenticated
  -- the connection and is NEVER changed by `SET ROLE` (which is how
  -- PostgREST actually switches per-request role context against a shared
  -- connection role) nor by this function's own SECURITY DEFINER, so this
  -- check would reject even a genuine service-role call in the real
  -- deployed system. auth.role() reads the `role` claim out of the JWT
  -- itself (via the same request.jwt.claims setting auth.uid() already
  -- relies on throughout this codebase, including inside other SECURITY
  -- DEFINER functions), which is unaffected by both SET ROLE and SECURITY
  -- DEFINER's owner-switching — it reflects which *JWT* made the request,
  -- which is the actual thing forging this would require. The real
  -- boundary is still the explicit REVOKE/GRANT below (Postgres grants
  -- EXECUTE to PUBLIC by default unless revoked); this is defense in depth
  -- on top of that.
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'apply_daily_bonus is for service-role use only';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Bonus amount must be greater than zero';
  end if;

  update user_wallets
  set
    balance = balance + p_amount,
    last_daily_bonus = p_today,
    updated_at = now()
  where user_id = p_user_id
    and (last_daily_bonus is null or last_daily_bonus < p_today)
  returning balance into v_new_balance;

  return v_new_balance is not null;
end;
$$;

-- Postgres grants EXECUTE to PUBLIC by default on function creation unless
-- explicitly revoked — this REVOKE is the actual security boundary here,
-- not just the GRANT below. Verified against a real Postgres instance that
-- omitting this line leaves the function callable by `anon` with zero
-- authentication (see docs/audits/DATABASE_VERIFICATION_REPORT.md).
revoke all on function public.apply_daily_bonus(uuid, integer, date) from public, anon, authenticated;
grant execute on function public.apply_daily_bonus(uuid, integer, date) to service_role;
