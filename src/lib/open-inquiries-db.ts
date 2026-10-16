import { createServerSupabaseClient } from '@/lib/supabase-server'

export interface OpenInquiry {
  id: string
  aph_id: string
  title: string
  committee: string
  closes_on: string
  url: string
  seeded_at: string
  updated_at: string
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  const diff = target.getTime() - today.getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

export function formatCountdown(days: number): string {
  if (days < 0) return 'Closed'
  if (days === 0) return 'Closes today'
  if (days === 1) return 'Closes tomorrow'
  return `Closes in ${days} days`
}

export async function getOpenInquiries(): Promise<OpenInquiry[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('open_inquiries')
      .select('id, aph_id, title, committee, closes_on, url, seeded_at, updated_at')
      .gte('closes_on', new Date().toISOString().slice(0, 10))
      .order('closes_on', { ascending: true })
      .limit(5)

    if (error || !data) return []
    return data as OpenInquiry[]
  } catch {
    return []
  }
}

export { daysUntil }
