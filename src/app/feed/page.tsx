import { PoliticalPulseClient } from '@/components/PoliticalPulseClient'
import { getChronologicalPulse } from '@/lib/feed/pulse-data'

export default async function PoliticalPulsePage() {
  const data = await getChronologicalPulse()

  return <PoliticalPulseClient events={data.events} source={data.source} />
}
