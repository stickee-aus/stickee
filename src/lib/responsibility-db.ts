import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  attachVerification,
  mapDepartmentPortfolioRow,
  mapDepartmentRow,
  mapEvidenceRow,
  mapIssuePortfolioRow,
  mapPersonPortfolioRoleRow,
  mapPortfolioRow,
  subjectKey,
  type DepartmentDBRow,
  type DepartmentPortfolioDBRow,
  type DepartmentPortfolioRecord,
  type DepartmentRecord,
  type EvidenceDBRow,
  type EvidenceLinkDBRow,
  type EvidenceRecord,
  type EvidenceSubjectType,
  type IssuePortfolioDBRow,
  type IssuePortfolioRecord,
  type PersonPortfolioRoleDBRow,
  type PersonPortfolioRoleRecord,
  type PortfolioDBRow,
  type PortfolioRecord,
  type WithVerification,
} from '@/lib/responsibility-data'

/**
 * Responsibility Engine V1 — minimum read path.
 *
 * This is deliberately the smallest query surface that proves the graph
 * works end-to-end: Issue → Portfolio → Person role → Department →
 * Evidence. It is NOT wired into any page — per the Responsibility Engine
 * V1 Foundation batch scope, no new UI or public page was built in this
 * batch (see RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md §11). This
 * module exists for internal/developer verification and as the extension
 * point a future Issue Detail batch would build on.
 *
 * Every query filters `is_test_fixture = false` in addition to relying on
 * RLS (same defence-in-depth pattern already used in issues-db.ts) — an
 * admin-context caller that legitimately needs to see fixtures should pass
 * `includeTestFixtures: true` explicitly rather than this ever defaulting
 * to "show everything".
 */

const EVIDENCE_COLUMNS =
  'id, source_type, title, source_url, publisher, source_published_at, retrieved_at, classification, verification_status, notes, dispute_note, superseded_by_id, is_test_fixture'

const PORTFOLIO_COLUMNS = 'id, canonical_name, jurisdiction, effective_from, effective_to, is_test_fixture'
const DEPARTMENT_COLUMNS = 'id, canonical_name, jurisdiction, effective_from, effective_to, is_test_fixture'
const DEPARTMENT_PORTFOLIO_COLUMNS =
  'id, department_id, portfolio_id, effective_from, effective_to, is_test_fixture'
const PERSON_PORTFOLIO_ROLE_COLUMNS =
  'id, member_id, portfolio_id, role_type, responsibility_kind, effective_from, effective_to, is_test_fixture'
const ISSUE_PORTFOLIO_COLUMNS =
  'id, issue_id, portfolio_id, responsibility_kind, effective_from, effective_to, is_test_fixture'

interface QueryOptions {
  /** Defaults to false — test fixtures are never shown unless explicitly asked for. */
  includeTestFixtures?: boolean
}

/**
 * Fetches all Evidence linked to a set of (subject_type, subject_id)
 * pairs, keyed by `subjectKey(type, id)`. One query per distinct subject
 * type present (subject_type/subject_id isn't a composite FK — see
 * migration 018's comment on evidence_links — so this can't be a single
 * `.in()` call over pairs).
 */
async function fetchEvidenceBySubjects(
  supabase: SupabaseClient,
  subjects: ReadonlyArray<{ type: EvidenceSubjectType; id: string }>,
  opts: QueryOptions,
): Promise<Map<string, EvidenceRecord[]>> {
  const result = new Map<string, EvidenceRecord[]>()
  if (subjects.length === 0) return result

  const idsByType = new Map<EvidenceSubjectType, string[]>()
  for (const { type, id } of subjects) {
    const bucket = idsByType.get(type)
    if (bucket) bucket.push(id)
    else idsByType.set(type, [id])
  }

  const linkRows: EvidenceLinkDBRow[] = []
  for (const [type, ids] of idsByType) {
    const { data } = await supabase
      .from('evidence_links')
      .select('id, evidence_id, subject_type, subject_id')
      .eq('subject_type', type)
      .in('subject_id', ids)
    linkRows.push(...((data ?? []) as EvidenceLinkDBRow[]))
  }

  const evidenceIds = Array.from(new Set(linkRows.map(r => r.evidence_id)))
  if (evidenceIds.length === 0) return result

  let evidenceQuery = supabase.from('evidence').select(EVIDENCE_COLUMNS).in('id', evidenceIds)
  if (!opts.includeTestFixtures) evidenceQuery = evidenceQuery.eq('is_test_fixture', false)
  const { data: evidenceRows } = await evidenceQuery

  const evidenceById = new Map(
    ((evidenceRows ?? []) as EvidenceDBRow[]).map(row => [row.id, mapEvidenceRow(row)]),
  )

  for (const link of linkRows) {
    const record = evidenceById.get(link.evidence_id)
    if (!record) continue // filtered out as a fixture, or dangling — either way, don't surface it
    const key = subjectKey(link.subject_type, link.subject_id)
    const bucket = result.get(key)
    if (bucket) bucket.push(record)
    else result.set(key, [record])
  }

  return result
}

