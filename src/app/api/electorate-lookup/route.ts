import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function normalizePostcode(raw: unknown): string | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length !== 4) return null
  return digits
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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase
    .from('postcode_electorates')
    .select('postcode, electorate, state')
    .eq('postcode', postcode)
    .maybeSingle()

  if (error) {
    return Response.json({ error: 'Lookup failed' }, { status: 500 })
  }

  if (!data) {
    return Response.json({ error: 'Postcode not found' }, { status: 404 })
  }

  return Response.json(data)
}

// GET variant for simple URL-based lookups: /api/electorate-lookup?postcode=4114
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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase
    .from('postcode_electorates')
    .select('postcode, electorate, state')
    .eq('postcode', postcode)
    .maybeSingle()

  if (error) {
    return Response.json({ error: 'Lookup failed' }, { status: 500 })
  }

  if (!data) {
    return Response.json({ error: 'Postcode not found' }, { status: 404 })
  }

  return Response.json(data)
}
