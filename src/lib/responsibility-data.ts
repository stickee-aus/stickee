/**
 * Responsibility Engine V1 — pure types, row mappers, and verification
 * logic. No Supabase I/O here (see responsibility-db.ts for the fetch
 * layer) — kept separate so the truthfulness-critical logic (does this
 * relationship have qualifying evidence?) is unit-testable without a
 * database, matching the mapIssueMarketRecord()/issues-data.ts convention
 * already used elsewhere in this codebase.
 *
 * See docs/architecture/RESPONSIBILITY_ENGINE.md and
 * docs/architecture/EVIDENCE_PROVENANCE_MODEL.md for the design, and
 * RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md for what actually shipped.
 */

// ─── Shared taxonomy (must match the CHECK constraints in migrations 018–020) ─

/** The Charter's existing 8-way truth classification (STICKEE_CHARTER.md §5) — reused, not reinvented. */
export type EvidenceClassification =
  | 'verified_fact'
  | 'sourced_analysis'
  | 'forecast'
  | 'community_opinion'
  | 'ai_generated_interpretation'
  | 'disputed_claim'
  | 'demo_content'
  | 'unknown_no_verified_data'

/** The seven approved responsibility kinds from RESPONSIBILITY_ENGINE.md §1. No others are valid. */
export type ResponsibilityKind =
  | 'authority'
  | 'responsibility'
  | 'implementation'
  | 'oversight'
  | 'scrutiny'
  | 'influence'
  | 'representation'

export type PersonRoleType = 'minister' | 'assistant_minister'

export type Jurisdiction =
  | 'commonwealth' | 'nsw' | 'vic' | 'qld' | 'wa' | 'sa' | 'tas' | 'act' | 'nt' | 'local'

export type EvidenceSourceType = 'official' | 'secondary_reporting' | 'dataset' | 'stickee_editorial'

export type EvidenceSubjectType =
  | 'portfolio' | 'department' | 'department_portfolio' | 'person_portfolio_role' | 'issue_portfolio'

// ─── Domain records (camelCase, mapped from snake_case DB rows) ───────────────

export interface EvidenceRecord {
  id: string
  sourceType: EvidenceSourceType
  title: string
  sourceUrl: string | null
  publisher: string | null
  sourcePublishedAt: string | null
  retrievedAt: string
  classification: EvidenceClassification
  verificationStatus: 'unreviewed' | 'human_reviewed'
  notes: string | null
  disputeNote: string | null
  supersededById: string | null
  isTestFixture: boolean
}

export interface PortfolioRecord {
  id: string
  canonicalName: string
  jurisdiction: Jurisdiction
  effectiveFrom: string
  effectiveTo: string | null
  isTestFixture: boolean
}

export interface DepartmentRecord {
  id: string
  canonicalName: string
  jurisdiction: Jurisdiction
  effectiveFrom: string
  effectiveTo: string | null
  isTestFixture: boolean
}

export interface DepartmentPortfolioRecord {
  id: string
  departmentId: string
  portfolioId: string
  effectiveFrom: string
  effectiveTo: string | null
  isTestFixture: boolean
}

export interface PersonPortfolioRoleRecord {
  id: string
  memberId: string
  portfolioId: string
  roleType: PersonRoleType
  responsibilityKind: ResponsibilityKind
  effectiveFrom: string
  effectiveTo: string | null
  isTestFixture: boolean
}

export interface IssuePortfolioRecord {
  id: string
  issueId: string
  portfolioId: string
  responsibilityKind: ResponsibilityKind
  effectiveFrom: string
  effectiveTo: string | null
  isTestFixture: boolean
}

// ─── Raw DB row shapes (snake_case, as returned by Supabase) ──────────────────

export interface EvidenceDBRow {
  id: string
  source_type: EvidenceSourceType
  title: string
  source_url: string | null
  publisher: string | null
  source_published_at: string | null
  retrieved_at: string
  classification: EvidenceClassification
  verification_status: 'unreviewed' | 'human_reviewed'
  notes: string | null
  dispute_note: string | null
  superseded_by_id: string | null
  is_test_fixture: boolean
}

export interface PortfolioDBRow {
  id: string
  canonical_name: string
  jurisdiction: Jurisdiction
  effective_from: string
  effective_to: string | null
  is_test_fixture: boolean
}

