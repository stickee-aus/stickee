import { NextRequest } from 'next/server'
import { ELECTORATE_MP_MAP } from '@/lib/mock-parliament-data'

// Coarse state bounding boxes: [minLat, maxLat, minLng, maxLng]
const STATE_BOUNDS: Record<string, [number, number, number, number]> = {
  NSW: [-37.5, -28.0, 141.0, 153.7],
  VIC: [-39.2, -33.9, 140.9, 150.0],
  QLD: [-29.2, -10.0, 138.0, 153.7],
  WA:  [-35.2, -13.7, 113.0, 129.5],
  SA:  [-38.1, -25.9, 129.0, 141.1],
  TAS: [-43.7, -39.5, 143.8, 148.6],
  ACT: [-35.9, -35.1, 148.7, 149.4],
  NT:  [-26.1, -10.9, 129.0, 138.1],
}

// Electorates grouped by state
const ELECTORATES_BY_STATE: Record<string, string[]> = {
  NSW: ['Grayndler', 'Barton', 'Watson', 'McMahon', 'Whitlam', 'Shortland', 'Hunter', 'Newcastle', 'Paterson', 'Dobell', 'Robertson', 'Macquarie', 'Eden-Monaro', 'Gilmore', 'Cunningham', 'Hughes', 'Macarthur', 'Werriwa', 'Reid', 'Chifley', 'Banks', 'Macnamara', 'Greenway', 'Blaxland', 'Parramatta', 'Sydney', 'Kingsford Smith', 'Bennelong', 'Richmond', 'Warringah', 'Wentworth', 'Mackellar', 'Bradfield', 'Calare'],
  VIC: ['Maribyrnong', 'Scullin', 'Dunkley', 'Bendigo', 'Corangamite', 'Aston', 'Isaacs', 'Holt', 'Bruce', 'Chisholm', 'Macnamara', 'Kooyong', 'Deakin', 'Gorton', 'Cooper', 'Wills', 'Ballarat', 'Jagajaga', 'Gellibrand', 'McEwen', 'Menzies', 'Hotham', 'Lalor', 'Fraser', 'Corio'],
  QLD: ['Moreton', 'Rankin', 'Griffith', 'Petrie', 'Bonner', 'Lilley', 'Brisbane', 'Dickson', 'Oxley', 'Blair', 'Forde', 'Leichhardt', 'Ryan'],
  WA:  ['Cowan', 'Moore', 'Perth', 'Burt', 'Hasluck', 'Brand', 'Tangney', 'Swan', 'Fremantle', 'Bullwinkel', 'Pearce', 'Curtin'],
  SA:  ['Spence', 'Hindmarsh', 'Sturt', 'Adelaide', 'Kingston', 'Boothby', 'Makin', 'Mayo'],
  TAS: ['Franklin', 'Bass', 'Braddon', 'Lyons', 'Clark'],
  ACT: ['Fenner', 'Canberra', 'Bean'],
  NT:  ['Solomon', 'Lingiari'],
}

function detectState(lat: number, lng: number): string | null {
  for (const [state, [minLat, maxLat, minLng, maxLng]] of Object.entries(STATE_BOUNDS)) {
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      return state
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { lat, lng } = body as Record<string, unknown>
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return Response.json({ error: 'lat and lng required' }, { status: 400 })
  }

  const state = detectState(lat, lng)
  if (!state) {
    return Response.json({ error: 'Location outside Australia' }, { status: 422 })
  }

  const stateElectorates = ELECTORATES_BY_STATE[state] ?? []
  // Find the first electorate in this state that's in our known MP map
  const known = stateElectorates.filter(e => ELECTORATE_MP_MAP[e])
  if (known.length === 0) {
    return Response.json({ error: 'No electorate found' }, { status: 404 })
  }

  // Return a deterministic electorate based on lat/lng (hash-based, not truly geographic)
  const idx = Math.abs(Math.round(lat * 100 + lng * 100)) % known.length
  return Response.json({ electorate: known[idx], state })
}
