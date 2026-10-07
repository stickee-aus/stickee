import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../supabase/migrations')
const readMigration = (filename: string) => readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8')

const migration021 = readMigration('021_responsibility_first_real_slice.sql')
const migration022 = readMigration('022_responsibility_minister_identity_pending_review.sql')

const componentSource = readFileSync(
  path.resolve(__dirname, '../../components/IssueResponsibilitySection.tsx'),
  'utf8',
)
const dbSource = readFileSync(path.resolve(__dirname, '../responsibility-db.ts'), 'utf8')
const pageSource = readFileSync(
  path.resolve(__dirname, '../../app/issue/[id]/page.tsx'),
  'utf8',
)

describe('021: real data slice — guards and content', () => {
  it('gates on the Issue being a real, non-fixture row before inserting anything', () => {
    expect(migration021).toMatch(/is_test_fixture\s*=\s*false/i)
    expect(migration021).toMatch(/raise exception 'BLOCKER/i)
  })

  it('is idempotent — checks for an existing Housing portfolio before inserting', () => {
    expect(migration021).toMatch(/select id into v_existing_portfolio_id/i)
    expect(migration021).toMatch(/return;/)
  })

  it('inserts real (is_test_fixture = false) rows only, never fixtures', () => {
    const insertStatements = migration021.match(/insert into \w+[\s\S]*?values[\s\S]*?\);/gi) ?? []
    expect(insertStatements.length).toBeGreaterThan(0)
    for (const stmt of insertStatements) {
      // evidence_links rows have no is_test_fixture column at all — skip those.
      if (/insert into evidence_links/i.test(stmt)) continue
      expect(stmt).toMatch(/false\)/)
    }
  })

  it('every Evidence classification used is one of the Charter\'s 8-way values', () => {
    const allowed = [
      'verified_fact', 'sourced_analysis', 'forecast', 'community_opinion',
      'ai_generated_interpretation', 'disputed_claim', 'demo_content', 'unknown_no_verified_data',
    ]
    const classifications = [...migration021.matchAll(/'(verified_fact|sourced_analysis|forecast|community_opinion|ai_generated_interpretation|disputed_claim|demo_content|unknown_no_verified_data)'/g)]
    expect(classifications.length).toBeGreaterThan(0)
    for (const match of classifications) {
      expect(allowed).toContain(match[1])
    }
  })

  it('every relationship insert (department_portfolios, issue_portfolios) is followed by an evidence_links insert', () => {
    // Coarse structural check: the number of evidence_links inserts must be
    // at least as many as the number of relationship-type rows created that
    // require evidence (department, department_portfolio, issue_portfolio,
    // portfolio) — i.e. nothing is created evidence-free.
    const evidenceLinkInserts = (migration021.match(/insert into evidence_links/gi) ?? []).length
    expect(evidenceLinkInserts).toBeGreaterThanOrEqual(4) // portfolio, department, department_portfolio, issue_portfolio
  })

  it('does not introduce a numeric confidence/trust/weight score', () => {
    expect(migration021).not.toMatch(/confidence_score/i)
    expect(migration021).not.toMatch(/trust_score/i)
    expect(migration021).not.toMatch(/influence_score/i)
  })

  it('does not create a Committee record or a civic_events row', () => {
    expect(migration021.toLowerCase()).not.toContain('committee')
    expect(migration021.toLowerCase()).not.toContain('civic_event')
  })
})

