'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import type { User } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const configured = !!(SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http'))

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const auth = useAuthStatus()

  useEffect(() => {
    if (!configured) return

    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (!configured) return null

  if (user) {
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
