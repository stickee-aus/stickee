# Proposed migration: `processed_stripe_events`

> ## APPLIED on 29 Nov 2026 (AEST) after Jacko's approval ("Restore and apply all")
>
> Created in the Stickee Supabase project as `processed_stripe_events` with RLS enabled, no policies, and all privileges revoked from `anon` and `authenticated` (service role only). Committed as `supabase/migrations/030_processed_stripe_events.sql`. A second additive migration, `031_donation_records_stripe_invoice.sql`, adds a nullable `donation_records.stripe_invoice_id` with a partial unique index so monthly renewals can be recorded once per invoice.
>
> The webhook handler (`src/lib/stripe/webhook-handler.ts`) now uses the table: it claims `event_id` before acting, skips events that already have `processed_at`, retries events whose earlier attempt left `processed_at` null, and rejects acted-on events with no id. `invoice.paid` renewals (`billing_reason = subscription_cycle`) are recorded as new paid monthly rows.
>
> The text below is the original proposal, kept for history. The Supabase advisor reports an INFO "RLS enabled, no policy" for this table. That is intentional: only the service role should touch it.


**NOT APPLIED. This file is a proposal only. It needs Jacko's explicit approval before anyone creates a file under `supabase/migrations/` or applies this SQL to any database (local, staging or production).**

## Why it is not in this PR

The webhook P0 fix in this change set stays idempotent without a schema change:

- A donation is marked `paid` or `failed` only when its current status is `started`.
- A retry or replay against an already `paid`, `failed` or `refunded` row updates zero rows and still returns 200.
- A database or service-client failure returns 5xx so Stripe retries.

That guards donation status. It is not true `event.id` deduplication. Stripe can legally deliver the same event more than once, and also deliver different events for the same checkout session. Without a processed-events table we cannot record that a particular `event.id` has already been seen.

## Proposed SQL (draft only)

```sql
-- DRAFT — NOT CREATED, NOT APPLIED, needs approval
-- Suggested name if approved: 027_processed_stripe_events.sql

create table if not exists processed_stripe_events (
  event_id     text primary key,
  type         text not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz
);

alter table processed_stripe_events enable row level security;
-- No policies: only the service role can read or write.

revoke all on processed_stripe_events from anon, authenticated;
```

## Proposed handler behaviour after approval

1. After the signature and timestamp checks pass, insert `(event_id, type)` with `on conflict do nothing`.
2. If no row was inserted, the event was already seen: return 200 and skip the donation update.
3. If the row was inserted, run the guarded donation update.
4. On success, set `processed_at = now()`.
5. If the handler crashes before step 4, `processed_at` is null and Stripe's retry can finish the work.

Events with a missing `id` should be rejected or logged and retried; Stripe always sends one.

## What this PR does not propose

Other payment schema ideas (a unique `attempt_id` on `donation_records`, dropping the user insert policy on that table, and similar) are separate and are also not applied here.
