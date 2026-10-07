-- Real Issues V1 — first curated civic dataset: real Issue content.
--
-- See REAL_ISSUES_V1_DATA_REPORT.md for the full audit, source list, and
-- reasoning behind every value below. This migration inserts REAL
-- (is_test_fixture = false) `issues` rows — not fixtures, and not the mock
-- `mock-data.ts` fallback — for the four demo issues this batch's audit
-- found could actually be made truthful against authoritative primary
-- sources: housing-affordability, ndis-reform, climate-safeguard, tax-cuts.
--
-- Deliberately excluded: `misinformation-bill`. The audit found the real
-- Communications Legislation Amendment (Combatting Misinformation and
-- Disinformation) Bill 2024 was withdrawn by the Government — it will not
-- proceed. `issues.status` is CHECK-constrained to exactly
-- ('active', 'passed', 'rejected'); none of those three values truthfully
-- describes a bill the government chose not to proceed with before any
-- vote (it is not "rejected" — it was never voted on — and calling it
-- "active" would misrepresent a withdrawn bill as still live). Per the
-- task's explicit "if it cannot be made truthful, leave it demo" instruction,
-- no row is inserted for this id; it remains mock-only. See the report §2/§6
-- for the full reasoning and the recommended schema fix (an owner decision,
-- not applied here).
--
-- Every date below is drawn from a primary source cited in the report —
-- Federal Register of Legislation, the relevant government department, or
-- the responsible minister's own portfolio site. Nothing is invented.
--
-- Idempotency: `on conflict (id) do nothing` — these ids have never existed
-- in this table before (confirmed: not in supabase/seed.sql, not previously
-- migrated), so this only ever inserts once.
--
-- Reversal: `delete from issues where id in
-- ('housing-affordability','ndis-reform','climate-safeguard','tax-cuts');`
-- — note migration 025/026's `issue_portfolios` rows reference
-- `housing-affordability` via a text FK, not a hard dependency on this
-- migration's insert order, so a reversal here would need those rows
-- cleaned up first (and would itself be rejected by their append-only
-- triggers once real relationship data exists — same caveat as migration
-- 021 already documents for Housing).

insert into issues (
  id, title, summary, content, what_is_happening, who_supports, who_opposes, status, source_url, is_test_fixture
) values

-- ── housing-affordability ────────────────────────────────────────────────
-- Source: Help to Buy Act 2024 (legislation.gov.au C2024A00124); Housing
-- Australia media release, 28 November 2025, on the scheme's 5 December
-- 2025 launch. See report for the full source list including the 2026
-- national-rollout and expanded-intake follow-up releases.
(
  'housing-affordability',
  'Housing Affordability',
  'The federal government is running a national shared-equity home ownership scheme intended to help eligible Australians buy a home with a smaller deposit, as part of its response to high housing costs.',
  'Housing affordability has been a long-running concern in Australia, with home prices and rents rising faster than incomes in most cities. The Commonwealth government''s primary current response is Help to Buy — a shared-equity scheme where Housing Australia contributes part of a home''s purchase price in exchange for an equivalent ownership stake, reducing the deposit and mortgage size needed by the buyer.',
  'Help to Buy opened to applicants on 5 December 2025 under the Help to Buy Act 2024. The Commonwealth contributes up to 40% of the purchase price for a new home, or 30% for an existing home, for eligible buyers with as little as a 2% deposit. The scheme is intended to support up to 40,000 households over four years, with 10,000 further places for the 2026–27 financial year and higher income eligibility thresholds from 1 July 2026. It reached full national coverage in June 2026 with Tasmania''s addition, and is administered by Housing Australia.',
  'The government introduced and passed the Help to Buy Act 2024 as part of its housing affordability agenda.',
  'Not yet independently sourced for this batch — a documented, citable account of parliamentary or stakeholder opposition to Help to Buy specifically was not verified in this session.',
  'active',
  'https://www.housingaustralia.gov.au/media/more-australians-supported-home-ownership-launch-australian-government-help-buy-scheme',
  false
),