export interface DepartmentDBRow {
  id: string
  canonical_name: string
  jurisdiction: Jurisdiction
  effective_from: string
  effective_to: string | null
  is_test_fixture: boolean
}

export interface DepartmentPortfolioDBRow {
  id: string
  department_id: string
  portfolio_id: string
  effective_from: string
  effective_to: string | null
  is_test_fixture: boolean
}

export interface PersonPortfolioRoleDBRow {
  id: string
  member_id: string
  portfolio_id: string
  role_type: PersonRoleType
  responsibility_kind: ResponsibilityKind
  effective_from: string
  effective_to: string | null
  is_test_fixture: boolean
}

export interface IssuePortfolioDBRow {
  id: string
  issue_id: string
  portfolio_id: string
  responsibility_kind: ResponsibilityKind
  effective_from: string
  effective_to: string | null
  is_test_fixture: boolean
}

export interface EvidenceLinkDBRow {
  id: string
  evidence_id: string
  subject_type: EvidenceSubjectType
  subject_id: string
}

// ─── Mappers ────────────────────────────────────────────────────────────────

export function mapEvidenceRow(row: EvidenceDBRow): EvidenceRecord {
  return {
    id: row.id,
    sourceType: row.source_type,
    title: row.title,
    sourceUrl: row.source_url,
    publisher: row.publisher,
    sourcePublishedAt: row.source_published_at,
    retrievedAt: row.retrieved_at,
    classification: row.classification,
    verificationStatus: row.verification_status,
    notes: row.notes,
    disputeNote: row.dispute_note,
    supersededById: row.superseded_by_id,
    isTestFixture: row.is_test_fixture,
  }
}

export function mapPortfolioRow(row: PortfolioDBRow): PortfolioRecord {
  return {
    id: row.id,
    canonicalName: row.canonical_name,
    jurisdiction: row.jurisdiction,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    isTestFixture: row.is_test_fixture,
  }
}

export function mapDepartmentRow(row: DepartmentDBRow): DepartmentRecord {
  return {
    id: row.id,
    canonicalName: row.canonical_name,
    jurisdiction: row.jurisdiction,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    isTestFixture: row.is_test_fixture,
  }
}

export function mapDepartmentPortfolioRow(row: DepartmentPortfolioDBRow): DepartmentPortfolioRecord {
  return {
    id: row.id,
    departmentId: row.department_id,
    portfolioId: row.portfolio_id,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    isTestFixture: row.is_test_fixture,
  }
}

export function mapPersonPortfolioRoleRow(row: PersonPortfolioRoleDBRow): PersonPortfolioRoleRecord {
  return {
    id: row.id,
    memberId: row.member_id,
    portfolioId: row.portfolio_id,
    roleType: row.role_type,
    responsibilityKind: row.responsibility_kind,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    isTestFixture: row.is_test_fixture,
  }
}

export function mapIssuePortfolioRow(row: IssuePortfolioDBRow): IssuePortfolioRecord {
  return {
    id: row.id,
    issueId: row.issue_id,
    portfolioId: row.portfolio_id,
    responsibilityKind: row.responsibility_kind,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    isTestFixture: row.is_test_fixture,
  }
}

// ─── Verification state ────────────────────────────────────────────────────
//
// A relationship's public "verification state" is *computed* from its
// linked, non-superseded evidence at read time — never stored as a column
// on the relationship itself. Storing it would recreate the exact defect
// this whole design exists to close: a field that looks authoritative but
// drifts out of sync with the evidence that's supposed to back it (the
// lesson already learned once from `issues.mp_yes_count`, which nothing
// ever wrote to — see ISSUE_DETAIL_V1_REPORT.md §5).
//
// No numeric confidence score is computed anywhere in this module — see
// EVIDENCE_PROVENANCE_MODEL.md §6 for why that's deliberate.

/**
 * Classifications strong enough that a relationship backed by them may be
 * labelled "verified" in a UI. Deliberately conservative: only the two
 * classifications that mean "we checked this against a real source" count
 * — forecasts, community opinion, AI interpretation, demo content, and
 * disputed claims never do, regardless of how many of them are linked.
 */
export const VERIFIED_CLASSIFICATIONS: ReadonlySet<EvidenceClassification> = new Set([
  'verified_fact',
  'sourced_analysis',
])

