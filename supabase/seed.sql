-- ─────────────────────────────────────────────────────────────────────────────
-- supabase/seed.sql
--
-- NOT RUN in this session, and not applied to any database by this batch.
--
-- This repo has no supabase/config.toml yet, so the Supabase CLI's normal
-- "seed.sql is auto-applied by `supabase db reset` / `supabase start` in
-- local dev, and NEVER by `supabase db push` against production" convention
-- isn't wired up. Until `supabase init` (or equivalent config) exists, there
-- is no automatic guard stopping someone from running this file against a
-- production DATABASE_URL with a bare `psql` — that gap is called out
-- explicitly in docs/audits/IMPLEMENTATION_BATCH_1_REPORT.md as a recommended near-term
-- follow-up, not silently assumed solved.
--
-- Run it, once you have a local/dev/staging Supabase project:
--   supabase start          # if config.toml exists, this applies seed.sql automatically
--   -- or manually, against a database you are certain is NOT production:
--   psql "$DEV_DATABASE_URL" -f supabase/seed.sql
--
-- Every row here is marked is_test_fixture = true and has a question
-- prefixed "[TEST FIXTURE]" so it can never be mistaken for a real market,
-- and read paths (issues-db.ts, predictions-db.ts) explicitly filter these
-- out of any public listing regardless of which database they're loaded into.
-- ─────────────────────────────────────────────────────────────────────────────

insert into issues (id, title, summary, content, what_is_happening, who_supports, who_opposes, status, source_url, is_test_fixture)
values
  ('test-market-open', '[TEST FIXTURE] Open market', 'Not a real issue — used to test staking, settlement, and duplicate-resolution protection.', 'Test fixture.', 'Test fixture.', 'Test fixture.', 'Test fixture.', 'active', null, true),
  ('test-market-expired', '[TEST FIXTURE] Expired market', 'Not a real issue — used to test that expired markets reject new stakes.', 'Test fixture.', 'Test fixture.', 'Test fixture.', 'Test fixture.', 'active', null, true),
  ('test-market-no-settlement', '[TEST FIXTURE] NO-settlement market', 'Not a real issue — used to test NO-outcome settlement in isolation from the open/YES fixture.', 'Test fixture.', 'Test fixture.', 'Test fixture.', 'Test fixture.', 'active', null, true),
  ('test-market-void', '[TEST FIXTURE] Void-refund market', 'Not a real issue — used to test VOID-outcome refunds in isolation from the other fixtures.', 'Test fixture.', 'Test fixture.', 'Test fixture.', 'Test fixture.', 'active', null, true)
on conflict (id) do nothing;

insert into issue_markets (issue_id, question, category, status, probability, resolves_by, opens_at, closes_at, is_test_fixture)
values
  ('test-market-open',          '[TEST FIXTURE] Will this test market resolve YES? (not a real market)', 'bill', 'active', 50, 'test fixture — see opens_at/closes_at', now() - interval '1 day', now() + interval '30 days', true),
  ('test-market-expired',       '[TEST FIXTURE] This test market already closed. (not a real market)',   'bill', 'active', 50, 'test fixture — already expired',       now() - interval '30 days', now() - interval '1 day', true),
  ('test-market-no-settlement', '[TEST FIXTURE] Will this test market resolve NO? (not a real market)',  'bill', 'active', 50, 'test fixture — see opens_at/closes_at', now() - interval '1 day', now() + interval '30 days', true),
  ('test-market-void',          '[TEST FIXTURE] Will this test market be voided? (not a real market)',   'bill', 'active', 50, 'test fixture — see opens_at/closes_at', now() - interval '1 day', now() + interval '30 days', true)
on conflict (issue_id) do nothing;
