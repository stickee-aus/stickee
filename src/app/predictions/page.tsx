import { PredictionsPageClient } from '@/components/PredictionsPageClient'
import { getLiveBillMarkets } from '@/lib/predictions-db'

export default async function PredictionsPage() {
  const initialBillMarkets = await getLiveBillMarkets()

  return <PredictionsPageClient initialBillMarkets={initialBillMarkets} />
}
