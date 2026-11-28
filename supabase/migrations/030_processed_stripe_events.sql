-- 030: processed_stripe_events: Stripe event.id deduplication for the webhook.
-- RLS enabled with no policies, and no privileges for anon / authenticated:
-- only the service role can read or write it.

create table if not exists public.processed_stripe_events (
  event_id     text primary key,
  type         text not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.processed_stripe_events enable row level security;

revoke all on public.processed_stripe_events from anon, authenticated;
