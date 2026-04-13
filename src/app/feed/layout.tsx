import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feed — Stickee',
  description: 'Live civic alerts, decision updates, and community perspectives on Australian democracy. High-impact voices boosted automatically.',
  openGraph: {
    title: 'Civic Feed — Stickee',
    description: 'Real-time alerts when civic scores move, bills progress, and markets shift. Plus community voices from across Australia.',
    type: 'website',
  },
}

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
