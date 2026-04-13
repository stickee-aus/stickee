import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LEADER_INDEX } from '@/lib/mock-leaders-data'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 1. Verify leader exists and is approved
  const leader = LEADER_INDEX[id]
  if (!leader || leader.nomination.moderationStatus !== 'approved') {
    return Response.json({ error: 'Leader not found' }, { status: 404 })
  }

  // 2. Verify leader has consented to support
  if (!leader.nomination.consentGiven) {
    return Response.json({ error: 'Leader has not consented to support' }, { status: 403 })
  }

  // 3. Auth check
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  // 4. Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { supportTypes, skills, availability, postcode, state, isPublic } =
    body as Record<string, unknown>

  if (!Array.isArray(supportTypes) || supportTypes.length === 0) {
    return Response.json({ error: 'At least one support type is required' }, { status: 400 })
  }

  // 5. Insert — unique index enforces one support per user per leader
  const { error: insertError } = await supabase
    .from('leader_supports')
    .insert({
      leader_id:    id,
      user_id:      user.id,
      support_types: supportTypes,
      skills:       Array.isArray(skills) ? skills : [],
      availability: typeof availability === 'string' ? availability : null,
      postcode:     typeof postcode === 'string' && postcode.length === 4 ? postcode : null,
      state:        typeof state === 'string' ? state : null,
      is_public:    typeof isPublic === 'boolean' ? isPublic : true,
    })

  if (insertError) {
    if (insertError.code === '23505') {
      return Response.json({ error: 'Already supported' }, { status: 409 })
    }
    console.error('leader_supports insert error:', insertError)
    return Response.json({ error: 'Failed to record support' }, { status: 500 })
  }

  return Response.json({ ok: true }, { status: 201 })
}
