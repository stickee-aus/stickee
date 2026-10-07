import {
  JURISDICTION_LABELS,
  PERSON_ROLE_TYPE_LABELS,
  RESPONSIBILITY_KIND_LABELS,
  VERIFIED_CLASSIFICATIONS,
  type EvidenceRecord,
} from '@/lib/responsibility-data'
import { selectVerifiedEntries, type IssueResponsibilityGraph } from '@/lib/responsibility-db'

/**
 * Renders the Responsibility Engine's real, evidence-backed relationships
 * for one issue — driven entirely by `IssueResponsibilityGraph`, the
 * generic read path (`getIssueResponsibilityGraph`). Nothing in this file
 * names a specific issue, portfolio, person, or department: it is exactly
 * as usable for any future issue with verified relationships as it is for
 * the one this batch actually populated (housing-affordability).
 *
 * Renders nothing (`null`) if no entry has a verified Issue↔Portfolio
 * relationship — the caller (src/app/issue/[id]/page.tsx) keeps its
 * existing honest "we haven't yet verified..." fallback text in that case,
 * unchanged. See RESPONSIBILITY_ENGINE_V1_FIRST_REAL_SLICE_REPORT.md §7.
 */

function dedupeEvidence(records: EvidenceRecord[]): EvidenceRecord[] {
  const seen = new Map<string, EvidenceRecord>()
  for (const record of records) {
    if (!seen.has(record.id)) seen.set(record.id, record)
  }
  return Array.from(seen.values())
}

/**
 * "N verified sources" only when every listed piece of evidence actually
 * qualifies as verified — otherwise states the split explicitly rather than
 * rounding a mixed set up to "verified". Every source is still listed by
 * `EvidenceSourceList` regardless of classification — this label never
 * hides a non-qualifying source, it only describes the mix accurately.
 */
function sourcesLabel(evidence: EvidenceRecord[]): string {
  const verifiedCount = evidence.filter(item => VERIFIED_CLASSIFICATIONS.has(item.classification)).length
  if (evidence.length === 0) return 'Sources'
  if (verifiedCount === evidence.length) {
    return `${verifiedCount} verified source${verifiedCount === 1 ? '' : 's'}`
  }
  return `${evidence.length} source${evidence.length === 1 ? '' : 's'} (${verifiedCount} verified)`
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function EvidenceSourceList({ evidence }: { evidence: EvidenceRecord[] }) {
  if (evidence.length === 0) {
    return <p className="text-body-copy text-muted-foreground">No verified data available.</p>
  }

  return (
    <ul className="space-y-2">
      {evidence.map(item => (
        <li key={item.id} className="text-sm leading-relaxed">
          {item.sourceUrl ? (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline hover:no-underline"
            >
              {item.title}
            </a>
          ) : (
            <span className="font-medium text-foreground">{item.title}</span>
          )}
          <span className="block text-metadata normal-case tracking-normal text-muted-foreground">
            {[
              item.publisher,
              item.sourcePublishedAt ? `Published ${formatDate(item.sourcePublishedAt)}` : `Retrieved ${formatDate(item.retrievedAt)}`,
              item.classification.replace(/_/g, ' '),
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function IssueResponsibilitySection({ graph }: { graph: IssueResponsibilityGraph }) {
  const verifiedEntries = selectVerifiedEntries(graph)

  if (verifiedEntries.length === 0) return null

  return (
    <div className="space-y-6">
      {verifiedEntries.map(entry => {
        const portfolio = entry.portfolio!.record
        const verifiedMinisters = entry.ministers.filter(minister => minister.isVerified)
        const verifiedDepartments = entry.departments.filter(department => department.isVerified)

        const allEvidence = dedupeEvidence([
          ...entry.issuePortfolio.evidence,
          ...entry.portfolio!.evidence,
          ...verifiedMinisters.flatMap(minister => minister.evidence),
          ...verifiedDepartments.flatMap(department => [...department.evidence, ...department.entityEvidence]),
        ])

        return (
          <div
            key={entry.issuePortfolio.record.id}
            className="rounded-[var(--radius)] border border-border p-4 space-y-4"
          >
            <div>
              <p className="text-micro-label mb-1">{JURISDICTION_LABELS[portfolio.jurisdiction]} portfolio</p>
              <p className="text-body-copy font-medium text-foreground">{portfolio.canonicalName}</p>
            </div>

            <div>
              <p className="text-micro-label mb-1">Minister</p>
              {verifiedMinisters.length > 0 ? (
                <div className="space-y-1">
                  {verifiedMinisters.map(minister => (
                    <p key={minister.record.id} className="text-body-copy text-foreground">
                      {minister.memberName ?? 'Unnamed representative'}
                      <span className="text-muted-foreground"> — {PERSON_ROLE_TYPE_LABELS[minister.record.roleType]}</span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-body-copy text-muted-foreground">No verified minister on record.</p>
              )}
            </div>

            <div>
              <p className="text-micro-label mb-1">Department</p>
              {verifiedDepartments.length > 0 ? (
                <div className="space-y-1">
                  {verifiedDepartments.map(department => (
                    <p key={department.record.id} className="text-body-copy text-foreground">
                      {department.record.canonicalName}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-body-copy text-muted-foreground">No verified department on record.</p>
              )}
            </div>

            <div>
              <p className="text-micro-label mb-1">Relationship</p>
              <p className="text-body-copy text-foreground">
                {RESPONSIBILITY_KIND_LABELS[entry.issuePortfolio.record.responsibilityKind]}
              </p>
            </div>

            <div>
              <p className="text-micro-label mb-1">{sourcesLabel(allEvidence)}</p>
              <EvidenceSourceList evidence={allEvidence} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