/**
 * Reduces a relationship's linked evidence down to one displayable
 * classification. Order matters and is deliberately NOT "most recent wins"
 * or "majority wins" — it's "least likely to overclaim wins":
 *
 * 1. Any active `disputed_claim` evidence trumps everything — a dispute is
 *    never hidden by other, more favourable evidence on the same claim.
 * 2. Any active `demo_content` evidence trumps any remaining classification
 *    — a relationship must never be presented as real because it also
 *    happens to have one genuine citation alongside a demo one.
 * 3. Otherwise, the strongest genuine classification present wins, in
 *    descending order of evidentiary strength.
 * 4. No active, non-superseded evidence at all → 'unknown_no_verified_data'
 *    (this is the correct, honest default — not an error state).
 */
export function resolveVerificationState(evidence: readonly EvidenceRecord[]): EvidenceClassification {
  const active = evidence.filter(e => !e.supersededById)
  if (active.length === 0) return 'unknown_no_verified_data'

  const precedence: EvidenceClassification[] = [
    'disputed_claim',
    'demo_content',
    'verified_fact',
    'sourced_analysis',
    'ai_generated_interpretation',
    'forecast',
    'community_opinion',
  ]

  for (const classification of precedence) {
    if (active.some(e => e.classification === classification)) return classification
  }

  return 'unknown_no_verified_data'
}

export function isVerified(evidence: readonly EvidenceRecord[]): boolean {
  return VERIFIED_CLASSIFICATIONS.has(resolveVerificationState(evidence))
}

export interface WithVerification<T> {
  record: T
  evidence: EvidenceRecord[]
  verification: EvidenceClassification
  isVerified: boolean
}

/**
 * Attaches evidence-derived verification state to any relationship/entity
 * record. This is the ONLY place "is this verified" is decided — every
 * read-path consumer must go through this function rather than inferring
 * verification from the presence of a row alone (a row existing means an
 * assertion was made, not that it's verified — see
 * ISSUE_DETAIL_V1_REPORT.md §6's precedent on this exact distinction).
 */
export function attachVerification<T>(record: T, evidence: EvidenceRecord[]): WithVerification<T> {
  return {
    record,
    evidence,
    verification: resolveVerificationState(evidence),
    isVerified: isVerified(evidence),
  }
}

export function subjectKey(type: EvidenceSubjectType, id: string): string {
  return `${type}:${id}`
}

// ─── Plain-language labels ──────────────────────────────────────────────────
//
// Generic, entity-agnostic lookup maps — never issue-specific. Used by any
// page rendering a Responsibility Engine relationship (Issue Detail today;
// Government/People in future batches) so no consuming component needs to
// hardcode display strings for a specific issue, portfolio, or person. Per
// RESPONSIBILITY_MAP_SPEC.md's "plain-language role statements, not scores"
// rule — these are prose labels, never a numeric weight or ranking.

export const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  commonwealth: 'Federal',
  nsw: 'New South Wales',
  vic: 'Victoria',
  qld: 'Queensland',
  wa: 'Western Australia',
  sa: 'South Australia',
  tas: 'Tasmania',
  act: 'Australian Capital Territory',
  nt: 'Northern Territory',
  local: 'Local',
}

export const RESPONSIBILITY_KIND_LABELS: Record<ResponsibilityKind, string> = {
  authority: 'Legal authority',
  responsibility: 'Policy responsibility',
  implementation: 'Implementation',
  oversight: 'Oversight',
  scrutiny: 'Scrutiny',
  influence: 'Influence',
  representation: 'Representation',
}

export const PERSON_ROLE_TYPE_LABELS: Record<PersonRoleType, string> = {
  minister: 'Minister',
  assistant_minister: 'Assistant Minister',
}

// ─── Grouping helpers ───────────────────────────────────────────────────────
//
// Plain, generic groupBy — used to prove/exercise the "one issue → many
// portfolios" and "one portfolio → many issues" cardinality the schema is
// designed to allow (see RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md §11).

export function groupBy<T, K>(items: readonly T[], keyOf: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }
  return map
}

export function groupIssuePortfoliosByIssue(
  rows: readonly IssuePortfolioRecord[],
): Map<string, IssuePortfolioRecord[]> {
  return groupBy(rows, r => r.issueId)
}

export function groupIssuePortfoliosByPortfolio(
  rows: readonly IssuePortfolioRecord[],
): Map<string, IssuePortfolioRecord[]> {
  return groupBy(rows, r => r.portfolioId)
}
