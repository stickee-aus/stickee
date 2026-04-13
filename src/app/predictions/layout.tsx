import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Markets — Stickee',
  description: 'Predict whether bills will pass and civic scores will improve. Join Australia\'s civic prediction market and compete on the leaderboard.',
  openGraph: {
    title: 'Civic Prediction Markets — Stickee',
    description: 'Will housing improve? Will the bill pass? Trade civic outcomes and track your prediction accuracy.',
    type: 'website',
  },
}

export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
