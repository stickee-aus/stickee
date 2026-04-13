import { getMPVoteForBill } from '@/lib/mock-parliament-data'
import type { BillVoteRow } from '@/lib/mock-parliament-data'
import type { MP } from '@/types'

export interface AlignmentScore {
  agree: number
  disagree: number
  total: number
  pct: number | null   // null if no positions taken yet
  label: 'strong' | 'moderate' | 'low' | 'unknown'
  colorClass: string   // Tailwind text class
}

export function computeAlignmentScore(
  mp: MP,
  bills: BillVoteRow[],
  campaigns: Record<string, 'support' | 'oppose'>,
  voteMatrix?: Record<string, Record<string, 'for' | 'against' | 'absent'>>
): AlignmentScore {
  let agree = 0
  let disagree = 0

  for (const bill of bills) {
    const userStance = campaigns[bill.id]
    if (!userStance) continue

    const mpVote = voteMatrix?.[bill.id]?.[mp.id] ?? getMPVoteForBill(mp.id, bill.id)
    if (mpVote === 'absent') continue

    const userWantsFor = userStance === 'support'
    const mpVotedFor = mpVote === 'for'

    if (userWantsFor === mpVotedFor) {
      agree++
    } else {
      disagree++
    }
  }

  const total = agree + disagree

  if (total === 0) {
    return { agree: 0, disagree: 0, total: 0, pct: null, label: 'unknown', colorClass: 'text-muted-foreground' }
  }

  const pct = Math.round((agree / total) * 100)

  let label: AlignmentScore['label']
  let colorClass: string

  if (pct >= 70) {
    label = 'strong'
    colorClass = 'text-emerald-400'
  } else if (pct >= 40) {
    label = 'moderate'
    colorClass = 'text-amber-400'
  } else {
    label = 'low'
    colorClass = 'text-red-400'
  }

  return { agree, disagree, total, pct, label, colorClass }
}
