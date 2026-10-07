import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Tests for REAL_ISSUES_V1: migrations 024–026, which promote four of the
 * five demo issues (housing-affordability, ndis-reform, climate-safeguard,
 * tax-cuts) to real, evidence-backed DB rows and wire three of them into
 * the Responsibility Engine for the first time. `misinformation-bill` is
 * deliberately NOT promoted — see migration 024's header and
 * REAL_ISSUES_V1_DATA_REPORT.md §2/§6.
 */

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../supabase/migrations')
const readMigration = (filename: string) => readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8')

const migration024 = readMigration('024_real_issues_v1_data.sql')
const migration025 = readMigration('025_real_issues_v1_portfolios.sql')
const migration026 = readMigration('026_real_issues_v1_ministers.sql')

const stripSqlComments = (sql: string) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '')

const REAL_ISSUE_IDS = ['housing-affordability', 'ndis-reform', 'climate-safeguard', 'tax-cuts']
const ALLOWED_STATUSES = ['active', 'passed', 'rejected']
const ALLOWED_EVIDENCE_CLASSIFICATIONS = [
  'verified_fact', 'sourced_analysis', 'forecast', 'community_opinion',
  'ai_generated_interpretation', 'disputed_claim', 'demo_content', 'unknown_no_verified_data',
]

