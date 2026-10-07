import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  VERIFIED_CLASSIFICATIONS,
  attachVerification,
  groupIssuePortfoliosByIssue,
  groupIssuePortfoliosByPortfolio,
  isVerified,
  resolveVerificationState,
  type EvidenceRecord,
  type IssuePortfolioRecord,
} from '@/lib/responsibility-data'

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../supabase/migrations')

function readMigration(filename: string): string {
  return readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8')
}

function evidence(overrides: Partial<EvidenceRecord> = {}): EvidenceRecord {
  return {
    id: overrides.id ?? `ev-${Math.random().toString(36).slice(2)}`,
    sourceType: 'official',
    title: 'Test evidence',
    sourceUrl: 'https://example.gov.au/source',
    publisher: 'Test Publisher',
    sourcePublishedAt: '2024-01-01',
    retrievedAt: '2024-01-02T00:00:00.000Z',
    classification: 'verified_fact',
    verificationStatus: 'unreviewed',
    notes: null,
    disputeNote: null,
    supersededById: null,
    isTestFixture: true,
    ...overrides,
  }
}

function issuePortfolio(overrides: Partial<IssuePortfolioRecord> = {}): IssuePortfolioRecord {
  return {
    id: overrides.id ?? `ip-${Math.random().toString(36).slice(2)}`,
    issueId: 'housing-affordability',
    portfolioId: 'portfolio-1',
    responsibilityKind: 'responsibility',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    isTestFixture: true,
    ...overrides,
  }
}

describe('resolveVerificationState / isVerified', () => {
  it('a relationship with zero linked evidence is unknown_no_verified_data, never verified', () => {
    expect(resolveVerificationState([])).toBe('unknown_no_verified_data')
    expect(isVerified([])).toBe(false)
  })

  it('a relationship whose only evidence is superseded is treated as having no active evidence', () => {
    const superseded = evidence({ classification: 'verified_fact', supersededById: 'ev-newer' })
    expect(resolveVerificationState([superseded])).toBe('unknown_no_verified_data')
    expect(isVerified([superseded])).toBe(false)
  })

  it('verified_fact evidence resolves to verified', () => {
    const e = evidence({ classification: 'verified_fact' })
    expect(resolveVerificationState([e])).toBe('verified_fact')
    expect(isVerified([e])).toBe(true)
  })

  it('sourced_analysis evidence also counts as verified', () => {
    const e = evidence({ classification: 'sourced_analysis' })
    expect(resolveVerificationState([e])).toBe('sourced_analysis')
    expect(isVerified([e])).toBe(true)
  })

  it('forecast/community_opinion/ai_generated_interpretation/demo_content never count as verified', () => {
    for (const classification of [
      'forecast',
      'community_opinion',
      'ai_generated_interpretation',
      'demo_content',
    ] as const) {
      const e = evidence({ classification })
      expect(isVerified([e])).toBe(false)
    }
  })

  it('a disputed_claim trumps a verified_fact linked to the same relationship — never exposed as verified', () => {
    const verified = evidence({ classification: 'verified_fact' })
    const disputed = evidence({ classification: 'disputed_claim', disputeNote: 'Conflicting AAO listing found' })
    expect(resolveVerificationState([verified, disputed])).toBe('disputed_claim')
    expect(isVerified([verified, disputed])).toBe(false)
  })

  it('demo_content trumps a genuine classification alongside it — never exposed as verified', () => {
    const verified = evidence({ classification: 'verified_fact' })
    const demo = evidence({ classification: 'demo_content' })
    expect(resolveVerificationState([verified, demo])).toBe('demo_content')
    expect(isVerified([verified, demo])).toBe(false)
  })

  it('VERIFIED_CLASSIFICATIONS contains exactly the two strong classifications, no numeric threshold of any kind', () => {
    expect(Array.from(VERIFIED_CLASSIFICATIONS).sort()).toEqual(['sourced_analysis', 'verified_fact'])
  })
})

describe('attachVerification', () => {
  it('exposes both the raw evidence and the derived verification state, never just a boolean', () => {
    const record = issuePortfolio()
    const e = evidence({ classification: 'verified_fact' })
    const withVerification = attachVerification(record, [e])
    expect(withVerification.record).toBe(record)
    expect(withVerification.evidence).toEqual([e])
    expect(withVerification.verification).toBe('verified_fact')
    expect(withVerification.isVerified).toBe(true)
  })

  it('an unverified relationship is never silently upgraded — isVerified stays false with zero evidence', () => {
    const withVerification = attachVerification(issuePortfolio(), [])
    expect(withVerification.isVerified).toBe(false)
    expect(withVerification.verification).toBe('unknown_no_verified_data')
  })
})

