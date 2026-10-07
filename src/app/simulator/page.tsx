import type { Metadata } from 'next'
import { SimulatorClient } from './SimulatorClient'

export const metadata: Metadata = {
  title: 'Simulator · Stickee',
  description:
    'A MiroFish-inspired multi-agent prediction sandbox. Compare alternative responses to real Australian events across markets, civic pillars, leaders and geopolitics, then pick the best decision for the country.',
  openGraph: {
    title: 'Stickee Simulator — Rehearse the future',
    description:
      'Multi-agent simulation across markets, issues, leaders and geopolitics. Compare alternatives side-by-side and pick the best decision for Australia.',
    type: 'website',
  },
}

export default function SimulatorPage() {
  return <SimulatorClient />
}
