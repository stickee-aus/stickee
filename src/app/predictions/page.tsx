import { PredictionsPageClient } from '@/components/PredictionsPageClient'
import { getLiveBillMarkets } from '@/lib/predictions-db'
import { getIssuesPageData } from '@/lib/issues-db'

export default async function PredictionsPage() {
  const [initialBillMarkets, issuesPageData] = await Promise.all([
    getLiveBillMarkets(),
    getIssuesPageData(),
  ])

  // "Why this matters" on a forecast row only ever comes from a real issue's
  // own editorial summary — never generated. Only issues with a non-empty
  // summary are included; everything else omits the field.
  const issueSummaries: Record<string, string> = Object.fromEntries(
    issuesPageData.issues
      .filter(issue => issue.summary && issue.summary.trim().length > 0)
      .map(issue => [issue.id, issue.summary.trim()])
  )

  return (
    <PredictionsPageClient
      initialBillMarkets={initialBillMarkets}
      issueSummaries={issueSummaries}
    />
  )
}
