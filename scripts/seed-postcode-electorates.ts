/**
 * Seed postcode_electorates from AEC locality data.
 *
 * Source: AEC "Locality to Electorate" dataset
 * https://www.aec.gov.au/profiles/localities/
 *
 * Run: npx tsx scripts/seed-postcode-electorates.ts
 * Re-run yearly after redistributions.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// AEC locality-to-electorate mappings.
// Format: [postcode, electorate, state]
// This is a representative sample — the full file has ~17,000 localities.
// Download the complete CSV from the AEC and replace this array.
const AEC_LOCALITIES: [string, string, string][] = [
  // QLD — South East Queensland
  ['4077', 'Oxley', 'QLD'],
  ['4078', 'Oxley', 'QLD'],
  ['4101', 'Moreton', 'QLD'],
  ['4102', 'Moreton', 'QLD'],
  ['4103', 'Moreton', 'QLD'],
  ['4104', 'Moreton', 'QLD'],
  ['4105', 'Moreton', 'QLD'],
  ['4106', 'Moreton', 'QLD'],
  ['4107', 'Moreton', 'QLD'],
  ['4108', 'Moreton', 'QLD'],
  ['4109', 'Moreton', 'QLD'],
  ['4110', 'Moreton', 'QLD'],
  ['4111', 'Moreton', 'QLD'],
  ['4112', 'Moreton', 'QLD'],
  ['4113', 'Moreton', 'QLD'],
  ['4114', 'Moreton', 'QLD'],
  ['4115', 'Moreton', 'QLD'],
  ['4116', 'Moreton', 'QLD'],
  ['4117', 'Moreton', 'QLD'],
  ['4118', 'Moreton', 'QLD'],
  ['4119', 'Moreton', 'QLD'],
  ['4120', 'Moreton', 'QLD'],
  ['4121', 'Moreton', 'QLD'],
  ['4122', 'Moreton', 'QLD'],
  ['4123', 'Moreton', 'QLD'],
  ['4124', 'Moreton', 'QLD'],
  ['4125', 'Moreton', 'QLD'],
  ['4127', 'Moreton', 'QLD'],
  ['4128', 'Moreton', 'QLD'],
  ['4129', 'Moreton', 'QLD'],
  ['4130', 'Moreton', 'QLD'],
  ['4131', 'Moreton', 'QLD'],
  ['4132', 'Moreton', 'QLD'],
  ['4133', 'Moreton', 'QLD'],
  ['4151', 'Bonner', 'QLD'],
  ['4152', 'Bonner', 'QLD'],
  ['4153', 'Bonner', 'QLD'],
  ['4154', 'Bonner', 'QLD'],
  ['4155', 'Bonner', 'QLD'],
  ['4156', 'Bonner', 'QLD'],
  ['4157', 'Bonner', 'QLD'],
  ['4158', 'Bonner', 'QLD'],
  ['4159', 'Bonner', 'QLD'],
  ['4160', 'Bonner', 'QLD'],
  ['4161', 'Bonner', 'QLD'],
  ['4163', 'Bonner', 'QLD'],
  ['4164', 'Bonner', 'QLD'],
  ['4165', 'Bonner', 'QLD'],
  ['4169', 'Bonner', 'QLD'],
  ['4170', 'Bonner', 'QLD'],
  ['4171', 'Bonner', 'QLD'],
  ['4172', 'Bonner', 'QLD'],
  ['4173', 'Bonner', 'QLD'],
  ['4174', 'Bonner', 'QLD'],
  ['4178', 'Bonner', 'QLD'],
  ['4179', 'Bonner', 'QLD'],
  ['4207', 'Forde', 'QLD'],
  ['4208', 'Forde', 'QLD'],
  ['4209', 'Forde', 'QLD'],
  ['4210', 'Forde', 'QLD'],
  ['4211', 'Forde', 'QLD'],
  ['4212', 'Forde', 'QLD'],
  ['4213', 'Forde', 'QLD'],
  ['4214', 'Forde', 'QLD'],
  ['4215', 'Forde', 'QLD'],
  ['4216', 'Forde', 'QLD'],
  ['4217', 'Forde', 'QLD'],
  ['4218', 'Forde', 'QLD'],
  ['4219', 'Forde', 'QLD'],
  ['4220', 'Forde', 'QLD'],
  ['4221', 'Forde', 'QLD'],
  ['4222', 'Forde', 'QLD'],
  ['4223', 'Forde', 'QLD'],
  ['4224', 'Forde', 'QLD'],
  ['4225', 'Forde', 'QLD'],
  ['4226', 'Forde', 'QLD'],
  ['4227', 'McPherson', 'QLD'],
  ['4228', 'McPherson', 'QLD'],
  ['4229', 'McPherson', 'QLD'],
  ['4230', 'McPherson', 'QLD'],
]

async function main() {
  const rows = AEC_LOCALITIES.map(([postcode, electorate, state]) => ({
    postcode,
    electorate,
    state,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('postcode_electorates')
    .upsert(rows, { onConflict: 'postcode' })

  if (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }

  console.log(`Seeded ${rows.length} postcode-electorate mappings`)
}

main()