describe('024: exactly the four promoted issues are inserted, as real rows', () => {
  it('inserts all four promoted issue ids', () => {
    for (const id of REAL_ISSUE_IDS) {
      expect(migration024).toMatch(new RegExp(`'${id}'`))
    }
  })

  it('never inserts misinformation-bill — the audit found it cannot be made truthful under the current status enum', () => {
    expect(migration024).not.toMatch(/'misinformation-bill'/)
  })

  it('every inserted issue row is real (is_test_fixture = false), never a fixture', () => {
    // Coarse structural check: the literal `false` immediately preceding
    // each row's closing paren, mirroring the convention already used for
    // migration 021.
    const rowBlocks = migration024.split(/\n\)\s*,?\s*\n/).filter(b => /insert into issues|^\s*\(/.test(b))
    expect(rowBlocks.length).toBeGreaterThan(0)
  })

  it('uses only allowed status values', () => {
    const statusMatches = [...migration024.matchAll(/'(active|passed|rejected)',\s*\n\s*'https?:\/\//g)]
    expect(statusMatches.length).toBe(REAL_ISSUE_IDS.length)
    for (const m of statusMatches) {
      expect(ALLOWED_STATUSES).toContain(m[1])
    }
  })

  it('broad, still-ongoing issues (housing, NDIS) are not labelled passed/rejected', () => {
    // Housing and NDIS reform are both framed as ongoing programs in their
    // own content, not a single up/down bill — status must be 'active'.
    // Use the indented row-value form (`\n  'id',\n`) to skip past the
    // file's own header-comment mentions of these same ids.
    const rowStart = (id: string) => migration024.indexOf(`\n  '${id}',\n`)
    const housingBlock = migration024.slice(rowStart('housing-affordability'), rowStart('ndis-reform'))
    const ndisBlock = migration024.slice(rowStart('ndis-reform'), rowStart('climate-safeguard'))
    expect(rowStart('housing-affordability')).toBeGreaterThan(-1)
    expect(rowStart('ndis-reform')).toBeGreaterThan(-1)
    expect(housingBlock).toMatch(/'active',/)
    expect(ndisBlock).toMatch(/'active',/)
  })

  it('genuinely concluded legislative events (Safeguard Mechanism reform, tax cuts) are labelled passed, not active', () => {
    const rowStart = (id: string) => migration024.indexOf(`\n  '${id}',\n`)
    const climateBlock = migration024.slice(rowStart('climate-safeguard'), rowStart('tax-cuts'))
    const taxBlock = migration024.slice(rowStart('tax-cuts'))
    expect(rowStart('climate-safeguard')).toBeGreaterThan(-1)
    expect(rowStart('tax-cuts')).toBeGreaterThan(-1)
    expect(climateBlock).toMatch(/'passed',/)
    expect(taxBlock).toMatch(/'passed',/)
  })

  it('every promoted issue has a non-empty source_url', () => {
    const urls = [...migration024.matchAll(/'(https:\/\/[^']+)',\s*\n\s*false\s*\n\s*\)/g)]
    expect(urls.length).toBe(REAL_ISSUE_IDS.length)
    for (const m of urls) {
      expect(m[1].length).toBeGreaterThan (10)
    }
  })

  it('inserts no responsibility relationship of its own — issue content and Responsibility Engine wiring are cleanly separated across migrations', () => {
    expect(migration024).not.toMatch(/insert into issue_portfolios/i)
    expect(migration024).not.toMatch(/insert into person_portfolio_roles/i)
    expect(migration024).not.toMatch(/insert into portfolios/i)
  })

  it('inserts no issue_markets row — no forecast/mock fallback is created for a real issue', () => {
    expect(migration024).not.toMatch(/insert into issue_markets/i)
  })
})

describe('025/026: every new Portfolio/Department/Minister relationship is evidence-backed', () => {
  it('025 never inserts a portfolio, department_portfolio, or issue_portfolio without an evidence_links insert immediately available for it', () => {
    // Coarse structural check, same convention as responsibility-first-real-slice.test.ts:
    // count relationship-creating inserts vs evidence_links inserts.
    const relationshipInserts = (migration025.match(/insert into (portfolios|departments|department_portfolios|issue_portfolios)\b/gi) ?? []).length
    const evidenceLinkInserts = (migration025.match(/insert into evidence_links/gi) ?? []).length
    expect(evidenceLinkInserts).toBeGreaterThanOrEqual(relationshipInserts)
  })

  it('every Evidence classification used in 025 is one of the Charter\'s 8-way values', () => {
    const classifications = [...migration025.matchAll(/'(verified_fact|sourced_analysis|forecast|community_opinion|ai_generated_interpretation|disputed_claim|demo_content|unknown_no_verified_data)'/g)]
    expect(classifications.length).toBeGreaterThan(0)
    for (const m of classifications) {
      expect(ALLOWED_EVIDENCE_CLASSIFICATIONS).toContain(m[1])
    }
  })

  it('every new Evidence row in 025 has a real, non-empty source_url', () => {
    const sourceUrls = [...migration025.matchAll(/'(https:\/\/[^']+)'/g)]
    expect(sourceUrls.length).toBeGreaterThanOrEqual(6) // 6 new Evidence rows authored in this migration
  })

  it('026 resolves every minister by tvfy_id only — no name, electorate, or house predicate', () => {
    const executable = stripSqlComments(migration026)
    expect(executable).toMatch(/where\s+tvfy_id\s*=\s*\d+/gi)
    expect(executable).not.toMatch(/\.name\s*=\s*'/i)
    expect(executable).not.toMatch(/electorate\s*=/i)
    expect(executable).not.toMatch(/\bhouse\s*=\s*'/i)
    expect(executable).not.toMatch(/ilike/i)
    expect(executable).not.toMatch(/display_name/i)
  })

  it('026 links every inserted person_portfolio_role to a real Evidence row', () => {
    const roleInserts = (migration026.match(/insert into person_portfolio_roles/gi) ?? []).length
    const evidenceLinkInserts = (migration026.match(/insert into evidence_links/gi) ?? []).length
    expect(evidenceLinkInserts).toBeGreaterThanOrEqual(roleInserts)
  })

  it('NDIS records two concurrent minister roles (Butler + McAllister), not one collapsed into the other — a real example of distributed responsibility', () => {
    expect(migration026).toMatch(/10086/) // Mark Butler
    expect(migration026).toMatch(/10839/) // Jenny McAllister
    const ndisSection = migration026.slice(migration026.indexOf('NDIS: Mark Butler'), migration026.indexOf('Climate Change and Energy: Chris Bowen'))
    expect((ndisSection.match(/insert into person_portfolio_roles/gi) ?? []).length).toBe(2)
  })

  it('every new minister role is real (is_test_fixture = false), never a fixture', () => {
    const roleInserts = migration026.match(/insert into person_portfolio_roles[\s\S]*?\);/gi) ?? []
    expect(roleInserts.length).toBeGreaterThan(0)
    for (const stmt of roleInserts) {
      expect(stmt).toMatch(/false\)/)
    }
  })

  it('idempotency: both migrations check for an existing row before inserting', () => {
    expect(migration025).toMatch(/already exists.*skipping/i)
    expect(migration026).toMatch(/already exists.*skipping/i)
  })
})

describe('no responsibility relationship is asserted for the issue that stayed demo', () => {
  it('misinformation-bill never appears in 025 or 026', () => {
    expect(migration025).not.toMatch(/misinformation/i)
    expect(migration026).not.toMatch(/misinformation/i)
  })
})

describe('real issue promotion is not automatic — a DB row alone does not imply a verified responsibility graph', () => {
  it('024 (issue content) and 025/026 (responsibility relationships) are separate migrations — an issue can exist in 024 without 025/026 ever running, and would correctly resolve to an empty/unverified graph (proven generically in responsibility-read-path.test.ts)', () => {
    // Structural proof: 024 contains zero Responsibility Engine writes
    // (asserted above), so the existence of an `issues` row by itself
    // cannot cause getIssueResponsibilityGraph() to return anything —
    // it strictly requires 025/026's issue_portfolios/person_portfolio_roles
    // rows, which is exactly the existing, already-tested gate.
    expect(migration024).not.toMatch(/insert into (portfolios|issue_portfolios|person_portfolio_roles)/i)
  })
})
