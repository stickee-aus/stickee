-- Real Issues V1 — Portfolio/Department/Issue↔Portfolio relationships for
-- the three newly-promoted real issues (ndis-reform, climate-safeguard,
-- tax-cuts), plus supplementary Evidence for the pre-existing Housing slice.
--
-- Mirrors migration 021's pattern exactly (same guard style, same
-- idempotency style, same append-only-aware reversal note) — extended to
-- three portfolios instead of one. See REAL_ISSUES_V1_DATA_REPORT.md for
-- the full source trail.
--
-- Deliberately excluded from this file: the Person→Portfolio (Minister)
-- relationships for these three portfolios — see migration 026, which
-- resolves each via `members.tvfy_id` only, following the pattern
-- established in migration 023 (CANONICAL_PERSON_IDENTITY_V1_REPORT.md).
--
-- Idempotency: each portfolio insert is guarded on not already existing
-- (by canonical_name + jurisdiction), matching migration 021.
--
-- Reversal: same append-only-history caveat as migration 021 — once
-- applied, this is real (is_test_fixture = false) history; the correct way
-- to end a relationship is to set effective_to (a machinery-of-government
-- change), not delete it.

do $$
declare
  v_evidence_instrument_id uuid; -- Instruments of appointment, 13 May 2025 (from migration 021)
  v_evidence_aao_id uuid;        -- AAO, 13 May 2025 (from migration 021)

  v_evidence_ndis_act_id uuid;
  v_evidence_ndis_news_id uuid;
  v_evidence_safeguard_act_id uuid;
  v_evidence_dcceew_overview_id uuid;
  v_evidence_tax_act_id uuid;
  v_evidence_help_to_buy_act_id uuid;
  v_evidence_housing_australia_release_id uuid;

  v_portfolio_id uuid;
  v_department_id uuid;
  v_department_portfolio_id uuid;
  v_issue_portfolio_id uuid;
  v_existing_id uuid;