export interface IssuePortfolioGraphEntry {
  issuePortfolio: WithVerification<IssuePortfolioRecord>
  portfolio: WithVerification<PortfolioRecord> | null
  ministers: Array<WithVerification<PersonPortfolioRoleRecord> & { memberName: string | null }>
  /**
   * `isVerified`/`evidence` here reflect the DEPARTMENT_PORTFOLIO
   * relationship's own evidence (does something actually establish that
   * THIS department administers THIS portfolio?), not just the
   * department's own entity evidence (does this department exist at all?)
   * — those are two different claims. `entityEvidence` carries the
   * department's own evidence separately, for display alongside the
   * relationship evidence, but never substitutes for it when deciding
   * `isVerified`. See RESPONSIBILITY_ENGINE_V1_FIRST_REAL_SLICE_REPORT.md
   * §11 for why this was tightened from the V1 Foundation batch, which
   * gated on entity evidence alone.
   */
  departments: Array<WithVerification<DepartmentRecord> & { entityEvidence: EvidenceRecord[] }>
}

export interface IssueResponsibilityGraph {
  issueId: string
  /** One entry per currently-active issue_portfolios row — an issue with shared responsibility across several portfolios returns several entries, never collapsed to one. */
  entries: IssuePortfolioGraphEntry[]
}

/**
 * The minimum proof-of-model query: for a given Issue, resolve every
 * currently-active Portfolio relationship, each portfolio's current
 * Minister/Assistant Minister and Department links, and the Evidence
 * backing each — with every relationship's verification state computed
 * from its actual linked evidence, never assumed.
 */