-- ── ndis-reform ───────────────────────────────────────────────────────────
-- Source: National Disability Insurance Scheme Amendment (Getting the NDIS
-- Back on Track No. 1) Act 2024 (legislation.gov.au C2024A00081); NDIS.gov.au
-- "Critical NDIS legislation becomes law".
(
  'ndis-reform',
  'NDIS Reform',
  'Parliament has already passed one major tranche of NDIS reform. A second, larger change — moving some support outside the NDIS into new "foundational supports" — is still being negotiated with the states and territories and is not yet fully operating.',
  'The National Disability Insurance Scheme (NDIS) provides funding to Australians with permanent and significant disability. Following an independent NDIS Review, the government has been legislating changes intended to make the scheme more consistent and financially sustainable, while also planning a new layer of disability supports delivered outside the NDIS itself.',
  'The National Disability Insurance Scheme Amendment (Getting the NDIS Back on Track No. 1) Act 2024 passed Parliament on 22 August 2024 and commenced on 3 October 2024, changing how NDIS plans and supports are defined and assessed. Separately, the Commonwealth and the states/territories have agreed to build "foundational supports" — disability services delivered outside the NDIS, jointly funded on a 50/50 basis, with an agreed funding growth rate of 8% from 1 July 2026. As of this batch, foundational supports remained under development, with no confirmed national operating date found in the sources checked.',
  'The government introduced and passed the 2024 Act as part of its response to the NDIS Review.',
  'Disability advocacy groups have raised concerns about the pace and detail of the foundational supports transition; a fuller, independently sourced account of specific opposing positions was not verified in this session.',
  'active',
  'https://www.legislation.gov.au/C2024A00081/asmade',
  false
),

-- ── climate-safeguard ─────────────────────────────────────────────────────
-- Source: Safeguard Mechanism (Crediting) Amendment Act 2023
-- (legislation.gov.au C2023A00014); DCCEEW Safeguard Mechanism overview.
(
  'climate-safeguard',
  'Safeguard Mechanism (Climate)',
  'Australia''s largest industrial polluters are required to reduce their net emissions by a set percentage each year under reformed Safeguard Mechanism rules that have applied since mid-2023.',
  'The Safeguard Mechanism limits net greenhouse gas emissions from Australia''s largest industrial facilities. Reforms passed in 2023 tightened these limits, requiring covered facilities to reduce their baseline emissions annually, while allowing facilities that emit below their baseline to generate and trade Safeguard Mechanism Credits.',
  'The Safeguard Mechanism (Crediting) Amendment Act 2023 passed both Houses of Parliament on 30 March 2023, with the associated Safeguard Rule changes taking effect from 1 July 2023. Since then, most covered facilities'' emissions baselines have been required to decline by 4.9% per year through to 2030 (a lower rate applies to some hard-to-abate, value-added manufacturing facilities), with total net safeguard emissions across all covered facilities capped at 1,233 million tonnes of CO2-equivalent for 1 July 2020 to 30 June 2030. The Clean Energy Regulator administers the scheme, including discounted decline rates for trade-exposed facilities.',
  'The government introduced and passed the reforms; the Greens supported the bill in the Senate after negotiating amendments.',
  'Some resources-industry groups raised cost concerns during the bill''s passage; a fuller, independently sourced account of opposing positions was not verified in this session.',
  'passed',
  'https://www.dcceew.gov.au/climate-change/emissions-reporting/national-greenhouse-energy-reporting-scheme/safeguard-mechanism/overview',
  false
),

-- ── tax-cuts ──────────────────────────────────────────────────────────────
-- Source: Treasury Laws Amendment (Cost of Living Tax Cuts) Act 2024
-- (legislation.gov.au C2024A00003, Act No. 3 of 2024).
(
  'tax-cuts',
  'Stage 3 Tax Cuts (Revised)',
  'Legislated income tax cuts, redesigned by the government from the original 2019 "Stage 3" plan, took effect from 1 July 2024, changing marginal tax rates for most taxpayers.',
  'In January 2024, the government announced changes to the previously legislated "Stage 3" income tax cuts, redistributing some of the tax relief from higher-income earners to low- and middle-income earners. The changes were legislated the following March.',
  'The Treasury Laws Amendment (Cost of Living Tax Cuts) Act 2024 (Act No. 3 of 2024) received Royal Assent on 5 March 2024, reducing the 19% marginal tax rate to 16% and the 32.5% rate to 30%, while retaining the 37% rate (rather than abolishing it as originally legislated) and lifting the top tax threshold. The changes applied from the 2024–25 income year, effective 1 July 2024. This is now settled, enacted law — no further change to this specific measure was found in the sources checked.',
  'The government introduced and passed the amended tax cuts.',
  'The Coalition criticised the government for departing from the originally legislated Stage 3 design; a fuller, independently sourced account of the parliamentary debate was not verified in this session.',
  'passed',
  'https://www.legislation.gov.au/C2024A00003/asmade',
  false
)
on conflict (id) do nothing;
