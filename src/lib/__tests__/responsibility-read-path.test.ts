import { describe, expect, it, vi, beforeEach } from 'vitest'

/**
 * End-to-end coverage for the generic Responsibility Engine read path
 * (src/lib/responsibility-db.ts) against a lightweight fake Supabase
 * client — no live database available in this environment (see
 * RESPONSIBILITY_ENGINE_V1_FIRST_REAL_SLICE_REPORT.md §12). This fake
 * genuinely applies the `.eq()`/`.in()`/`.is()` filters callers attach
 * (rather than returning canned data regardless of filters), so it
 * exercises the real query-construction logic in responsibility-db.ts, not
 * just a reimplementation of it.
 */

type Row = Record<string, unknown>

function createFakeSupabase(tables: Record<string, Row[]>) {
  return {
    from(table: string) {
      const rows = tables[table] ?? []
      let filtered = rows

      const builder = {
        select(_cols: string) {
          return builder
        },
        eq(col: string, val: unknown) {
          filtered = filtered.filter(r => r[col] === val)
          return builder
        },
        in(col: string, vals: unknown[]) {
          filtered = filtered.filter(r => vals.includes(r[col]))
          return builder
        },
        is(col: string, val: null) {
          filtered = filtered.filter(r => (r[col] ?? null) === val)
          return builder
        },
        // Supabase's query builder is itself a thenable — `await query`
        // works without a terminal `.select()`/`.then()` call in caller
        // code, so this fake must implement `.then()` directly.
        then(resolve: (value: { data: Row[] }) => void) {
          resolve({ data: filtered })
        },
      }
      return builder
    },
  }
}

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

const evidence = (overrides: Partial<Row> = {}): Row => ({
  id: overrides.id ?? `ev-${Math.random().toString(36).slice(2)}`,
  source_type: 'official',
  title: 'Test evidence',
  source_url: 'https://example.gov.au/source',
  publisher: 'Test Publisher',
  source_published_at: '2025-05-13',
  retrieved_at: '2025-05-13T00:00:00.000Z',
  classification: 'verified_fact',
  verification_status: 'unreviewed',
  notes: null,
  dispute_note: null,
  superseded_by_id: null,
  is_test_fixture: false,
  ...overrides,
})

