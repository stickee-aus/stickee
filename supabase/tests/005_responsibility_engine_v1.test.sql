-- ─────────────────────────────────────────────────────────────────────────────
-- 005_responsibility_engine_v1.test.sql
--
-- Run only against a disposable local/test Supabase database. Example:
--
--   supabase start
--   supabase db reset          # applies all migrations (incl. 018–020) + supabase/seed.sql
--   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" \
--        -f supabase/tests/005_responsibility_engine_v1.test.sql
--
-- Or against a disposable staging database:
--   psql "$STAGING_DATABASE_URL" -f supabase/tests/005_responsibility_engine_v1.test.sql
--
-- NEVER run this against a production DATABASE_URL. Everything here runs
-- inside a single transaction that is rolled back at the end (see the
-- `rollback;` on the last line) — no row created by this file is meant to
-- persist, even against a local/dev database.
--
-- Covers: RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md §9's test list —
-- admin-gated writes, public/fixture read split, append-only history
-- enforcement, delete-blocking, evidence immutability after supersession,
-- and issue↔portfolio cardinality.
-- ─────────────────────────────────────────────────────────────────────────────

\set ON_ERROR_STOP on

begin;

-- ── Setup: one admin user, one regular user, one real Issue row ────────────

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000030', 'responsibility-test-admin@example.invalid'),
  ('00000000-0000-0000-0000-000000000031', 'responsibility-test-user@example.invalid')
on conflict (id) do nothing;

insert into app_admins (user_id) values
  ('00000000-0000-0000-0000-000000000030')
on conflict (user_id) do nothing;

insert into issues (id, title, summary, status) values
  ('rt-fixture-issue', '[TEST FIXTURE] Responsibility engine test issue', 'Fixture for 005 tests', 'active')
on conflict (id) do nothing;

