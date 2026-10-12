-- Responsibility Engine V1 — First Real Data Slice.
--
-- See RESPONSIBILITY_ENGINE_V1_FIRST_REAL_SLICE_REPORT.md for the full
-- research trail, source verification, and reasoning behind every value
-- below. This migration inserts REAL (is_test_fixture = false) rows — not
-- fixtures — for exactly one issue, exactly one portfolio, exactly one
-- department, and the relationships connecting them, each backed by at
-- least one officially-sourced Evidence record.
--
-- Deliberately excluded from this file: the Person→Portfolio (Minister)
-- relationship. See migration 022 — the current minister's identity could
-- not be safely mapped to `members.id` in this session (the only reliable
-- external anchor, TheyVoteForYou's numeric person id, sits behind an API
-- key this environment does not have; the profile page itself returned
-- HTTP 403). Per the task's explicit instruction ("If the current minister
-- cannot be safely mapped to members.id: stop and report the canonical-id
-- blocker"), that relationship is NOT inserted here. Migration 022 proposes
-- one safe alternative (electorate-based lookup) but ships inert — commented
-- out — pending explicit owner review, rather than silently substituting a
-- different matching method for the one that was blocked.
--
-- Idempotency: this migration checks for an existing 'Housing' portfolio in
-- the 'commonwealth' jurisdiction before doing anything, and does nothing on
-- a second run — safe to include in a repeated `supabase db reset`.
--
-- Reversal: `delete from issue_portfolios where issue_id = 'housing-affordability'
-- and portfolio_id in (select id from portfolios where canonical_name = 'Housing'
-- and jurisdiction = 'commonwealth'); delete from department_portfolios where
-- portfolio_id in (...); delete from departments where canonical_name =
-- 'Department of the Treasury' and jurisdiction = 'commonwealth'; delete from
-- portfolios where canonical_name = 'Housing' and jurisdiction = 'commonwealth';
-- delete from evidence where source_url in (the three URLs below);` — note the
-- append-only DELETE-blocking triggers from migration 018/019 mean these
-- reversal deletes will themselves be rejected once this data exists; a real
-- rollback of REAL (non-fixture) responsibility data is an editorial
-- decision requiring superseding evidence, not a schema operation — see
-- RESPONSIBILITY_ENGINE_V1_FIRST_REAL_SLICE_REPORT.md §9 (owner decisions)
-- for why that's the correct behaviour, not a bug in this migration.

do $$
declare
  v_issue_id text := 'housing-affordability';
  v_existing_portfolio_id uuid;

  v_evidence_instrument_id uuid;
  v_evidence_aao_id uuid;
  v_evidence_treasury_profile_id uuid;

  v_portfolio_id uuid;
  v_department_id uuid;
  v_department_portfolio_id uuid;
  v_issue_portfolio_id uuid;
