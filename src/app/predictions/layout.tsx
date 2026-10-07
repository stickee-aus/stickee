import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forecasts — Stickee',
  description: 'See the crowd\'s forecast on whether bills will pass and civic scores will improve, and add your own prediction.',
  openGraph: {
    title: 'Forecasts — Stickee',
    description: 'Will housing improve? Will the bill pass? See Australia\'s crowd-forecasted civic outcomes.',
    type: 'website',
  },
}

export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
