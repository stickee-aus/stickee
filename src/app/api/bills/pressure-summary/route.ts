import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isSupabaseConfigured } from '@/lib/supabase-config'

export interface PressureSummary {
  billId: string
  total: number
  today: number
  support: number
  oppose: number
  byElectorate: { electorate: string; count: number }[]
}

export async function GET() {
  if (!isSupabaseConfigured) return Response.json([])

  const supabase = await createServerSupabaseClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('bill_pressures')
    .select('bill_id, stance, electorate, created_at')

  if (error) {
    console.error('pressure-summary fetch error:', error)
    return Response.json({ error: 'Failed to load pressure data' }, { status: 500 })
  }

  // Aggregate in-process — table will be small for now
  const map: Record<string, PressureSummary> = {}

  for (const row of data ?? []) {
    if (!map[row.bill_id]) {
      map[row.bill_id] = { billId: row.bill_id, total: 0, today: 0, support: 0, oppose: 0, byElectorate: [] }
    }
    const s = map[row.bill_id]
    s.total++
    if (row.stance === 'support') s.support++
    else s.oppose++
    if (new Date(row.created_at) >= todayStart) s.today++
  }

  // Build electorate breakdown per bill
  const electorateMap: Record<string, Record<string, number>> = {}
  for (const row of data ?? []) {
    if (!row.electorate) continue
    if (!electorateMap[row.bill_id]) electorateMap[row.bill_id] = {}
    electorateMap[row.bill_id][row.electorate] = (electorateMap[row.bill_id][row.electorate] ?? 0) + 1
  }

  for (const billId of Object.keys(map)) {
    const electorateCounts = electorateMap[billId] ?? {}
    map[billId].byElectorate = Object.entries(electorateCounts)
      .map(([electorate, count]) => ({ electorate, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  return Response.json(Object.values(map))
}