begin
  -- Migration 024 creates the sourced real issue row on a fresh install. The
  -- evidence/portfolio/department records below do not depend on that row,
  -- so they are created now and migration 025 completes the deferred FK link.
  -- Existing databases that already contain the issue keep the original path.

  -- ── Guard 2: idempotency — do nothing if this has already been inserted ──
  select id into v_existing_portfolio_id
  from portfolios
  where canonical_name = 'Housing' and jurisdiction = 'commonwealth' and effective_to is null
  limit 1;

  if v_existing_portfolio_id is not null then
    raise notice 'Housing portfolio already exists (id=%) — skipping, this migration is idempotent.', v_existing_portfolio_id;
    return;
  end if;

  -- ── Evidence 1: Instrument of appointment (13 May 2025) ─────────────────
  -- Primary source establishing the "Minister for Housing" office and that
  -- its holder concurrently administers the Department of the Treasury.
  -- Reserved for migration 022's Person→Portfolio relationship, and linked
  -- here to the Portfolio entity itself (it establishes the office exists).
  insert into evidence (
    source_type, title, source_url, publisher, source_published_at, classification, notes, is_test_fixture
  ) values (
    'official',
    'Instruments of appointment of ministers of state: 13 May 2025 — Clare Ellen O''Neil',
    'https://www.pmc.gov.au/resources/instruments-appointment-ministers-state-13-may-2025',
    'Department of the Prime Minister and Cabinet (Australia)',
    '2025-05-13',
    'verified_fact',
    'Governor-General''s instrument: "appoint and direct Clare Ellen O''Neil ... to (a) administer, under section 64 of the Constitution, the Department of the Treasury; and (b) hold, under section 65 of the Constitution, the offices of Minister for Housing, Minister for Homelessness and Minister for Cities." Retrieved via live web fetch in this session — not from model memory. Establishes the Minister for Housing office and its holder''s administration of the Department of the Treasury; the Person→Portfolio row itself is deferred to migration 022 pending identity-mapping review.',
    false
  ) returning id into v_evidence_instrument_id;

  -- ── Evidence 2: Administrative Arrangements Order (13 May 2025) ─────────
  -- Primary source establishing that housing policy sits within the
  -- Treasury portfolio — backs both Department↔Portfolio and Issue↔Portfolio.
  insert into evidence (
    source_type, title, source_url, publisher, source_published_at, classification, notes, is_test_fixture
  ) values (
    'official',
    'Administrative Arrangements Order — 13 May 2025',
    'https://www.pmc.gov.au/resources/aao-13-may-2025',
    'Department of the Prime Minister and Cabinet (Australia)',
    '2025-05-13',
    'verified_fact',
    'Order transfers "housing, rental and homelessness policy" from the Social Services portfolio, and "land and planning policy and cities and urban policy" from the Infrastructure, Transport, Regional Development, Communications, Sport and the Arts portfolio, into the Treasury portfolio. Retrieved via live web fetch in this session. Machinery-of-government basis for the Department of the Treasury administering the Housing portfolio, and for housing-affordability as an issue sitting within that portfolio.',
    false
  ) returning id into v_evidence_aao_id;

  -- ── Evidence 3: current ministers.treasury.gov.au portfolio profile ─────
  -- Corroborating, current-status source (a live government directory page,
  -- not dated at the source — source_published_at intentionally left null
  -- rather than guessed; retrieved_at records when this session fetched it).
  insert into evidence (
    source_type, title, source_url, publisher, classification, notes, is_test_fixture
  ) values (
    'official',
    'The Hon Clare O''Neil MP — Ministers for the Treasury portfolio',
    'https://ministers.treasury.gov.au/ministers/clare-oneil-2025',
    'Australian Government — The Treasury (Ministers for the Treasury portfolio)',
    'verified_fact',
    'Official Treasury ministers directory entry listing Clare O''Neil as Minister for Housing, Minister for Homelessness, and Minister for Cities, sworn in 13 May 2025. Live/undated page — no source_published_at recorded, only retrieved_at. Retrieved via live web fetch in this session.',
    false
  ) returning id into v_evidence_treasury_profile_id;

  -- ── Portfolio: Housing (commonwealth) ────────────────────────────────────
  -- effective_from = 2025-05-13, the date evidenced above. This is the
  -- earliest date this batch has real evidence for — NOT a claim that the
  -- Housing portfolio did not exist before this date (it did, under a
  -- different administrative arrangement). See
  -- RESPONSIBILITY_ENGINE_V1_FIRST_REAL_SLICE_REPORT.md §5.
  insert into portfolios (canonical_name, jurisdiction, effective_from, is_test_fixture)
  values ('Housing', 'commonwealth', '2025-05-13', false)
  returning id into v_portfolio_id;

  insert into evidence_links (evidence_id, subject_type, subject_id) values
    (v_evidence_instrument_id, 'portfolio', v_portfolio_id),
    (v_evidence_aao_id, 'portfolio', v_portfolio_id),
    (v_evidence_treasury_profile_id, 'portfolio', v_portfolio_id);

  -- ── Department: Department of the Treasury (commonwealth) ──────────────
  -- Same effective_from caveat as Portfolio above — Treasury has existed
  -- far longer than this date; this is only the earliest evidenced date in
  -- this batch, not a founding date (not independently verified here).
  insert into departments (canonical_name, jurisdiction, effective_from, is_test_fixture)
  values ('Department of the Treasury', 'commonwealth', '2025-05-13', false)
  returning id into v_department_id;

  insert into evidence_links (evidence_id, subject_type, subject_id) values
    (v_evidence_instrument_id, 'department', v_department_id);

  -- ── Department ↔ Portfolio: Treasury administers Housing ────────────────
  insert into department_portfolios (department_id, portfolio_id, effective_from, is_test_fixture)
  values (v_department_id, v_portfolio_id, '2025-05-13', false)
  returning id into v_department_portfolio_id;

  insert into evidence_links (evidence_id, subject_type, subject_id) values
    (v_evidence_aao_id, 'department_portfolio', v_department_portfolio_id);

  -- ── Issue ↔ Portfolio: housing-affordability → Housing portfolio ───────
  -- responsibility_kind = 'responsibility' (the portfolio-holder is
  -- politically accountable for this policy area) — matches
  -- docs/architecture/RESPONSIBILITY_ENGINE.md §4's own worked example for
  -- this exact issue. This is the ONLY responsibility_kind inserted for
  -- this issue in this batch — per the task's "insert only the minimum
  -- real records required to prove the chain" instruction, this batch does
  -- not attempt the fuller multi-actor housing model (state governments,
  -- RBA, local councils) that RESPONSIBILITY_ENGINE.md §4 describes as the
  -- eventual, fuller picture.
  if exists (select 1 from issues where id = v_issue_id and is_test_fixture = false) then
    insert into issue_portfolios (issue_id, portfolio_id, responsibility_kind, effective_from, is_test_fixture)
    values (v_issue_id, v_portfolio_id, 'responsibility', '2025-05-13', false)
    returning id into v_issue_portfolio_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_aao_id, 'issue_portfolio', v_issue_portfolio_id);
  else
    raise notice 'Real issue "%" is created by migration 024; migration 025 will complete its portfolio link.', v_issue_id;
  end if;

  raise notice 'Inserted real Responsibility Engine data for issue "%": portfolio=%, department=%, department_portfolio=%, issue_portfolio=%. Person→Portfolio (Minister) NOT inserted — see migration 022.',
    v_issue_id, v_portfolio_id, v_department_id, v_department_portfolio_id, v_issue_portfolio_id;
end;
$$;
