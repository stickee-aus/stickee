import type { Metadata } from 'next'
import { ParliamentExperienceClient } from '@/components/ParliamentExperienceClient'
import { getParliamentDBData } from '@/lib/parliament-db'

export const metadata: Metadata = {
  title: 'Parliament — Stickee',
  description: 'Track live bills, MP voting records, and public vs parliament alignment on the issues that matter to Australians.',
  openGraph: {
    title: 'Australian Parliament Tracker — Stickee',
    description: 'Live bills, swing votes, and MP alignment. See how your representative votes and take action.',
    type: 'website',
  },
}

export default async function ParliamentPage() {
  // Try to load real data from Supabase; fall back to mock data if DB is empty.
  const dbData = await getParliamentDBData().catch(() => null)

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* ── Header ── */}
      <div className="border-b border-border pb-8 mb-8">
        <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
          Australia · Federal Parliament
        </p>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1
              className="font-mono font-normal text-foreground mb-2"
              style={{ fontSize: 'clamp(36px, 6vw, 52px)', letterSpacing: '-0.02em', lineHeight: 1 }}
            >
              Parliament
            </h1>
            <p className="font-mono text-xs text-muted-foreground" style={{ letterSpacing: '0.03em' }}>
              Where public will meets parliamentary power
            </p>
          </div>
          <div className="flex items-end gap-6 pb-1">
            {[
              { value: '3',      label: 'Live Bills',    color: '#2ec266' },
              { value: '150',    label: 'MPs Tracked',   color: '#e8e8e6' },
              { value: '14,351', label: 'Campaigns',     color: '#e8e8e6' },
              { value: '74%',    label: 'Predict Acc.',  color: '#f5a623' },
            ].map(({ value, label, color }, i, arr) => (
              <div key={label} className="flex items-end gap-6">
                <div className="text-right">
                  <p className="font-mono text-lg font-normal mb-0.5" style={{ color }}>{value}</p>
                  <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>{label}</p>
                </div>
                {i < arr.length - 1 && <div className="w-px h-7 bg-border mb-0.5" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Full experience: bills → chamber → analysis → civic → simulator ── */}
      <ParliamentExperienceClient
        members={dbData?.members}
        memberIndex={dbData?.memberIndex}
        memberStates={dbData?.memberStates}
        electorateMPMap={dbData?.electorateMPMap}
        bills={dbData?.bills}
        voteMatrix={dbData?.voteMatrix}
      />

      {/* ── Footer note ── */}
      <p className="mt-10 text-center text-xs text-muted-foreground/60">
        {dbData
          ? 'Source: TheyVoteForYou · Parliament of Australia'
          : 'Source: Parliament of Australia. All data is illustrative and for demo purposes only.'}
      </p>
    </div>
  )
}
