import type { ReactNode } from 'react'
import Link from 'next/link'
import { ShieldAlert, LayoutDashboard, Users, Activity, BarChart3, Bot, LineChart } from 'lucide-react'
import { getAdminUser } from './_lib/guard'

const NAV = [
  { href: '/admin', label: 'Overview', Icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', Icon: Users },
  { href: '/admin/activity', label: 'Activity', Icon: Activity },
  { href: '/admin/agents', label: 'Agents', Icon: Bot },
  { href: '/admin/markets', label: 'Markets', Icon: LineChart },
  { href: '/admin/analytics', label: 'Analytics', Icon: BarChart3 },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin } = await getAdminUser()

  if (!user) {
    return (
      <div className="px-6 py-16">
        <div className="mx-auto max-w-xl border border-border p-6">
          <ShieldAlert className="h-6 w-6 text-muted-foreground" />
          <h1 className="mt-5 font-mono text-xl text-foreground">Sign in required</h1>
          <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
            You need to sign in to access the admin dashboard.
          </p>
          <Link
            href="/auth/sign-in?next=/admin"
            className="mt-6 inline-block font-mono text-[10px] uppercase tracking-widest text-foreground hover:underline"
          >
            Sign in →
          </Link>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="px-6 py-16">
        <div className="mx-auto max-w-xl border border-border p-6">
          <ShieldAlert className="h-6 w-6 text-muted-foreground" />
          <h1 className="mt-5 font-mono text-xl text-foreground">Admin access required</h1>
          <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
            Your account ({user.email}) is signed in but has not been added to the Stickee admin list.
          </p>
          <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
            User ID: <span className="text-foreground">{user.id}</span>
          </p>
          <Link
            href="/"
            className="mt-6 inline-block font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Back to overview
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            Admin
          </p>
          <nav className="space-y-1">
            {NAV.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2 font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors border border-transparent hover:border-border"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
          <p className="mt-8 font-mono text-[10px] text-muted-foreground">
            Signed in as<br />
            <span className="text-foreground">{user.email}</span>
          </p>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
