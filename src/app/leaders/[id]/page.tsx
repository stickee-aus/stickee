import { notFound } from 'next/navigation'
import { LEADER_INDEX } from '@/lib/mock-leaders-data'
import { LeaderProfileDetail } from '@/components/LeaderProfileDetail'

export default async function LeaderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const leader = LEADER_INDEX[id]

  if (!leader || leader.nomination.moderationStatus !== 'approved') {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <LeaderProfileDetail leader={leader} />
    </div>
  )
}

export function generateStaticParams() {
  return Object.entries(LEADER_INDEX)
    .filter(([, l]) => l.nomination.moderationStatus === 'approved')
    .map(([id]) => ({ id }))
}
