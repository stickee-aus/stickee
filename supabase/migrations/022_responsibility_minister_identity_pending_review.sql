-- Responsibility Engine V1 — Proposed Minister→Portfolio identity resolution.
--
-- STATUS: INERT. Every executable statement in this file is wrapped in a
-- block comment and will do nothing if this migration is applied as-is.
-- This is deliberate — see RESPONSIBILITY_ENGINE_V1_FIRST_REAL_SLICE_REPORT.md
-- §6/§9 (Owner Decision 1) before uncommenting and applying it.
--
-- THE BLOCKER: migration 021 could not insert a Person→Portfolio row for
-- the current Minister for Housing (the Hon Clare O'Neil MP) because her
-- real, stable external identifier — TheyVoteForYou's numeric person id,
-- the value `members.tvfy_id` is keyed on — could not be retrieved in this
-- session. Her TVFY profile page (theyvoteforyou.org.au/people/representatives/
-- hotham/clare_o'neil) returned HTTP 403; TheyVoteForYou's own API
-- (api/v1/people.json) returned HTTP 401, requiring an API key
-- (THEYVOTEFORYOU_API_KEY, per AGENTS.md's known-debt list) that was not
-- available in this session and was not attempted to be obtained or
-- guessed. Per the task's explicit instruction, this is reported as a
-- stop, not worked around with name matching.
--
-- THE PROPOSED ALTERNATIVE (not yet applied): `members.electorate` and
-- `members.house` are also real, already-in-schema, non-name identifiers
-- (migration 002) — not the same column TheyVoteForYou-anchors identity on,
-- but a structurally unique one: exactly one sitting member holds a given
-- House electorate at a time. Clare O'Neil's electorate (Hotham, House of
-- Representatives) is independently confirmed via an official Australian
-- Parliament House source (parlinfo.aph.gov.au biography, "handbook/allmps/
-- 140590"), not just TheyVoteForYou's own listing — see the report for the
-- exact source. This is NOT name-string matching (nothing here compares
-- `members.name` to anything), but it is a different identifier than the
-- one the rest of this codebase treats as the canonical external anchor for
-- people, so applying it is being left as an explicit owner decision rather
-- than something this batch decides unilaterally.
--
-- WHAT WOULD MAKE THIS UNNECESSARY: once a real /api/sync/members run has
-- populated the `members` table from a live, authenticated TheyVoteForYou
-- fetch, an admin could instead look up Clare O'Neil's real `tvfy_id`
-- directly from that synced table and re-author this insert against
-- `tvfy_id` instead of `(electorate, house)` — the preferred, already-
-- canonical join per docs/architecture/CANONICAL_ID_STRATEGY.md. That would
-- be the cleaner resolution; this file exists so the batch isn't left fully
-- incomplete while that sync is pending.
--
-- TO APPLY: after owner review, delete the block-comment open and close
-- markers below (the slash-asterisk line just below this paragraph, and the
-- asterisk-slash line at the end of the file), leaving the SQL between them
-- intact, and run this migration.
-- Everything below the guard checks its own preconditions and raises a
-- clear exception rather than inserting anything incorrect if the expected
-- single row isn't found.

/*

do $$
declare
  v_member_id uuid;
  v_member_count int;
  v_portfolio_id uuid;
  v_evidence_instrument_id uuid;
  v_evidence_treasury_profile_id uuid;
  v_role_id uuid;
begin
  -- Guard: exactly one current member for Hotham (House) must exist.
  select count(*) into v_member_count from members where electorate = 'Hotham' and house = 'representatives';
  if v_member_count = 0 then
    raise exception 'BLOCKER: no synced member found for electorate=Hotham, house=representatives. Run /api/sync/members against a real TheyVoteForYou fetch first, then re-run this migration.';
  elsif v_member_count > 1 then
    raise exception 'BLOCKER: % members found for electorate=Hotham, house=representatives — expected exactly 1. This can happen if a stale prior member''s row was never removed by the sync (e.g. after a by-election). Resolve manually before proceeding — do not guess which row is current.', v_member_count;
  end if;

  select id into v_member_id from members where electorate = 'Hotham' and house = 'representatives';

  select id into v_portfolio_id from portfolios where canonical_name = 'Housing' and jurisdiction = 'commonwealth' and effective_to is null;
  if v_portfolio_id is null then
    raise exception 'BLOCKER: Housing portfolio not found — run migration 021 first.';
  end if;

  if exists (
    select 1 from person_portfolio_roles
    where member_id = v_member_id and portfolio_id = v_portfolio_id and role_type = 'minister' and effective_to is null
  ) then
    raise notice 'Person→Portfolio role already exists for this member/portfolio — skipping, this migration is idempotent.';
    return;
  end if;

  select id into v_evidence_instrument_id from evidence
    where source_url = 'https://www.pmc.gov.au/resources/instruments-appointment-ministers-state-13-may-2025' limit 1;
  select id into v_evidence_treasury_profile_id from evidence
    where source_url = 'https://ministers.treasury.gov.au/ministers/clare-oneil-2025' limit 1;
  if v_evidence_instrument_id is null or v_evidence_treasury_profile_id is null then
    raise exception 'BLOCKER: expected Evidence rows from migration 021 not found — run migration 021 first.';
  end if;

  insert into person_portfolio_roles (member_id, portfolio_id, role_type, responsibility_kind, effective_from, is_test_fixture)
  values (v_member_id, v_portfolio_id, 'minister', 'responsibility', '2025-05-13', false)
  returning id into v_role_id;

  insert into evidence_links (evidence_id, subject_type, subject_id) values
    (v_evidence_instrument_id, 'person_portfolio_role', v_role_id),
    (v_evidence_treasury_profile_id, 'person_portfolio_role', v_role_id);

  raise notice 'Inserted Person→Portfolio role % for member % on portfolio %.', v_role_id, v_member_id, v_portfolio_id;
end;
$$;

*/
