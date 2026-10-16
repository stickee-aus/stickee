'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export interface BallotItemInput {
  issueId: string
  positionText: string
  weight: number
}

export interface CreateBallotInput {
  title: string
  isPublic: boolean
  items: BallotItemInput[]
}

/**
 * Creates a ballot, inserts ranked items, and auto-seeds a market from the
 * top-ranked item by calling place_wallet_stake for an opening YES position.
 * The seeded market lives in issue_markets (migration 017 substrate) with
 * ballot_id linking back here (migration 027).
 */
export async function createBallot(input: CreateBallotInput): Promise<{
  ballotId: string
  seededMarketId: string | null
  error: string | null
}> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ballotId: '', seededMarketId: null, error: 'Sign in to build a ballot.' }
  }

  const title = input.title.trim()
  if (!title) {
    return { ballotId: '', seededMarketId: null, error: 'Title is required.' }
  }
  if (!input.items || input.items.length === 0) {
    return { ballotId: '', seededMarketId: null, error: 'Add at least one ranked item.' }
  }
  if (input.items.length > 10) {
    return { ballotId: '', seededMarketId: null, error: 'Maximum ten ranked items.' }
  }

  for (const item of input.items) {
    if (!item.issueId?.trim()) {
      return { ballotId: '', seededMarketId: null, error: 'Every item needs an issue.' }
    }
    if (!item.positionText?.trim()) {
      return { ballotId: '', seededMarketId: null, error: 'Every item needs a position.' }
    }
    if (item.weight < 1 || item.weight > 10) {
      return { ballotId: '', seededMarketId: null, error: 'Weight must be between 1 and 10.' }
    }
  }

  // ── 1. Insert ballot ──────────────────────────────────────────────────────
  const { data: ballot, error: ballotError } = await supabase
    .from('ballots')
    .insert({ user_id: user.id, title, is_public: input.isPublic })
    .select('id')
    .single()

  if (ballotError || !ballot) {
    return { ballotId: '', seededMarketId: null, error: ballotError?.message ?? 'Failed to create ballot.' }
  }

  const ballotId = ballot.id as string

  // ── 2. Insert ranked items ────────────────────────────────────────────────
  const itemRows = input.items.map((item, index) => ({
    ballot_id: ballotId,
    rank: index + 1,
    issue_id: item.issueId.trim(),
    position_text: item.positionText.trim(),
    weight: item.weight,
  }))

  const { error: itemsError } = await supabase.from('ballot_items').insert(itemRows)
  if (itemsError) {
    // Best-effort cleanup of the orphan ballot row.
    await supabase.from('ballots').delete().eq('id', ballotId)
    return { ballotId: '', seededMarketId: null, error: itemsError.message }
  }

  // ── 3. Auto-seed a market from the top-ranked item ─────────────────────────
  const top = input.items[0]
  let seededMarketId: string | null = null

  try {
    // Ensure the user has a wallet row (place_wallet_stake requires one).
    await supabase.from('user_wallets').upsert({ user_id: user.id }, { onConflict: 'user_id' })

    const marketId = `ballot-${ballotId.slice(0, 8)}`
    const question = `Based on this ballot's top priority — ${top.positionText.trim()} — will this position hold by end of 2026?`
    const resolvesBy = new Date(Date.now() + 1000 * 60 * 60 * 24 * 75).toISOString()

    const { error: marketError } = await supabase.from('issue_markets').insert({
      issue_id: marketId,
      question,
      category: 'civic',
      status: 'active',
      probability: 50,
      total_participants: 0,
      resolves_by: resolvesBy,
      yes_volume: 0,
      no_volume: 0,
      resolution_source: 'Stickee ballot resolution — admin-confirmed against public record.',
      ballot_id: ballotId,
      is_test_fixture: false,
    })

    if (!marketError) {
      seededMarketId = marketId
      // Opening YES stake of 100 pts at 50% — the ballot author's own skin in the game.
      await supabase.rpc('place_wallet_stake', {
        p_market_id: marketId,
        p_market_question: question,
        p_category: 'civic',
        p_direction: 'yes',
        p_amount: 100,
        p_price: 50,
      })
    }
  } catch {
    // Seeding is best-effort; the ballot itself is the primary artifact.
  }

  revalidatePath('/ballots')
  revalidatePath('/predictions')
  return { ballotId, seededMarketId, error: null }
}
