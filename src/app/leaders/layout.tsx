import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'People — Stickee',
  description: 'Who represents Australians, what they\'re responsible for, and how to find your own MP.',
  openGraph: {
    title: 'People — Stickee',
    description: 'Who represents Australians, what they\'re responsible for, and how to find your own MP.',
    type: 'website',
  },
}

export default function LeadersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
