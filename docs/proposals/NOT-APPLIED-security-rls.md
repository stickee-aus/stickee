# Proposed RLS fixes: donations, notifications, civic_score

> ## APPLIED on 29 Nov 2026 (AEST) after Jacko's approval ("Restore and apply all")
>
> Applied to the Stickee Supabase project (ap-southeast-2) and committed as real migrations:
> `027_donation_records_lockdown.sql`, `028_notifications_lockdown.sql`, `029_civic_score_protection.sql`.
> The SQL below is the original draft and is kept for history. **Where it differs from the applied files, the applied files win.** Differences, after checking the live schema:
>
> - **A (donations):** the optional "Admins can update donation records" policy was also dropped (nothing in the app uses it; the service role does all writes). Privileges were also revoked from `anon`, including `select`.
> - **B (notifications):** also revoked `select`/`update` from `anon` and `truncate`/`references`/`trigger` from `authenticated`.
> - **C (civic_score):** the trigger checks `current_user in ('anon','authenticated')` instead of `auth.role()`, so `SECURITY DEFINER` functions and the service role are never restricted. `execute` on the trigger function is revoked from API roles.
> - The live database matched repo migrations 006 and 009 for these tables (same policies, same constraints, `handle_new_user()` trigger present). It also has one extra column, `donation_records.failure_reason`, which the repo does not define.
> - Verified in a rolled-back test transaction (see the PR description for results).
>
> The file name is kept so existing links work. Its content is no longer a proposal.


> ### Original draft status (superseded, see the banner above)
>
> This file was a **draft only** when written.
>
> Related draft: [`NOT-APPLIED-processed-stripe-events.md`](./NOT-APPLIED-processed-stripe-events.md) (webhook `event.id` dedupe table). It is separate and also needs approval.

Status of each item below: **[VERIFIED-CODE]** means seen in the migration/source in this repo. **[NOT VERIFIED]** means it depends on the hosted database state, which was not accessed.

## Why these matter

The Stripe webhook and the checkout route now do the right thing in code, but the database rules still let a signed-in user bypass them directly through the public Supabase API (the anon key is public by design):

| # | Problem | Evidence |
|---|---|---|
| A | A user can insert their own `donation_records` row, and can pick the `status` (including `paid`) and `amount_cents`. | [VERIFIED-CODE] `009_onboarding_admin_donations.sql`: policy "Users can create own donation records" is `for insert with check (auth.uid() = user_id)` with no restriction on `status`. The table's `status` column defaults to `started` but accepts `paid`. |
| B | Anyone, including logged-out users, can insert a notification for any user. | [VERIFIED-CODE] `006_engagement.sql`: policy "Service role can insert notifications" is `for insert with check (true)`. The service role bypasses RLS anyway, so this policy only opens the door for `anon` and `authenticated`. |
| C | A user can set their own `civic_score` to any number. | [VERIFIED-CODE] `006_engagement.sql`: policy "Users can manage own profile" is `for all using (auth.uid() = user_id) with check (auth.uid() = user_id)`. It covers every column, including `civic_score`. No trigger or column grant restricts it. |

Nothing in the app writes `civic_score` or inserts into `donation_records` from the browser. [VERIFIED-CODE] `civic_score` is only read in `src/**`; `donation_records` is written only by the service-role checkout route and webhook handler. The one client-side notification insert is `src/hooks/useNotifications.ts` (`push`), which only inserts for the signed-in user's own id; the fix below keeps that working.

---

## Proposed SQL (draft only)

Suggested names if approved: `027_donation_records_lockdown.sql`, `028_notifications_and_civic_score_lockdown.sql`. (Check the next free number first; `027` may be used by `processed_stripe_events`.)

### A. `donation_records`: users must not insert or update their own donations (migration 009 follow-up)