begin
  -- ── Preconditions ─────────────────────────────────────────────────────
  if not exists (select 1 from issues where id = 'ndis-reform' and is_test_fixture = false) then
    raise exception 'BLOCKER: issue "ndis-reform" does not exist as a real row. Run migration 024 first.';
  end if;
  if not exists (select 1 from issues where id = 'climate-safeguard' and is_test_fixture = false) then
    raise exception 'BLOCKER: issue "climate-safeguard" does not exist as a real row. Run migration 024 first.';
  end if;
  if not exists (select 1 from issues where id = 'tax-cuts' and is_test_fixture = false) then
    raise exception 'BLOCKER: issue "tax-cuts" does not exist as a real row. Run migration 024 first.';
  end if;

  select id into v_evidence_instrument_id from evidence
    where source_url = 'https://www.pmc.gov.au/resources/instruments-appointment-ministers-state-13-may-2025' limit 1;
  select id into v_evidence_aao_id from evidence
    where source_url = 'https://www.pmc.gov.au/resources/aao-13-may-2025' limit 1;
  if v_evidence_instrument_id is null or v_evidence_aao_id is null then
    raise exception 'BLOCKER: expected Evidence rows from migration 021 not found — run migration 021 first.';
  end if;

  -- ── New Evidence ──────────────────────────────────────────────────────
  insert into evidence (source_type, title, source_url, publisher, source_published_at, classification, notes, is_test_fixture)
  values (
    'official',
    'National Disability Insurance Scheme Amendment (Getting the NDIS Back on Track No. 1) Act 2024',
    'https://www.legislation.gov.au/C2024A00081/asmade',
    'Federal Register of Legislation',
    '2024-09-05',
    'verified_fact',
    'Act passed by Parliament 22 August 2024; commenced 3 October 2024. Amends the National Disability Insurance Scheme Act 2013. Retrieved via live web fetch/search in this session — not from model memory.',
    false
  ) returning id into v_evidence_ndis_act_id;

  insert into evidence (source_type, title, source_url, publisher, classification, notes, is_test_fixture)
  values (
    'official',
    'Critical NDIS legislation becomes law',
    'https://www.ndis.gov.au/news/10304-critical-ndis-legislation-becomes-law',
    'National Disability Insurance Agency (NDIS)',
    'verified_fact',
    'Official NDIA news item corroborating the 2024 Act''s passage and commencement dates. Live/undated page at retrieval — source_published_at left null rather than guessed; retrieved_at records this session''s fetch.',
    false
  ) returning id into v_evidence_ndis_news_id;

  insert into evidence (source_type, title, source_url, publisher, source_published_at, classification, notes, is_test_fixture)
  values (
    'official',
    'Safeguard Mechanism (Crediting) Amendment Act 2023',
    'https://www.legislation.gov.au/C2023A00014',
    'Federal Register of Legislation',
    '2023-03-30',
    'verified_fact',
    'Act passed by both Houses of Parliament 30 March 2023; amends the National Greenhouse and Energy Reporting Act 2007 to establish Safeguard Mechanism Credits and a hard cap of 1,233 Mt CO2-e net safeguard emissions for 1 July 2020 – 30 June 2030. Retrieved via live web fetch/search in this session.',
    false
  ) returning id into v_evidence_safeguard_act_id;

  insert into evidence (source_type, title, source_url, publisher, classification, notes, is_test_fixture)
  values (
    'official',
    'Safeguard Mechanism overview',
    'https://www.dcceew.gov.au/climate-change/emissions-reporting/national-greenhouse-energy-reporting-scheme/safeguard-mechanism/overview',
    'Department of Climate Change, Energy, the Environment and Water (DCCEEW)',
    'verified_fact',
    'Official departmental overview corroborating the 4.9%-per-year standard baseline decline rate to 2030 and the scheme''s administration by the Clean Energy Regulator. Live/undated page at retrieval; source_published_at left null.',
    false
  ) returning id into v_evidence_dcceew_overview_id;

  insert into evidence (source_type, title, source_url, publisher, source_published_at, classification, notes, is_test_fixture)
  values (
    'official',
    'Treasury Laws Amendment (Cost of Living Tax Cuts) Act 2024',
    'https://www.legislation.gov.au/C2024A00003/asmade',
    'Federal Register of Legislation',
    '2024-03-05',
    'verified_fact',
    'Act No. 3 of 2024, received Royal Assent 5 March 2024. Reduces the 19% marginal rate to 16% and the 32.5% rate to 30%, retains the 37% rate, and lifts the top threshold, effective from the 2024-25 income year (1 July 2024). Retrieved via live web fetch/search in this session.',
    false
  ) returning id into v_evidence_tax_act_id;

  insert into evidence (source_type, title, source_url, publisher, source_published_at, classification, notes, is_test_fixture)
  values (
    'official',
    'Help to Buy Act 2024',
    'https://www.legislation.gov.au/C2024A00124/asmade',
    'Federal Register of Legislation',
    null,
    'verified_fact',
    'Establishes the framework for Housing Australia to enter shared-equity Help to Buy arrangements on behalf of the Commonwealth. source_published_at left null (registration date not independently confirmed this session); retrieved_at records this session''s fetch.',
    false
  ) returning id into v_evidence_help_to_buy_act_id;

  insert into evidence (source_type, title, source_url, publisher, source_published_at, classification, notes, is_test_fixture)
  values (
    'official',
    'More Australians supported into home ownership with the launch of the Australian Government Help to Buy Scheme',
    'https://www.housingaustralia.gov.au/media/more-australians-supported-home-ownership-launch-australian-government-help-buy-scheme',
    'Housing Australia',
    '2025-11-28',
    'verified_fact',
    'Official media release: Help to Buy opened to applicants 5 December 2025; Commonwealth contributes up to 40% (new homes) / 30% (existing homes); up to 40,000 households over four years; minimum 2% deposit; income thresholds and lender panel stated. Retrieved via live web fetch in this session.',
    false
  ) returning id into v_evidence_housing_australia_release_id;

  -- ── Supplementary Housing evidence (links into the EXISTING issue_portfolio from migration 021) ──
  select id into v_issue_portfolio_id from issue_portfolios
    where issue_id = 'housing-affordability' and is_test_fixture = false
    order by created_at asc limit 1;
  if v_issue_portfolio_id is not null then
    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_help_to_buy_act_id, 'issue_portfolio', v_issue_portfolio_id),
      (v_evidence_housing_australia_release_id, 'issue_portfolio', v_issue_portfolio_id);
  end if;

  -- ═══════════════════════════════════════════════════════════════════════
  -- Portfolio: National Disability Insurance Scheme (commonwealth)
  -- ═══════════════════════════════════════════════════════════════════════
  select id into v_existing_id from portfolios
    where canonical_name = 'National Disability Insurance Scheme' and jurisdiction = 'commonwealth' and effective_to is null;
  if v_existing_id is null then
    insert into portfolios (canonical_name, jurisdiction, effective_from, is_test_fixture)
    values ('National Disability Insurance Scheme', 'commonwealth', '2025-05-13', false)
    returning id into v_portfolio_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_aao_id, 'portfolio', v_portfolio_id),
      (v_evidence_ndis_act_id, 'portfolio', v_portfolio_id),
      (v_evidence_ndis_news_id, 'portfolio', v_portfolio_id);

    insert into departments (canonical_name, jurisdiction, effective_from, is_test_fixture)
    values ('Department of Health, Disability and Ageing', 'commonwealth', '2025-05-13', false)
    returning id into v_department_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_instrument_id, 'department', v_department_id);

    insert into department_portfolios (department_id, portfolio_id, effective_from, is_test_fixture)
    values (v_department_id, v_portfolio_id, '2025-05-13', false)
    returning id into v_department_portfolio_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_aao_id, 'department_portfolio', v_department_portfolio_id);

    insert into issue_portfolios (issue_id, portfolio_id, responsibility_kind, effective_from, is_test_fixture)
    values ('ndis-reform', v_portfolio_id, 'responsibility', '2025-05-13', false)
    returning id into v_issue_portfolio_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_aao_id, 'issue_portfolio', v_issue_portfolio_id),
      (v_evidence_ndis_act_id, 'issue_portfolio', v_issue_portfolio_id),
      (v_evidence_ndis_news_id, 'issue_portfolio', v_issue_portfolio_id);
  else
    raise notice 'NDIS portfolio already exists — skipping.';
  end if;

  -- ═══════════════════════════════════════════════════════════════════════
  -- Portfolio: Climate Change and Energy (commonwealth)
  -- ═══════════════════════════════════════════════════════════════════════
  select id into v_existing_id from portfolios
    where canonical_name = 'Climate Change and Energy' and jurisdiction = 'commonwealth' and effective_to is null;
  if v_existing_id is null then
    insert into portfolios (canonical_name, jurisdiction, effective_from, is_test_fixture)
    values ('Climate Change and Energy', 'commonwealth', '2025-05-13', false)
    returning id into v_portfolio_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_instrument_id, 'portfolio', v_portfolio_id);

    insert into departments (canonical_name, jurisdiction, effective_from, is_test_fixture)
    values ('Department of Climate Change, Energy, the Environment and Water', 'commonwealth', '2025-05-13', false)
    returning id into v_department_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_instrument_id, 'department', v_department_id);

    insert into department_portfolios (department_id, portfolio_id, effective_from, is_test_fixture)
    values (v_department_id, v_portfolio_id, '2025-05-13', false)
    returning id into v_department_portfolio_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_instrument_id, 'department_portfolio', v_department_portfolio_id);

    -- effective_from = 2025-05-13, the earliest date this batch has evidence
    -- the *current* Climate Change and Energy portfolio administers this
    -- issue (the instrument of appointment) — NOT a claim that the
    -- Safeguard Mechanism reform (effective 2023-07-01) began on this date.
    -- Same "earliest evidenced date, not founding date" convention already
    -- established for Housing in migration 021.
    insert into issue_portfolios (issue_id, portfolio_id, responsibility_kind, effective_from, is_test_fixture)
    values ('climate-safeguard', v_portfolio_id, 'responsibility', '2025-05-13', false)
    returning id into v_issue_portfolio_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_safeguard_act_id, 'issue_portfolio', v_issue_portfolio_id),
      (v_evidence_dcceew_overview_id, 'issue_portfolio', v_issue_portfolio_id);
  else
    raise notice 'Climate Change and Energy portfolio already exists — skipping.';
  end if;

  -- ═══════════════════════════════════════════════════════════════════════
  -- Portfolio: Treasury (commonwealth) — distinct from the existing Housing
  -- portfolio; both are administered by the Department of the Treasury
  -- (the many-to-many department_portfolios join already supports this).
  -- ═══════════════════════════════════════════════════════════════════════
  select id into v_existing_id from portfolios
    where canonical_name = 'Treasury' and jurisdiction = 'commonwealth' and effective_to is null;
  if v_existing_id is null then
    insert into portfolios (canonical_name, jurisdiction, effective_from, is_test_fixture)
    values ('Treasury', 'commonwealth', '2025-05-13', false)
    returning id into v_portfolio_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_instrument_id, 'portfolio', v_portfolio_id);

    -- Reuse the existing Department of the Treasury row from migration 021
    -- rather than inserting a duplicate department.
    select id into v_department_id from departments
      where canonical_name = 'Department of the Treasury' and jurisdiction = 'commonwealth' and effective_to is null;
    if v_department_id is null then
      raise exception 'BLOCKER: Department of the Treasury not found — run migration 021 first.';
    end if;

    insert into department_portfolios (department_id, portfolio_id, effective_from, is_test_fixture)
    values (v_department_id, v_portfolio_id, '2025-05-13', false)
    returning id into v_department_portfolio_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_instrument_id, 'department_portfolio', v_department_portfolio_id);

    -- Same convention: 2025-05-13 is the earliest date this batch has
    -- evidence the current Treasury portfolio (Chalmers) administers this
    -- issue, not a claim about when the tax measure itself took effect
    -- (2024-07-01, stated in the issue content and Evidence notes above).
    insert into issue_portfolios (issue_id, portfolio_id, responsibility_kind, effective_from, is_test_fixture)
    values ('tax-cuts', v_portfolio_id, 'responsibility', '2025-05-13', false)
    returning id into v_issue_portfolio_id;

    insert into evidence_links (evidence_id, subject_type, subject_id) values
      (v_evidence_tax_act_id, 'issue_portfolio', v_issue_portfolio_id);
  else
    raise notice 'Treasury portfolio already exists — skipping.';
  end if;

  raise notice 'Real Issues V1 portfolio batch complete.';
end;
$$;
