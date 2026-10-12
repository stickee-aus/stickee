import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Community profile — Stickee',
  description: 'Verified Stickee community profiles.',
}

export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-micro-label">Community profile</p>
      <h1 className="font-serif text-3xl font-semibold text-foreground">Profile not available</h1>
      <p className="text-body-copy text-muted-foreground">
        @{handle} does not have a verified public profile. Demo identities, scores, follower counts and activity are not shown.
      </p>
      <Link href="/" className="text-micro-label border-b border-current pb-1">
        Back to overview
      </Link>
    </main>
  )
}
