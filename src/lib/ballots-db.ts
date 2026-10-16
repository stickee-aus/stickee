import { createServerSupabaseClient } from '@/lib/supabase-server'

export interface BallotItem {
  id: string
  ballot_id: string
  rank: number
  issue_id: string | null
  position_text: string
  weight: number
  created_at: string
}

export interface Ballot {
  id: string
  user_id: string
  title: string
  is_public: boolean
  created_at: string
  updated_at: string
  items: BallotItem[]
}

export async function getBallotById(ballotId: string): Promise<Ballot | null> {
  const supabase = await createServerSupabaseClient()
  const { data: ballot, error } = await supabase
    .from('ballots')
    .select('id, user_id, title, is_public, created_at, updated_at')
    .eq('id', ballotId)
    .maybeSingle()

  if (error || !ballot) return null

  const { data: items } = await supabase
    .from('ballot_items')
    .select('id, ballot_id, rank, issue_id, position_text, weight, created_at')
    .eq('ballot_id', ballotId)
    .order('rank', { ascending: true })

  return { ...ballot, items: items ?? [] }
}

export async function getPublicBallots(limit = 20): Promise<Ballot[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('ballots')
    .select('id, user_id, title, is_public, created_at, updated_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  const ballots = data as Omit<Ballot, 'items'>[]
  const ids = ballots.map(b => b.id)
  if (ids.length === 0) return []

  const { data: items } = await supabase
    .from('ballot_items')
    .select('id, ballot_id, rank, issue_id, position_text, weight, created_at')
    .in('ballot_id', ids)
    .order('rank', { ascending: true })

  const itemsByBallot = new Map<string, BallotItem[]>()
  for (const item of items ?? []) {
    const list = itemsByBallot.get(item.ballot_id) ?? []
    list.push(item)
    itemsByBallot.set(item.ballot_id, list)
  }

  return ballots.map(b => ({ ...b, items: itemsByBallot.get(b.id) ?? [] }))
}

export async function getMyBallots(userId: string): Promise<Ballot[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('ballots')
    .select('id, user_id, title, is_public, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  const ballots = data as Omit<Ballot, 'items'>[]
  const ids = ballots.map(b => b.id)
  if (ids.length === 0) return []

  const { data: items } = await supabase
    .from('ballot_items')
    .select('id, ballot_id, rank, issue_id, position_text, weight, created_at')
    .in('ballot_id', ids)
    .order('rank', { ascending: true })

  const itemsByBallot = new Map<string, BallotItem[]>()
  for (const item of items ?? []) {
    const list = itemsByBallot.get(item.ballot_id) ?? []
    list.push(item)
    itemsByBallot.set(item.ballot_id, list)
  }

  return ballots.map(b => ({ ...b, items: itemsByBallot.get(b.id) ?? [] }))
}
