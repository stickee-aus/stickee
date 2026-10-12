'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import { isSupabaseConfigured } from '@/lib/supabase-config'

const configured = isSupabaseConfigured

export function AuthButton() {
  const router = useRouter()
  const auth = useAuthStatus()

  if (!configured) return null
  if (!auth.hydrated) return null

  if (auth.authenticated) {
    return (
      <>
        {auth.isAdmin && (
          <Link
            href="/admin"
            className="font-mono text-[10px] font-medium tracking-widest uppercase text-muted-foreground transition-colors hover:text-foreground"
          >
            Admin
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            await auth.refresh()
            router.refresh()
          }}
        >
          Sign out
        </Button>
      </>
    )
  }

  return (
    <Link href="/auth/sign-in">
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        Sign in
      </Button>
    </Link>
  )
}