```sql
-- DRAFT: NOT CREATED, NOT APPLIED, needs approval

-- Donations are written only by the server (service role): the checkout
-- route inserts 'started' rows and the signed Stripe webhook moves them to
-- paid / failed / refunded. The service role bypasses RLS, so users need no
-- write access at all.
drop policy if exists "Users can create own donation records" on donation_records;

-- Defence in depth: also remove the table privileges, so a future permissive
-- policy cannot re-open this by accident.
revoke insert, update, delete on donation_records from anon, authenticated;

-- Keep: "Users can read own donation records" (select).
-- Optional, ask first: the "Admins can update donation records" policy lets
-- a signed-in admin set any status from the client. If admin edits are not
-- needed, drop it too:
--   drop policy if exists "Admins can update donation records" on donation_records;
```

Rollback:

```sql
-- DRAFT rollback, NOT APPLIED
grant insert, update, delete on donation_records to authenticated;
create policy "Users can create own donation records"
  on donation_records for insert
  with check (auth.uid() = user_id);
```

### B. `notifications`: only the owner (or the server) may insert (migration 006 follow-up)

```sql
-- DRAFT: NOT CREATED, NOT APPLIED, needs approval

drop policy if exists "Service role can insert notifications" on notifications;

-- A signed-in user may insert a notification only for themselves (this is
-- what src/hooks/useNotifications.ts does). Server code that notifies other
-- users must use the service role, which bypasses RLS.
create policy "Users can insert own notifications"
  on notifications for insert
  to authenticated
  with check (auth.uid() = user_id);

revoke insert on notifications from anon;
```

Known remaining gap after this change: a user can still create fake notifications **for themselves** (title/body/href are free text). The cleaner fix is to stop inserting from the browser and move `push` to a server route. That is a code change and is not part of this draft.

Rollback:

```sql
-- DRAFT rollback, NOT APPLIED
drop policy if exists "Users can insert own notifications" on notifications;
create policy "Service role can insert notifications"
  on notifications for insert
  with check (true);
grant insert on notifications to anon;
```

### C. `user_profiles.civic_score`: users must not set their own score (migration 006 follow-up)

```sql
-- DRAFT: NOT CREATED, NOT APPLIED, needs approval

create or replace function public.protect_civic_score()
returns trigger
language plpgsql
as $$
begin
  -- Only end-user API roles are restricted. The service role, postgres and
  -- SECURITY DEFINER functions owned by postgres are not.
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.civic_score := 0;
    elsif new.civic_score is distinct from old.civic_score then
      new.civic_score := old.civic_score;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_civic_score on public.user_profiles;
create trigger protect_civic_score
  before insert or update on public.user_profiles
  for each row execute function public.protect_civic_score();
```

Why a trigger and not a column grant: the existing policy is `for all`, and `handle_new_user()` and the profile editor already write to this table. A trigger leaves those flows unchanged and only pins the one column. It silently keeps the old value rather than raising an error, so existing profile saves that send the whole row do not start failing.

Rollback:

```sql
-- DRAFT rollback, NOT APPLIED
drop trigger if exists protect_civic_score on public.user_profiles;
drop function if exists public.protect_civic_score();
```

---

## Checks to run after approval (on a local or staging database first, never production first)

1. As a normal signed-in user via the Supabase client: `insert into donation_records (user_id, amount_cents, status) values (auth.uid(), 100, 'paid')` fails. A select of own rows still works.
2. As `anon` and as a user, inserting a notification for another user's id fails; inserting one for yourself works.
3. As a user, `update user_profiles set civic_score = 99999 where user_id = auth.uid()` leaves the score unchanged; updating `display_name` still works.
4. Run a sign-up end to end: the profile row and the welcome notification (created by `handle_new_user()`) still appear.
5. Run a checkout in Stripe **test mode**: the `started` row is created by the server, and the signed webhook still moves it to `paid`.

## What this draft does not cover

- It does not apply or create anything. Hosted Supabase state was not inspected, so whether these policies are live in production is **[NOT VERIFIED]**.
- Email-confirmation and redirect-URL allowlist settings in the Supabase dashboard are human steps.
- `event.id` dedupe: see `NOT-APPLIED-processed-stripe-events.md`.