export async function getIssueResponsibilityGraph(
  issueId: string,
  opts: QueryOptions = {},
): Promise<IssueResponsibilityGraph> {
  const supabase = await createServerSupabaseClient()

  let issuePortfolioQuery = supabase
    .from('issue_portfolios')
    .select(ISSUE_PORTFOLIO_COLUMNS)
    .eq('issue_id', issueId)
    .is('effective_to', null)
  if (!opts.includeTestFixtures) issuePortfolioQuery = issuePortfolioQuery.eq('is_test_fixture', false)
  const { data: issuePortfolioRows } = await issuePortfolioQuery

  const issuePortfolios = ((issuePortfolioRows ?? []) as IssuePortfolioDBRow[]).map(mapIssuePortfolioRow)
  if (issuePortfolios.length === 0) return { issueId, entries: [] }

  const portfolioIds = Array.from(new Set(issuePortfolios.map(ip => ip.portfolioId)))

  let portfolioQuery = supabase.from('portfolios').select(PORTFOLIO_COLUMNS).in('id', portfolioIds)
  if (!opts.includeTestFixtures) portfolioQuery = portfolioQuery.eq('is_test_fixture', false)

  let rolesQuery = supabase
    .from('person_portfolio_roles')
    .select(PERSON_PORTFOLIO_ROLE_COLUMNS)
    .in('portfolio_id', portfolioIds)
    .is('effective_to', null)
  if (!opts.includeTestFixtures) rolesQuery = rolesQuery.eq('is_test_fixture', false)

  let deptPortfolioQuery = supabase
    .from('department_portfolios')
    .select(DEPARTMENT_PORTFOLIO_COLUMNS)
    .in('portfolio_id', portfolioIds)
    .is('effective_to', null)
  if (!opts.includeTestFixtures) deptPortfolioQuery = deptPortfolioQuery.eq('is_test_fixture', false)

  const [portfolioRes, rolesRes, deptPortfolioRes] = await Promise.all([
    portfolioQuery,
    rolesQuery,
    deptPortfolioQuery,
  ])

  const portfolios = ((portfolioRes.data ?? []) as PortfolioDBRow[]).map(mapPortfolioRow)
  const roles = ((rolesRes.data ?? []) as PersonPortfolioRoleDBRow[]).map(mapPersonPortfolioRoleRow)
  const deptPortfolios = ((deptPortfolioRes.data ?? []) as DepartmentPortfolioDBRow[]).map(
    mapDepartmentPortfolioRow,
  )

  const portfolioById = new Map(portfolios.map(p => [p.id, p]))
  const departmentIds = Array.from(new Set(deptPortfolios.map(dp => dp.departmentId)))
  const memberIds = Array.from(new Set(roles.map(r => r.memberId)))

  let departmentQuery = supabase.from('departments').select(DEPARTMENT_COLUMNS).in('id', departmentIds)
  if (!opts.includeTestFixtures) departmentQuery = departmentQuery.eq('is_test_fixture', false)

  const [departmentRes, memberRes] = await Promise.all([
    departmentIds.length ? departmentQuery : Promise.resolve({ data: [] as DepartmentDBRow[] }),
    memberIds.length
      ? supabase.from('members').select('id, name').in('id', memberIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ])

  const departments = ((departmentRes.data ?? []) as DepartmentDBRow[]).map(mapDepartmentRow)
  const departmentById = new Map(departments.map(d => [d.id, d]))
  const memberNameById = new Map(
    ((memberRes.data ?? []) as Array<{ id: string; name: string }>).map(m => [m.id, m.name]),
  )

  // One evidence fetch covering every subject this graph touches.
  const subjects: Array<{ type: EvidenceSubjectType; id: string }> = [
    ...issuePortfolios.map(r => ({ type: 'issue_portfolio' as const, id: r.id })),
    ...portfolios.map(r => ({ type: 'portfolio' as const, id: r.id })),
    ...roles.map(r => ({ type: 'person_portfolio_role' as const, id: r.id })),
    ...deptPortfolios.map(r => ({ type: 'department_portfolio' as const, id: r.id })),
    ...departments.map(r => ({ type: 'department' as const, id: r.id })),
  ]
  const evidenceBySubject = await fetchEvidenceBySubjects(supabase, subjects, opts)

  const evidenceFor = (type: EvidenceSubjectType, id: string) => evidenceBySubject.get(subjectKey(type, id)) ?? []

  const rolesByPortfolio = new Map<string, PersonPortfolioRoleRecord[]>()
  for (const role of roles) {
    const bucket = rolesByPortfolio.get(role.portfolioId)
    if (bucket) bucket.push(role)
    else rolesByPortfolio.set(role.portfolioId, [role])
  }

  const deptPortfoliosByPortfolio = new Map<string, DepartmentPortfolioRecord[]>()
  for (const dp of deptPortfolios) {
    const bucket = deptPortfoliosByPortfolio.get(dp.portfolioId)
    if (bucket) bucket.push(dp)
    else deptPortfoliosByPortfolio.set(dp.portfolioId, [dp])
  }

  const entries: IssuePortfolioGraphEntry[] = issuePortfolios.map(issuePortfolio => {
    const portfolio = portfolioById.get(issuePortfolio.portfolioId) ?? null

    const ministers = (rolesByPortfolio.get(issuePortfolio.portfolioId) ?? []).map(role => ({
      ...attachVerification(role, evidenceFor('person_portfolio_role', role.id)),
      memberName: memberNameById.get(role.memberId) ?? null,
    }))

    const departmentsForPortfolio = (deptPortfoliosByPortfolio.get(issuePortfolio.portfolioId) ?? [])
      .flatMap(dp => {
        const department = departmentById.get(dp.departmentId)
        if (!department) return []
        // Gate verification on the department_portfolios relationship's own
        // evidence (the claim being rendered is "this department administers
        // this portfolio"), not the department entity's own evidence (which
        // only supports "this department exists").
        return [{
          ...attachVerification(department, evidenceFor('department_portfolio', dp.id)),
          entityEvidence: evidenceFor('department', department.id),
        }]
      })

    return {
      issuePortfolio: attachVerification(issuePortfolio, evidenceFor('issue_portfolio', issuePortfolio.id)),
      portfolio: portfolio ? attachVerification(portfolio, evidenceFor('portfolio', portfolio.id)) : null,
      ministers,
      departments: departmentsForPortfolio,
    }
  })

  return { issueId, entries }
}

/**
 * The single shared definition of "verified enough to display" for an
 * Issue↔Portfolio entry: both the Issue↔Portfolio relationship itself AND
 * the Portfolio entity it points at must independently have qualifying
 * evidence. Pure and side-effect-free — used by both the Issue Detail page
 * (to decide whether to render the responsibility section at all) and
 * `IssueResponsibilitySection` (to decide which entries to render), so the
 * two can never disagree about what counts as verified.
 */
export function selectVerifiedEntries(graph: IssueResponsibilityGraph): IssuePortfolioGraphEntry[] {
  return graph.entries.filter(entry => entry.issuePortfolio.isVerified && entry.portfolio?.isVerified)
}
