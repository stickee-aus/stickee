import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface OnboardingPayload {
  electorate?: unknown
  topIssues?: unknown
  firstAction?: unknown
  source?: unknown
}

function cleanText(value: unknown, maxLength = 80) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
}

function cleanIssues(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 3)
}

export async function POST(request: Request) {
  let payload: OnboardingPayload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ saved: false, reason: 'anonymous' })
  }

  const electorate = cleanText(payload.electorate)
  const topIssues = cleanIssues(payload.topIssues)
  const firstAction = cleanText(payload.firstAction, 40)
  const source = cleanText(payload.source, 40) ?? 'modal'

  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      electorate,
      top_issues: topIssues,
      onboarding_completed_at: new Date().toISOString(),
      onboarding_first_action: firstAction,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  await supabase.from('onboarding_events').insert({
    user_id: user.id,
    electorate,
    top_issues: topIssues,
    first_action: firstAction,
    source,
  })

  return NextResponse.json({ saved: true })
}
