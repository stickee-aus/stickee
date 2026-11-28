-- 031: additive. Lets the webhook record recurring (monthly) renewal payments
-- as their own donation rows, one per Stripe invoice, without duplicates.
-- Nullable column plus a partial unique index; existing rows are untouched.

alter table public.donation_records
  add column if not exists stripe_invoice_id text;

create unique index if not exists idx_donation_records_stripe_invoice
  on public.donation_records (stripe_invoice_id)
  where stripe_invoice_id is not null;