describe('getIssueResponsibilityGraph — generic read path', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('resolves the full chain: Issue → IssuePortfolio → Portfolio → PersonPortfolioRole → Person → DepartmentPortfolio → Department → Evidence', async () => {
    const tables: Record<string, Row[]> = {
      issue_portfolios: [
        {
          id: 'ip-1', issue_id: 'housing-affordability', portfolio_id: 'portfolio-1',
          responsibility_kind: 'responsibility', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false,
        },
      ],
      portfolios: [
        { id: 'portfolio-1', canonical_name: 'Housing', jurisdiction: 'commonwealth', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      person_portfolio_roles: [
        {
          id: 'role-1', member_id: 'member-1', portfolio_id: 'portfolio-1', role_type: 'minister',
          responsibility_kind: 'responsibility', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false,
        },
      ],
      department_portfolios: [
        { id: 'dp-1', department_id: 'dept-1', portfolio_id: 'portfolio-1', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      departments: [
        { id: 'dept-1', canonical_name: 'Department of the Treasury', jurisdiction: 'commonwealth', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      members: [
        { id: 'member-1', name: 'Test Minister' },
      ],
      evidence_links: [
        { id: 'link-1', evidence_id: 'ev-issue-portfolio', subject_type: 'issue_portfolio', subject_id: 'ip-1' },
        { id: 'link-2', evidence_id: 'ev-portfolio', subject_type: 'portfolio', subject_id: 'portfolio-1' },
        { id: 'link-3', evidence_id: 'ev-role', subject_type: 'person_portfolio_role', subject_id: 'role-1' },
        { id: 'link-4', evidence_id: 'ev-dept-portfolio', subject_type: 'department_portfolio', subject_id: 'dp-1' },
      ],
      evidence: [
        evidence({ id: 'ev-issue-portfolio', title: 'AAO' }),
        evidence({ id: 'ev-portfolio', title: 'Instrument of appointment' }),
        evidence({ id: 'ev-role', title: 'Instrument of appointment (role)' }),
        evidence({ id: 'ev-dept-portfolio', title: 'AAO (dept)' }),
      ],
    }

    const { createServerSupabaseClient } = await import('@/lib/supabase-server')
    vi.mocked(createServerSupabaseClient).mockResolvedValue(createFakeSupabase(tables) as never)

    const { getIssueResponsibilityGraph, selectVerifiedEntries } = await import('@/lib/responsibility-db')
    const graph = await getIssueResponsibilityGraph('housing-affordability')

    expect(graph.entries).toHaveLength(1)
    const entry = graph.entries[0]
    expect(entry.portfolio?.record.canonicalName).toBe('Housing')
    expect(entry.ministers).toHaveLength(1)
    expect(entry.ministers[0].memberName).toBe('Test Minister')
    expect(entry.ministers[0].record.roleType).toBe('minister')
    expect(entry.departments).toHaveLength(1)
    expect(entry.departments[0].record.canonicalName).toBe('Department of the Treasury')

    const verified = selectVerifiedEntries(graph)
    expect(verified).toHaveLength(1)
    expect(entry.ministers[0].isVerified).toBe(true)
    expect(entry.departments[0].isVerified).toBe(true)
  })

  it('supports multiple portfolios for a single issue', async () => {
    const tables: Record<string, Row[]> = {
      issue_portfolios: [
        { id: 'ip-1', issue_id: 'housing-affordability', portfolio_id: 'portfolio-housing', responsibility_kind: 'responsibility', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
        { id: 'ip-2', issue_id: 'housing-affordability', portfolio_id: 'portfolio-treasury', responsibility_kind: 'influence', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      portfolios: [
        { id: 'portfolio-housing', canonical_name: 'Housing', jurisdiction: 'commonwealth', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
        { id: 'portfolio-treasury', canonical_name: 'Treasury', jurisdiction: 'commonwealth', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      person_portfolio_roles: [],
      department_portfolios: [],
      departments: [],
      members: [],
      evidence_links: [
        { id: 'link-1', evidence_id: 'ev-1', subject_type: 'issue_portfolio', subject_id: 'ip-1' },
        { id: 'link-2', evidence_id: 'ev-2', subject_type: 'portfolio', subject_id: 'portfolio-housing' },
        { id: 'link-3', evidence_id: 'ev-3', subject_type: 'issue_portfolio', subject_id: 'ip-2' },
        { id: 'link-4', evidence_id: 'ev-4', subject_type: 'portfolio', subject_id: 'portfolio-treasury' },
      ],
      evidence: [evidence({ id: 'ev-1' }), evidence({ id: 'ev-2' }), evidence({ id: 'ev-3' }), evidence({ id: 'ev-4' })],
    }

    const { createServerSupabaseClient } = await import('@/lib/supabase-server')
    vi.mocked(createServerSupabaseClient).mockResolvedValue(createFakeSupabase(tables) as never)

    const { getIssueResponsibilityGraph, selectVerifiedEntries } = await import('@/lib/responsibility-db')
    const graph = await getIssueResponsibilityGraph('housing-affordability')

    expect(graph.entries).toHaveLength(2)
    expect(selectVerifiedEntries(graph)).toHaveLength(2)
    expect(new Set(graph.entries.map(e => e.portfolio?.record.canonicalName))).toEqual(
      new Set(['Housing', 'Treasury']),
    )
  })

  it('an unrelated issue with no issue_portfolios rows resolves to an empty graph (the truthful unavailable state)', async () => {
    const tables: Record<string, Row[]> = {
      issue_portfolios: [
        { id: 'ip-1', issue_id: 'housing-affordability', portfolio_id: 'portfolio-1', responsibility_kind: 'responsibility', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      portfolios: [],
      person_portfolio_roles: [],
      department_portfolios: [],
      departments: [],
      members: [],
      evidence_links: [],
      evidence: [],
    }

    const { createServerSupabaseClient } = await import('@/lib/supabase-server')
    vi.mocked(createServerSupabaseClient).mockResolvedValue(createFakeSupabase(tables) as never)

    const { getIssueResponsibilityGraph, selectVerifiedEntries } = await import('@/lib/responsibility-db')
    // Query a DIFFERENT, unrelated issue id — proves other issues aren't
    // silently attached to housing-affordability's data.
    const graph = await getIssueResponsibilityGraph('climate-safeguard')

    expect(graph.entries).toHaveLength(0)
    expect(selectVerifiedEntries(graph)).toHaveLength(0)
  })

  it('an expired (effective_to set) ministerial role is excluded, never rendered as current', async () => {
    const tables: Record<string, Row[]> = {
      issue_portfolios: [
        { id: 'ip-1', issue_id: 'housing-affordability', portfolio_id: 'portfolio-1', responsibility_kind: 'responsibility', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      portfolios: [
        { id: 'portfolio-1', canonical_name: 'Housing', jurisdiction: 'commonwealth', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      person_portfolio_roles: [
        // A PRIOR minister whose role has been closed out — must never appear.
        { id: 'role-old', member_id: 'member-old', portfolio_id: 'portfolio-1', role_type: 'minister', responsibility_kind: 'responsibility', effective_from: '2023-01-01', effective_to: '2024-07-29', is_test_fixture: false },
      ],
      department_portfolios: [],
      departments: [],
      members: [{ id: 'member-old', name: 'Former Minister' }],
      evidence_links: [
        { id: 'link-1', evidence_id: 'ev-1', subject_type: 'issue_portfolio', subject_id: 'ip-1' },
        { id: 'link-2', evidence_id: 'ev-2', subject_type: 'portfolio', subject_id: 'portfolio-1' },
      ],
      evidence: [evidence({ id: 'ev-1' }), evidence({ id: 'ev-2' })],
    }

    const { createServerSupabaseClient } = await import('@/lib/supabase-server')
    vi.mocked(createServerSupabaseClient).mockResolvedValue(createFakeSupabase(tables) as never)

    const { getIssueResponsibilityGraph } = await import('@/lib/responsibility-db')
    const graph = await getIssueResponsibilityGraph('housing-affordability')

    expect(graph.entries).toHaveLength(1)
    expect(graph.entries[0].ministers).toHaveLength(0) // the closed-out role's query filter (`.is('effective_to', null)`) excluded it
  })

  it('a portfolio with zero linked evidence is never treated as verified, even though the row exists', async () => {
    const tables: Record<string, Row[]> = {
      issue_portfolios: [
        { id: 'ip-1', issue_id: 'housing-affordability', portfolio_id: 'portfolio-1', responsibility_kind: 'responsibility', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      portfolios: [
        { id: 'portfolio-1', canonical_name: 'Housing', jurisdiction: 'commonwealth', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      person_portfolio_roles: [],
      department_portfolios: [],
      departments: [],
      members: [],
      evidence_links: [
        // issue_portfolio IS evidenced, but the Portfolio entity itself is NOT.
        { id: 'link-1', evidence_id: 'ev-1', subject_type: 'issue_portfolio', subject_id: 'ip-1' },
      ],
      evidence: [evidence({ id: 'ev-1' })],
    }

    const { createServerSupabaseClient } = await import('@/lib/supabase-server')
    vi.mocked(createServerSupabaseClient).mockResolvedValue(createFakeSupabase(tables) as never)

    const { getIssueResponsibilityGraph, selectVerifiedEntries } = await import('@/lib/responsibility-db')
    const graph = await getIssueResponsibilityGraph('housing-affordability')

    expect(graph.entries[0].issuePortfolio.isVerified).toBe(true)
    expect(graph.entries[0].portfolio?.isVerified).toBe(false) // no evidence linked to the portfolio itself
    // The shared selector requires BOTH to be verified — one being
    // evidenced is not enough to display the entry as verified.
    expect(selectVerifiedEntries(graph)).toHaveLength(0)
  })

  it('a department is only verified via its OWN department_portfolio relationship evidence, not merely because the department entity has some unrelated evidence', async () => {
    const tables: Record<string, Row[]> = {
      issue_portfolios: [
        { id: 'ip-1', issue_id: 'housing-affordability', portfolio_id: 'portfolio-1', responsibility_kind: 'responsibility', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      portfolios: [
        { id: 'portfolio-1', canonical_name: 'Housing', jurisdiction: 'commonwealth', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      person_portfolio_roles: [],
      department_portfolios: [
        { id: 'dp-1', department_id: 'dept-1', portfolio_id: 'portfolio-1', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      departments: [
        { id: 'dept-1', canonical_name: 'Department of the Treasury', jurisdiction: 'commonwealth', effective_from: '2025-05-13', effective_to: null, is_test_fixture: false },
      ],
      members: [],
      evidence_links: [
        { id: 'link-1', evidence_id: 'ev-1', subject_type: 'issue_portfolio', subject_id: 'ip-1' },
        { id: 'link-2', evidence_id: 'ev-2', subject_type: 'portfolio', subject_id: 'portfolio-1' },
        // Evidence exists for the DEPARTMENT ENTITY, but not for the
        // department_portfolio RELATIONSHIP that would prove Treasury
        // administers THIS portfolio.
        { id: 'link-3', evidence_id: 'ev-3', subject_type: 'department', subject_id: 'dept-1' },
      ],
      evidence: [evidence({ id: 'ev-1' }), evidence({ id: 'ev-2' }), evidence({ id: 'ev-3' })],
    }

    const { createServerSupabaseClient } = await import('@/lib/supabase-server')
    vi.mocked(createServerSupabaseClient).mockResolvedValue(createFakeSupabase(tables) as never)

    const { getIssueResponsibilityGraph } = await import('@/lib/responsibility-db')
    const graph = await getIssueResponsibilityGraph('housing-affordability')

    expect(graph.entries[0].departments).toHaveLength(1)
    expect(graph.entries[0].departments[0].isVerified).toBe(false)
    expect(graph.entries[0].departments[0].entityEvidence).toHaveLength(1) // still surfaced for display
    expect(graph.entries[0].departments[0].evidence).toHaveLength(0) // but not counted as relationship evidence
  })

  it('test-fixture rows are excluded by default, matching issues-db.ts convention', async () => {
    const tables: Record<string, Row[]> = {
      issue_portfolios: [
        { id: 'ip-1', issue_id: 'housing-affordability', portfolio_id: 'portfolio-1', responsibility_kind: 'responsibility', effective_from: '2025-05-13', effective_to: null, is_test_fixture: true },
      ],
      portfolios: [],
      person_portfolio_roles: [],
      department_portfolios: [],
      departments: [],
      members: [],
      evidence_links: [],
      evidence: [],
    }

    const { createServerSupabaseClient } = await import('@/lib/supabase-server')
    vi.mocked(createServerSupabaseClient).mockResolvedValue(createFakeSupabase(tables) as never)

    const { getIssueResponsibilityGraph } = await import('@/lib/responsibility-db')
    const graph = await getIssueResponsibilityGraph('housing-affordability')

    expect(graph.entries).toHaveLength(0)
  })
})
