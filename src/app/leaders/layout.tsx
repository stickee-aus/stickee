import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leaders — Stickee',
  description: 'Track sitting MPs ranked by civic score and discover Australia\'s rising civic leaders across housing, environment, healthcare, and more.',
  openGraph: {
    title: 'Civic Leaders — Stickee',
    description: 'Sitting MPs ranked by performance. Rising community leaders working their way into Australian politics.',
    type: 'website',
  },
}

export default function LeadersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