describe('022: proposed minister identity resolution — must be inert', () => {
  it('every executable statement is wrapped in a block comment (no live INSERT outside /* ... */)', () => {
    const withoutBlockComments = migration022.replace(/\/\*[\s\S]*?\*\//g, '')
    // Strip line comments too, then check nothing executable remains beyond
    // the file's own header prose.
    const withoutLineComments = withoutBlockComments.replace(/--.*$/gm, '')
    expect(withoutLineComments).not.toMatch(/insert into/i)
    expect(withoutLineComments).not.toMatch(/^\s*do\s*\$\$/im)
  })

  it('the proposed (commented-out) resolution uses electorate+house, never a name-matching predicate', () => {
    const insideComment = migration022.match(/\/\*([\s\S]*?)\*\//)?.[1] ?? ''
    expect(insideComment).toMatch(/electorate\s*=\s*'Hotham'/i)
    expect(insideComment).toMatch(/house\s*=\s*'representatives'/i)
    expect(insideComment).not.toMatch(/\.name\s*=/i)
    expect(insideComment).not.toMatch(/ilike/i)
    expect(insideComment).not.toMatch(/display_name/i)
  })

  it('the proposed resolution guards against zero or multiple matching members rather than assuming exactly one', () => {
    const insideComment = migration022.match(/\/\*([\s\S]*?)\*\//)?.[1] ?? ''
    expect(insideComment).toMatch(/v_member_count = 0/)
    expect(insideComment).toMatch(/v_member_count > 1/)
  })
})

describe('021/022: no name-based identity matching anywhere in executable SQL', () => {
  const stripSqlComments = (sql: string) => sql.replace(/--.*$/gm, '')

  it('021 (which never touches members) contains no member/name lookups at all', () => {
    const executable = stripSqlComments(migration021)
    expect(executable).not.toMatch(/from\s+members/i)
  })

  it('neither file matches an MP to anything by a bare name-equality predicate', () => {
    for (const sql of [migration021, migration022]) {
      const executable = stripSqlComments(sql).replace(/\/\*[\s\S]*?\*\//g, '')
      expect(executable).not.toMatch(/\.name\s*=\s*'/i)
      expect(executable).not.toMatch(/name\s*=\s*'[^']*'\s*and\s*house/i)
    }
  })
})

describe('generic read path and component — no hardcoded Housing/O\'Neil/Treasury names', () => {
  // Both files legitimately *discuss* this batch's example issue in their
  // own explanatory comments (e.g. "the one this batch actually populated
  // (housing-affordability)") — that's documentation, not a code path. What
  // must never appear is one of these names in *executable* source, so
  // comments are stripped before scanning, same convention used for the
  // mp-scorecard and V1 Foundation batch tests.
  const stripComments = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

  it('IssueResponsibilitySection.tsx contains no issue-specific hardcoded names in executable code', () => {
    const executable = stripComments(componentSource)
    for (const forbidden of ["Housing", "O'Neil", "Clare", "Treasury", "housing-affordability"]) {
      expect(executable).not.toContain(forbidden)
    }
  })

  it('responsibility-db.ts contains no issue-specific hardcoded names in executable code', () => {
    const executable = stripComments(dbSource)
    for (const forbidden of ["Housing", "O'Neil", "Clare", "Treasury", "housing-affordability"]) {
      expect(executable).not.toContain(forbidden)
    }
  })

  it('the component renders generically off JURISDICTION_LABELS/RESPONSIBILITY_KIND_LABELS, not a switch on issue id', () => {
    expect(componentSource).toMatch(/JURISDICTION_LABELS/)
    expect(componentSource).toMatch(/RESPONSIBILITY_KIND_LABELS/)
    expect(componentSource).not.toMatch(/issueId\s*===/)
    expect(componentSource).not.toMatch(/issue\.id\s*===/)
  })

  it('page.tsx wires the generic getIssueResponsibilityGraph/selectVerifiedEntries, not an issue-specific branch', () => {
    expect(pageSource).toMatch(/getIssueResponsibilityGraph/)
    expect(pageSource).toMatch(/selectVerifiedEntries/)
    expect(pageSource).not.toMatch(/housing-affordability/i)
  })

  it('page.tsx preserves the exact pre-existing fallback copy for issues without verified relationships', () => {
    expect(pageSource).toContain(
      "We haven&apos;t yet verified who has primary responsibility for this issue.",
    )
  })

  it('page.tsx wraps the responsibility graph fetch defensively so a missing table cannot break other issues', () => {
    expect(pageSource).toMatch(/try\s*\{[\s\S]*getIssueResponsibilityGraph[\s\S]*\}\s*catch/)
  })
})