-- Session-local scratch table for passing ids between the DO blocks below
-- (PL/pgSQL variables don't survive across separate DO blocks). Created
-- up front, before any role switching, so its existence never depends on
-- the `authenticated`/`anon` role's own CREATE TEMP TABLE privilege.
create temp table rt_fixture_ids (key text primary key, value uuid);
grant select on rt_fixture_ids to anon, authenticated;
grant insert, update on rt_fixture_ids to authenticated;

-- ── Test 1: a non-admin authenticated user cannot insert a Portfolio ───────

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000031')::text, true);

do $$
begin
  begin
    insert into portfolios (canonical_name, jurisdiction, effective_from, is_test_fixture)
    values ('[TEST FIXTURE] Housing', 'commonwealth', '2024-01-01', true);
    raise exception 'FAIL: non-admin was able to insert a portfolio';
  exception
    when others then
      if sqlerrm like '%new row violates row-level security%' or sqlerrm like '%permission denied%' then
        raise notice 'PASS: non-admin insert into portfolios rejected by RLS';
      else
        raise;
      end if;
  end;
end;
$$;

reset role;

-- ── Test 2: an admin CAN insert Portfolio/Department/Evidence fixtures ─────

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000030')::text, true);

do $$
declare
  v_portfolio_id uuid;
  v_department_id uuid;
  v_evidence_id uuid;
begin
  insert into portfolios (canonical_name, jurisdiction, effective_from, is_test_fixture, created_by)
  values ('[TEST FIXTURE] Housing', 'commonwealth', '2024-01-01', true, '00000000-0000-0000-0000-000000000030')
  returning id into v_portfolio_id;

  insert into departments (canonical_name, jurisdiction, effective_from, is_test_fixture, created_by)
  values ('[TEST FIXTURE] Department of Housing', 'commonwealth', '2024-01-01', true, '00000000-0000-0000-0000-000000000030')
  returning id into v_department_id;

  insert into evidence (source_type, title, source_url, publisher, classification, is_test_fixture, created_by)
  values (
    'official',
    '[TEST FIXTURE] Administrative Arrangements Order',
    'https://example.gov.au/aao-test-fixture',
    'Department of the Prime Minister and Cabinet',
    'verified_fact',
    true,
    '00000000-0000-0000-0000-000000000030'
  )
  returning id into v_evidence_id;

  if v_portfolio_id is null or v_department_id is null or v_evidence_id is null then
    raise exception 'FAIL: admin insert did not return ids';
  end if;
  raise notice 'PASS: admin inserted portfolio %, department %, evidence %', v_portfolio_id, v_department_id, v_evidence_id;

  -- stash for later tests (rt_fixture_ids created up front, before any role switching)
  insert into rt_fixture_ids values ('portfolio', v_portfolio_id) on conflict (key) do update set value = excluded.value;
  insert into rt_fixture_ids values ('department', v_department_id) on conflict (key) do update set value = excluded.value;
  insert into rt_fixture_ids values ('evidence', v_evidence_id) on conflict (key) do update set value = excluded.value;
end;
$$;

reset role;

-- ── Test 3: fixture rows are invisible to a non-admin authenticated user ───

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000031')::text, true);

do $$
declare
  v_portfolio_id uuid;
  v_count int;
begin
  select value into v_portfolio_id from rt_fixture_ids where key = 'portfolio';
  select count(*) into v_count from portfolios where id = v_portfolio_id;
  if v_count <> 0 then
    raise exception 'FAIL: non-admin could see a fixture portfolio row (count=%)', v_count;
  end if;
  raise notice 'PASS: fixture portfolio row is invisible to a non-admin reader';
end;
$$;

reset role;

-- ── Test 4: a real Portfolio→Issue relationship is publicly readable ───────
-- (mirrors real usage: only fixtures are hidden, real evidence-backed data
-- is meant to be public — see EVIDENCE_PROVENANCE_MODEL.md.)

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-000000000030')::text, true);

do $$
declare
  v_real_portfolio_id uuid;
begin
  insert into portfolios (canonical_name, jurisdiction, effective_from, is_test_fixture, created_by)
  values ('Housing (005 test — treated as real, not a fixture)', 'commonwealth', '2024-01-01', false, '00000000-0000-0000-0000-000000000030')
  returning id into v_real_portfolio_id;

  insert into rt_fixture_ids values ('real_portfolio', v_real_portfolio_id) on conflict (key) do update set value = excluded.value;
end;
$$;

reset role;

set local role anon;

do $$
declare
  v_real_portfolio_id uuid;
  v_count int;
begin
  select value into v_real_portfolio_id from rt_fixture_ids where key = 'real_portfolio';
  select count(*) into v_count from portfolios where id = v_real_portfolio_id;
  if v_count <> 1 then
    raise exception 'FAIL: anonymous reader could not see a non-fixture portfolio (count=%)', v_count;
  end if;
  raise notice 'PASS: non-fixture portfolio is publicly readable by anon';
end;
$$;

reset role;

-- ── Test 5: append-only history — closing a row correctly succeeds ─────────

do $$
declare
  v_portfolio_id uuid;
begin
  select value into v_portfolio_id from rt_fixture_ids where key = 'portfolio';
  update portfolios set effective_to = '2024-06-01' where id = v_portfolio_id;
  raise notice 'PASS: setting effective_to on an open historical row succeeded';
end;
$$;

-- ── Test 6: append-only history — editing any other field on an OPEN row is rejected ──
-- (tested against a fresh open row, since Test 5 already closed the one above)

do $$
declare
  v_portfolio_id uuid;
begin
  insert into portfolios (canonical_name, jurisdiction, effective_from, is_test_fixture, created_by)
  values ('[TEST FIXTURE] Housing v2', 'commonwealth', '2024-01-01', true, '00000000-0000-0000-0000-000000000030')
  returning id into v_portfolio_id;
  insert into rt_fixture_ids values ('portfolio_v2', v_portfolio_id) on conflict (key) do update set value = excluded.value;

  begin
    update portfolios set canonical_name = 'Renamed without closing' where id = v_portfolio_id;
    raise exception 'FAIL: editing canonical_name in place (without setting effective_to) was allowed';
  exception
    when others then
      if sqlerrm like '%in-place edits are not permitted%' then
        raise notice 'PASS: in-place edit to an open historical row was rejected';
      else
        raise;
      end if;
  end;
end;
$$;

-- ── Test 7: append-only history — a CLOSED row can never be updated again ──

do $$
declare
  v_portfolio_id uuid;
begin
  select value into v_portfolio_id from rt_fixture_ids where key = 'portfolio'; -- closed in Test 5
  begin
    update portfolios set effective_to = '2024-07-01' where id = v_portfolio_id;
    raise exception 'FAIL: re-updating an already-closed historical row was allowed';
  exception
    when others then
      if sqlerrm like '%already closed%' then
        raise notice 'PASS: updating an already-closed row was rejected';
      else
        raise;
      end if;
  end;
end;
$$;

-- ── Test 8: rows in time-ranged tables can never be deleted, even as postgres ──
-- (this session connects as `postgres`, which owns the table and bypasses
-- RLS entirely — the delete-blocking trigger is the only thing stopping
-- this, proving the protection isn't just an RLS policy the service-role
-- admin client could bypass.)

do $$
declare
  v_portfolio_id uuid;
begin
  select value into v_portfolio_id from rt_fixture_ids where key = 'portfolio_v2';
  begin
    delete from portfolios where id = v_portfolio_id;
    raise exception 'FAIL: a portfolio row was deleted';
  exception
    when others then
      if sqlerrm like '%cannot be deleted%' then
        raise notice 'PASS: delete on portfolios was rejected even for the table-owning role';
      else
        raise;
      end if;
  end;
end;
$$;

-- ── Test 9: Evidence core fields are immutable once superseded ─────────────

do $$
declare
  v_evidence_id uuid;
  v_new_evidence_id uuid;
begin
  select value into v_evidence_id from rt_fixture_ids where key = 'evidence';

  insert into evidence (source_type, title, source_url, publisher, classification, is_test_fixture, created_by)
  values (
    'official',
    '[TEST FIXTURE] Corrected AAO listing',
    'https://example.gov.au/aao-test-fixture-corrected',
    'Department of the Prime Minister and Cabinet',
    'verified_fact',
    true,
    '00000000-0000-0000-0000-000000000030'
  )
  returning id into v_new_evidence_id;

  update evidence set superseded_by_id = v_new_evidence_id where id = v_evidence_id;
  raise notice 'PASS: setting superseded_by_id on evidence succeeded';

  begin
    update evidence set title = 'Trying to rewrite history' where id = v_evidence_id;
    raise exception 'FAIL: editing a superseded evidence row was allowed';
  exception
    when others then
      if sqlerrm like '%already been superseded%' then
        raise notice 'PASS: editing a superseded evidence row was rejected';
      else
        raise;
      end if;
  end;
end;
$$;

-- ── Test 10: evidence classified disputed_claim requires a dispute_note ────

do $$
begin
  begin
    insert into evidence (source_type, title, source_url, classification, is_test_fixture, created_by)
    values ('official', '[TEST FIXTURE] Disputed listing', 'https://example.gov.au/disputed', 'disputed_claim', true, '00000000-0000-0000-0000-000000000030');
    raise exception 'FAIL: disputed_claim evidence was accepted without a dispute_note';
  exception
    when others then
      if sqlerrm like '%evidence_dispute_note_required%' then
        raise notice 'PASS: disputed_claim without dispute_note rejected by CHECK constraint';
      else
        raise;
      end if;
  end;
end;
$$;

-- ── Test 11: one issue can carry multiple concurrent Portfolio relationships ──

do $$
declare
  v_portfolio_a uuid;
  v_portfolio_b uuid;
  v_count int;
begin
  insert into portfolios (canonical_name, jurisdiction, effective_from, is_test_fixture, created_by)
  values ('[TEST FIXTURE] Treasury', 'commonwealth', '2024-01-01', true, '00000000-0000-0000-0000-000000000030')
  returning id into v_portfolio_a;

  insert into portfolios (canonical_name, jurisdiction, effective_from, is_test_fixture, created_by)
  values ('[TEST FIXTURE] Planning (NSW)', 'nsw', '2024-01-01', true, '00000000-0000-0000-0000-000000000030')
  returning id into v_portfolio_b;

  insert into issue_portfolios (issue_id, portfolio_id, responsibility_kind, is_test_fixture, created_by)
  values ('rt-fixture-issue', v_portfolio_a, 'influence', true, '00000000-0000-0000-0000-000000000030');

  insert into issue_portfolios (issue_id, portfolio_id, responsibility_kind, is_test_fixture, created_by)
  values ('rt-fixture-issue', v_portfolio_b, 'implementation', true, '00000000-0000-0000-0000-000000000030');

  select count(*) into v_count from issue_portfolios where issue_id = 'rt-fixture-issue' and effective_to is null;
  if v_count <> 2 then
    raise exception 'FAIL: expected 2 concurrent issue_portfolios rows for rt-fixture-issue, found %', v_count;
  end if;
  raise notice 'PASS: one issue carries multiple concurrent portfolio relationships (count=%)', v_count;
end;
$$;

-- ── Test 12: one portfolio can be linked from multiple issues ──────────────

do $$
declare
  v_portfolio_a uuid;
  v_count int;
begin
  select value into v_portfolio_a from rt_fixture_ids where key = 'real_portfolio';

  insert into issues (id, title, summary, status) values
    ('rt-fixture-issue-2', '[TEST FIXTURE] Second responsibility engine test issue', 'Fixture for 005 tests', 'active')
  on conflict (id) do nothing;

  insert into issue_portfolios (issue_id, portfolio_id, responsibility_kind, is_test_fixture, created_by)
  values ('rt-fixture-issue', v_portfolio_a, 'representation', true, '00000000-0000-0000-0000-000000000030');

  insert into issue_portfolios (issue_id, portfolio_id, responsibility_kind, is_test_fixture, created_by)
  values ('rt-fixture-issue-2', v_portfolio_a, 'representation', true, '00000000-0000-0000-0000-000000000030');

  select count(*) into v_count from issue_portfolios where portfolio_id = v_portfolio_a and effective_to is null;
  if v_count <> 2 then
    raise exception 'FAIL: expected 2 issues linked to the same portfolio, found %', v_count;
  end if;
  raise notice 'PASS: one portfolio is linked from multiple issues (count=%)', v_count;
end;
$$;

reset role;

rollback;
