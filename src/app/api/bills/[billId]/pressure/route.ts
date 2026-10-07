import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ billId: string }> }
) {
  const { billId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { stance, actionType, electorate, sessionId } = body as Record<string, unknown>

  if (stance !== 'support' && stance !== 'oppose') {
    return Response.json({ error: 'stance must be support or oppose' }, { status: 400 })
  }

  const validActionTypes = ['stance', 'email', 'share', 'campaign']
  const resolvedAction = validActionTypes.includes(actionType as string) ? actionType : 'stance'

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const record = {
    bill_id:     billId,
    stance:      stance as string,
    action_type: resolvedAction as string,
    electorate:  typeof electorate === 'string' && electorate.trim() ? electorate.trim() : null,
    user_id:     user?.id ?? null,
    session_id:  !user && typeof sessionId === 'string' && sessionId ? sessionId : null,
  }

  // Upsert: update stance/action if they've already recorded one for this bill
  const { error } = await supabase
    .from('bill_pressures')
    .upsert(record, {
      onConflict: user ? 'bill_id,user_id' : 'bill_id,session_id',
    })

  if (error) {
    console.error('bill_pressures upsert error:', error)
    return Response.json({ error: 'Failed to record pressure' }, { status: 500 })
  }

  return Response.json({ ok: true }, { status: 201 })
}
