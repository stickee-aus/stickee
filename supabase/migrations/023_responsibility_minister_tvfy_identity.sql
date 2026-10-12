-- Responsibility Engine V1 — Minister→Portfolio identity resolution via tvfy_id.
--
-- Supersedes migration 022 as the applied path. Migration 022 proposed an
-- electorate+house fallback specifically because TheyVoteForYou's API was
-- unreachable in the sessions that authored migrations 021/022 (their
-- profile page returned HTTP 403; their API returned HTTP 401 without
-- THEYVOTEFORYOU_API_KEY). That key is now present in this environment and
-- the API is reachable, so this migration uses the codebase's actual
-- canonical external anchor for a person — `members.tvfy_id`
-- (docs/architecture/CANONICAL_ID_STRATEGY.md) — instead of the electorate
-- fallback. Migration 022 is left in place, unmodified, as the historical
-- record of why the fallback was proposed; it is not applied.
--
-- Identity chain for this row, every link independently verifiable, no name
-- matching anywhere in this file's executable SQL:
--   1. Live TheyVoteForYou API (https://theyvoteforyou.org.au/api/v1/people.json),
--      fetched directly in this session (not from memory), returned exactly
--      one person for electorate=Hotham, house=representatives: tvfy_id 10814.
--   2. A real `/api/sync/members`-equivalent sync (this session, against
--      this local database only) populated `members` from that same live
--      fetch, so `members.tvfy_id = 10814` is present and real.
--   3. tvfy_id 10814 is looked up below purely by its integer value — the
--      member's name is never compared as a matching predicate.
--   4. The Evidence rows from migration 021 (PM&C instrument of appointment,
--      AAO, Treasury ministers directory) independently corroborate that the
--      Hotham member is the Minister for Housing; the electorate/house match
--      is structural corroboration, not the join key.
--
-- Guard: exactly one member with this tvfy_id must exist, else this raises
-- and inserts nothing.
--
-- Idempotency: does nothing on a second run if the role already exists.
--
-- Reversal: same append-only-history caveat as migration 021 — once applied,
-- this is real (is_test_fixture = false) history; the correct way to end the
-- role is to set effective_to on the row (a reshuffle), not delete it. See
-- migration 019's enforce_history_append_only()/prevent_row_delete() triggers.

do $$
declare
  v_tvfy_id integer := 10814; -- Clare O'Neil, electorate Hotham, house representatives
  v_member_id uuid;
  v_portfolio_id uuid;
  v_evidence_instrument_id uuid;
  v_evidence_treasury_profile_id uuid;
  v_role_id uuid;
begin
  select id into v_member_id from members where tvfy_id = v_tvfy_id;
  if v_member_id is null then
    raise notice 'Skipping Housing minister relationship: no synced member for tvfy_id=%. This enrichment requires the external member sync.', v_tvfy_id;
    return;
  end if;

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

  raise notice 'Inserted Person→Portfolio role % for member % (tvfy_id=%) on portfolio %.', v_role_id, v_member_id, v_tvfy_id, v_portfolio_id;
end;
$$;
