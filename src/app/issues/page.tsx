import { IssuesPageClient } from '@/components/IssuesPageClient'
import { getIssuesPageData } from '@/lib/issues-db'

export default async function IssuesPage() {
  const data = await getIssuesPageData()

  return <IssuesPageClient issues={data.issues} markets={data.markets} />
}