describe('cardinality: one issue can map to multiple portfolios, one portfolio to multiple issues', () => {
  it('groupIssuePortfoliosByIssue preserves multiple portfolios for the same issue', () => {
    const rows = [
      issuePortfolio({ id: 'ip-1', issueId: 'housing-affordability', portfolioId: 'portfolio-housing' }),
      issuePortfolio({ id: 'ip-2', issueId: 'housing-affordability', portfolioId: 'portfolio-treasury' }),
      issuePortfolio({ id: 'ip-3', issueId: 'housing-affordability', portfolioId: 'portfolio-planning' }),
    ]
    const grouped = groupIssuePortfoliosByIssue(rows)
    expect(grouped.get('housing-affordability')).toHaveLength(3)
    expect(new Set(grouped.get('housing-affordability')!.map(r => r.portfolioId))).toEqual(
      new Set(['portfolio-housing', 'portfolio-treasury', 'portfolio-planning']),
    )
  })

  it('groupIssuePortfoliosByPortfolio preserves multiple issues for the same portfolio', () => {
    const rows = [
      issuePortfolio({ id: 'ip-1', issueId: 'housing-affordability', portfolioId: 'portfolio-treasury' }),
      issuePortfolio({ id: 'ip-2', issueId: 'interest-rates', portfolioId: 'portfolio-treasury' }),
      issuePortfolio({ id: 'ip-3', issueId: 'tax-reform', portfolioId: 'portfolio-treasury' }),
    ]
    const grouped = groupIssuePortfoliosByPortfolio(rows)
    expect(grouped.get('portfolio-treasury')).toHaveLength(3)
    expect(new Set(grouped.get('portfolio-treasury')!.map(r => r.issueId))).toEqual(
      new Set(['housing-affordability', 'interest-rates', 'tax-reform']),
    )
  })

  it('a single issue can carry several distinct responsibility kinds against different portfolios', () => {
    const rows = [
      issuePortfolio({ id: 'ip-1', portfolioId: 'portfolio-treasury', responsibilityKind: 'influence' }),
      issuePortfolio({ id: 'ip-2', portfolioId: 'portfolio-housing', responsibilityKind: 'responsibility' }),
      issuePortfolio({ id: 'ip-3', portfolioId: 'portfolio-planning-nsw', responsibilityKind: 'implementation' }),
    ]
    const grouped = groupIssuePortfoliosByIssue(rows)
    const kinds = grouped.get('housing-affordability')!.map(r => r.responsibilityKind)
    expect(new Set(kinds)).toEqual(new Set(['influence', 'responsibility', 'implementation']))
  })
})

