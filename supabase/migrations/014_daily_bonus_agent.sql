-- ─────────────────────────────────────────────────────────────────────────────
-- 014_daily_bonus_agent.sql
-- Seeds the Daily Bonus Distributor agent into the agents catalogue.
-- ─────────────────────────────────────────────────────────────────────────────

insert into agents (id, name, description, schedule_cron, enabled, config) values
  ('daily-bonus',
   'Daily Bonus Distributor',
   'Credits 100 civic points to every user wallet where last_daily_bonus < today. Runs once per day at 2 AM AEST (14:00 UTC). Non-destructive: skips wallets already credited today.',
   '0 14 * * *',
   true,
   '{"bonusPts": 100, "maxBatch": 5000}'::jsonb)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      schedule_cron = excluded.schedule_cron,
      config = excluded.config,
      updated_at = now();
