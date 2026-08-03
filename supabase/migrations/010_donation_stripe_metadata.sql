alter table donation_records
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists failure_reason text;

create index if not exists idx_donation_records_stripe_customer
  on donation_records(stripe_customer_id);

create index if not exists idx_donation_records_stripe_subscription
  on donation_records(stripe_subscription_id);