describe('repo hygiene: migration source scans', () => {
  const evidenceMigration = readMigration('018_responsibility_evidence.sql')
  const portfolioMigration = readMigration('019_responsibility_portfolio_department.sql')
  const personIssueMigration = readMigration('020_responsibility_person_issue.sql')
  const allMigrationText = `${evidenceMigration}\n${portfolioMigration}\n${personIssueMigration}`

  it('no numeric confidence/trust/weight score column was introduced anywhere in this batch', () => {
    expect(allMigrationText).not.toMatch(/confidence_score/i)
    expect(allMigrationText).not.toMatch(/trust_score/i)
    expect(allMigrationText).not.toMatch(/influence_score/i)
    expect(allMigrationText).not.toMatch(/\bweight\b/i)
    expect(allMigrationText).not.toMatch(/numeric\(\s*\d+\s*,\s*\d+\s*\)\s*.*confidence/i)
  })

  it('issues table gains no bare portfolio_id (or minister_id/department_id) shortcut column', () => {
    expect(personIssueMigration).not.toMatch(/alter\s+table\s+issues\s+add\s+column/i)
    // The only legitimate occurrences of "portfolio_id" are as columns on the
    // new join tables themselves (department_portfolios, person_portfolio_roles,
    // issue_portfolios) — never as a column added directly to `issues`.
    const alterIssuesStatements = allMigrationText.match(/alter\s+table\s+issues\b[^;]*;/gi) ?? []
    expect(alterIssuesStatements).toEqual([])
  })

  it('every time-ranged table has an append-only trigger and a delete-blocking trigger', () => {
    for (const table of [
      'portfolios',
      'departments',
      'department_portfolios',
      'person_portfolio_roles',
      'issue_portfolios',
    ]) {
      expect(allMigrationText).toMatch(new RegExp(`before update on ${table}[\\s\\S]{0,80}enforce_history_append_only`, 'i'))
      expect(allMigrationText).toMatch(new RegExp(`before delete on ${table}[\\s\\S]{0,80}prevent_row_delete`, 'i'))
    }
  })

  it('evidence requires a dispute_note when classified as disputed_claim (DB-level constraint, not just convention)', () => {
    expect(evidenceMigration).toMatch(/evidence_dispute_note_required/i)
  })

  it('writes are admin-gated on every new table — every insert/update policy requires is_app_admin()', () => {
    const insertUpdatePolicies = allMigrationText.match(/create policy[^;]*for (insert|update)[^;]*;/gi) ?? []
    expect(insertUpdatePolicies.length).toBeGreaterThan(0)
    for (const policy of insertUpdatePolicies) {
      expect(policy).toMatch(/is_app_admin\(\)/)
    }
  })

  it('reads are gated on is_test_fixture = false (or admin) on every new table', () => {
    const selectPolicies = allMigrationText.match(/create policy[^;]*for select[^;]*;/gi) ?? []
    expect(selectPolicies.length).toBeGreaterThan(0)
    for (const policy of selectPolicies) {
      expect(policy).toMatch(/is_test_fixture\s*=\s*false|is_app_admin\(\)/)
    }
  })
})

describe('repo hygiene: no fuzzy/string person reconciliation in this batch', () => {
  it('person_portfolio_roles.member_id is a real foreign key to members(id), not a text/slug column', () => {
    const migration = readMigration('020_responsibility_person_issue.sql')
    expect(migration).toMatch(/member_id\s+uuid\s+not\s+null\s+references\s+members\s*\(\s*id\s*\)/i)
  })

  it('no mp-*/house-live-*/tvfy-* style string id is referenced in executable SQL (comments may discuss them by name)', () => {
    // Strip `-- ...` line comments first — the migrations' own explanatory
    // comments legitimately *name* these deprecated id schemes as prose
    // (documenting what was deliberately NOT used), which would otherwise
    // false-positive against this assertion. Only executable SQL is checked.
    const stripSqlComments = (sql: string) => sql.replace(/--.*$/gm, '')
    const combined = [
      readMigration('018_responsibility_evidence.sql'),
      readMigration('019_responsibility_portfolio_department.sql'),
      readMigration('020_responsibility_person_issue.sql'),
    ].map(stripSqlComments).join('\n')

    expect(combined).not.toMatch(/house-live-/i)
    expect(combined).not.toMatch(/tvfy-/i) // the real column is tvfy_id (underscore) on `members`/`divisions`, never the app-layer `tvfy-<id>` string scheme
    expect(combined).not.toMatch(/mp-[a-z]/i)
  })

  it('no .toLowerCase() / ilike name-matching helper exists in the new responsibility TS modules', () => {
    const dataModule = readFileSync(path.resolve(__dirname, '../responsibility-data.ts'), 'utf8')
    const dbModule = readFileSync(path.resolve(__dirname, '../responsibility-db.ts'), 'utf8')
    for (const source of [dataModule, dbModule]) {
      expect(source).not.toMatch(/toLowerCase\(\)/)
      expect(source).not.toMatch(/\.ilike\(/)
      expect(source).not.toMatch(/display_name/i)
    }
  })
})

describe('repo hygiene: migrations directory is internally consistent', () => {
  it('018/019/020 all exist, in sequence with no gaps up to the latest migration', () => {
    // Not pinned to a fixed "newest" number — later batches (021+, see
    // RESPONSIBILITY_ENGINE_V1_FIRST_REAL_SLICE_REPORT.md) legitimately add
    // more migrations after this V1 Foundation batch. What must hold is
    // that 018/019/020 exist and the sequence has no gaps/duplicates.
    const files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()
    expect(files).toContain('018_responsibility_evidence.sql')
    expect(files).toContain('019_responsibility_portfolio_department.sql')
    expect(files).toContain('020_responsibility_person_issue.sql')
    const numbers = files.map(f => parseInt(f.slice(0, 3), 10)).sort((a, b) => a - b)
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i]).toBe(numbers[i - 1] + 1)
    }
  })
})
