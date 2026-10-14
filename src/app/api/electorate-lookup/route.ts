import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function normalizePostcode(raw: unknown): string | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length !== 4) return null
  return digits
}

async function lookup(postcode: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return Response.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  const { data: seats, error: seatsError } = await supabase
    .from('postcode_electorates')
    .select('postcode, electorate, state')
    .eq('postcode', postcode)

  if (seatsError) {
    console.error('postcode lookup error', seatsError)
    return Response.json({ error: 'Lookup failed' }, { status: 500 })
  }

  if (!seats || seats.length === 0) {
    return Response.json({ error: 'Postcode not found' }, { status: 404 })
  }

  if (seats.length === 1) {
    return Response.json(seats[0])
  }

  // Multi-seat: also fetch localities so the UI can ask for suburb
  const { data: localities } = await supabase
    .from('postcode_localities')
    .select('locality, electorate')
    .eq('postcode', postcode)
    .order('locality')

  return Response.json({
    postcode,
    state: seats[0].state,
    electorates: seats.map(r => r.electorate),
    localities: localities ?? [],
    multiple: true,
  })
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const postcode = normalizePostcode((body as Record<string, unknown>).postcode)
  if (!postcode) {
    return Response.json(
      { error: 'postcode required (4 digits)' },
      { status: 400 }
    )
  }

  return lookup(postcode)
}

export async function GET(request: NextRequest) {
  const postcode = normalizePostcode(
    request.nextUrl.searchParams.get('postcode')
  )
  if (!postcode) {
    return Response.json(
      { error: 'postcode required (4 digits)' },
      { status: 400 }
    )
  }

  return lookup(postcode)
}
