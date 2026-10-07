import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Government — Stickee',
  description: 'Verified executive-decision records are being prepared. See Parliament for the real, sourced parliamentary record.',
  openGraph: {
    title: 'Government — Stickee',
    description: 'Verified executive-decision records are being prepared. See Parliament for the real, sourced parliamentary record.',
    type: 'website',
  },
}

export default function DecisionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
