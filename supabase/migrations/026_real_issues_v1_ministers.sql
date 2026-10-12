-- Real Issues V1 — Minister→Portfolio identity resolution for the three
-- newly-promoted real issues, via `members.tvfy_id` only.
--
-- Mirrors migration 023's pattern exactly (CANONICAL_PERSON_IDENTITY_V1_REPORT.md):
-- every lookup below is `where tvfy_id = <int>`, never a name or electorate
-- predicate. tvfy_id values were retrieved via a live, read-only call to
-- TheyVoteForYou's /people.json in this session (see
-- REAL_ISSUES_V1_DATA_REPORT.md), corroborated against each minister's own
-- electorate/state as listed in the 13 May 2025 Instrument of Appointment.
--
-- NDIS gets TWO minister rows, not one — the Instrument of Appointment
-- names both Mark Butler ("Minister for Health and Ageing and Minister for
-- Disability and the National Disability Insurance Scheme") and Jenny
-- McAllister ("Minister for the National Disability Insurance Scheme") for
-- overlapping NDIS-related offices. Neither is described as an Assistant
-- Minister in the instrument, so both are recorded as role_type = 'minister'
-- — a real example of the Charter's "responsibility is frequently held by
-- different people... for the same outcome" (§10), not a data-entry
-- ambiguity being resolved by picking one.
--
-- Guard: each lookup requires exactly the expected synced member and the
-- expected portfolio/evidence rows to exist, else raises rather than
-- guessing.
--
-- Idempotency: each insert is skipped if the role already exists.

do $$
declare
  v_member_id uuid;
  v_portfolio_id uuid;
  v_evidence_instrument_id uuid;
  v_role_id uuid;
begin
  select id into v_evidence_instrument_id from evidence
    where source_url = 'https://www.pmc.gov.au/resources/instruments-appointment-ministers-state-13-may-2025' limit 1;
  if v_evidence_instrument_id is null then
    raise exception 'BLOCKER: Instrument of Appointment evidence row not found — run migration 021 first.';
  end if;

  if not exists (select 1 from members where tvfy_id = 10086)
     or not exists (select 1 from members where tvfy_id = 10839)
     or not exists (select 1 from members where tvfy_id = 10060)
     or not exists (select 1 from members where tvfy_id = 10809) then
    raise notice 'Skipping minister relationships: the canonical member sync has not populated every required tvfy_id.';
    return;
  end if;

  -- ═══════════════════════════════════════════════════════════════════════
  -- NDIS: Mark Butler (tvfy_id 10086)
  -- ═══════════════════════════════════════════════════════════════════════
  select id into v_member_id from members where tvfy_id = 10086;
  if v_member_id is null then
    raise exception 'BLOCKER: no synced member found for tvfy_id=10086 (Mark Butler). Run /api/sync/members first.';
  end if;

  select id into v_portfolio_id from portfolios
    where canonical_name = 'National Disability Insurance Scheme' and jurisdiction = 'commonwealth' and effective_to is null;
  if v_portfolio_id is null then
    raise exception 'BLOCKER: NDIS portfolio not found — run migration 025 first.';
  end if;

  if not exists (
    select 1 from person_portfolio_roles
    where member_id = v_member_id and portfolio_id = v_portfolio_id and role_type = 'minister' and effective_to is null
  ) then
    insert into person_portfolio_roles (member_id, portfolio_id, role_type, responsibility_kind, effective_from, is_test_fixture)
    values (v_member_id, v_portfolio_id, 'minister', 'responsibility', '2025-05-13', false)
    returning id into v_role_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_instrument_id, 'person_portfolio_role', v_role_id);
  else
    raise notice 'Butler/NDIS role already exists — skipping.';
  end if;

  -- ═══════════════════════════════════════════════════════════════════════
  -- NDIS: Jenny McAllister (tvfy_id 10839) — Senate; resolved purely via
  -- tvfy_id, exactly like Butler above. No house/chamber-specific logic.
  -- ═══════════════════════════════════════════════════════════════════════
  select id into v_member_id from members where tvfy_id = 10839;
  if v_member_id is null then
    raise exception 'BLOCKER: no synced member found for tvfy_id=10839 (Jenny McAllister). Run /api/sync/members first.';
  end if;

  if not exists (
    select 1 from person_portfolio_roles
    where member_id = v_member_id and portfolio_id = v_portfolio_id and role_type = 'minister' and effective_to is null
  ) then
    insert into person_portfolio_roles (member_id, portfolio_id, role_type, responsibility_kind, effective_from, is_test_fixture)
    values (v_member_id, v_portfolio_id, 'minister', 'responsibility', '2025-05-13', false)
    returning id into v_role_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_instrument_id, 'person_portfolio_role', v_role_id);
  else
    raise notice 'McAllister/NDIS role already exists — skipping.';
  end if;

  -- ═══════════════════════════════════════════════════════════════════════
  -- Climate Change and Energy: Chris Bowen (tvfy_id 10060)
  -- ═══════════════════════════════════════════════════════════════════════
  select id into v_member_id from members where tvfy_id = 10060;
  if v_member_id is null then
    raise exception 'BLOCKER: no synced member found for tvfy_id=10060 (Chris Bowen). Run /api/sync/members first.';
  end if;

  select id into v_portfolio_id from portfolios
    where canonical_name = 'Climate Change and Energy' and jurisdiction = 'commonwealth' and effective_to is null;
  if v_portfolio_id is null then
    raise exception 'BLOCKER: Climate Change and Energy portfolio not found — run migration 025 first.';
  end if;

  if not exists (
    select 1 from person_portfolio_roles
    where member_id = v_member_id and portfolio_id = v_portfolio_id and role_type = 'minister' and effective_to is null
  ) then
    insert into person_portfolio_roles (member_id, portfolio_id, role_type, responsibility_kind, effective_from, is_test_fixture)
    values (v_member_id, v_portfolio_id, 'minister', 'responsibility', '2025-05-13', false)
    returning id into v_role_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_instrument_id, 'person_portfolio_role', v_role_id);
  else
    raise notice 'Bowen/Climate role already exists — skipping.';
  end if;

  -- ═══════════════════════════════════════════════════════════════════════
  -- Treasury: Jim Chalmers (tvfy_id 10809)
  -- ═══════════════════════════════════════════════════════════════════════
  select id into v_member_id from members where tvfy_id = 10809;
  if v_member_id is null then
    raise exception 'BLOCKER: no synced member found for tvfy_id=10809 (Jim Chalmers). Run /api/sync/members first.';
  end if;

  select id into v_portfolio_id from portfolios
    where canonical_name = 'Treasury' and jurisdiction = 'commonwealth' and effective_to is null;
  if v_portfolio_id is null then
    raise exception 'BLOCKER: Treasury portfolio not found — run migration 025 first.';
  end if;

  if not exists (
    select 1 from person_portfolio_roles
    where member_id = v_member_id and portfolio_id = v_portfolio_id and role_type = 'minister' and effective_to is null
  ) then
    insert into person_portfolio_roles (member_id, portfolio_id, role_type, responsibility_kind, effective_from, is_test_fixture)
    values (v_member_id, v_portfolio_id, 'minister', 'responsibility', '2025-05-13', false)
    returning id into v_role_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_instrument_id, 'person_portfolio_role', v_role_id);
  else
    raise notice 'Chalmers/Treasury role already exists — skipping.';
  end if;

  raise notice 'Real Issues V1 minister batch complete.';
end;
$$;
