import { getLiveElectionSnapshot } from '@/lib/aec-election'

export async function GET() {
  const snapshot = await getLiveElectionSnapshot()

  return Response.json(snapshot, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
    },
  })
}
