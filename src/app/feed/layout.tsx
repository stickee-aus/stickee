import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Political Pulse — Stickee',
  description: 'A chronological, sourced record of what changed in Australian civic life — Parliament votes, bill stages, and forecast resolutions.',
  openGraph: {
    title: 'Political Pulse — Stickee',
    description: 'What changed across Australian civic life? A dated, sourced stream of real Parliament and bill-stage events.',
    type: 'website',
  },
}

export default function PoliticalPulseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
