'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, FileText, User, LayoutDashboard, Building2, Trophy,
  Landmark, X, Bell, Megaphone, ListChecks, TrendingUp, Users,
  Rss, ShieldAlert,
} from 'lucide-react'
import { dashboardRows } from '@/lib/mock-market-data'
import { MPs } from '@/lib/mock-data'
import { FEED_POSTS } from '@/lib/mock-feed-data'
import { MOCK_PROFILES } from '@/hooks/useFollows'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string
  label: string
  sublabel?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  group: string
  keywords?: string
}

// ─── Static nav items ─────────────────────────────────────────────────────────

const NAV_ITEMS: CommandItem[] = [
  { id: 'nav-home',          label: 'Dashboard',      href: '/',              icon: LayoutDashboard, group: 'Navigation' },
  { id: 'nav-feed',          label: 'Feed',            href: '/feed',          icon: Rss,             group: 'Navigation' },
  { id: 'nav-parliament',    label: 'Parliament',      href: '/parliament',    icon: Landmark,        group: 'Navigation' },
  { id: 'nav-government',    label: 'Decisions',       href: '/government',    icon: Building2,       group: 'Navigation' },
  { id: 'nav-issues',        label: 'Issues & Bills',  href: '/issues',        icon: ListChecks,      group: 'Navigation' },
  { id: 'nav-campaigns',     label: 'Campaigns',       href: '/campaigns',     icon: Megaphone,       group: 'Navigation' },
  { id: 'nav-predictions',   label: 'Predictions',     href: '/predictions',   icon: TrendingUp,      group: 'Navigation' },
  { id: 'nav-leaderboard',   label: 'Leaderboard',     href: '/leaderboard',   icon: Trophy,          group: 'Navigation' },
  { id: 'nav-notifications', label: 'Notifications',   href: '/notifications', icon: Bell,            group: 'Navigation' },
  { id: 'nav-profile',       label: 'My Profile',      href: '/profile',       icon: User,            group: 'Navigation' },
]

// ─── Campaign items ───────────────────────────────────────────────────────────

const CAMPAIGN_ITEMS: CommandItem[] = [
  { id: 'camp-rent', label: 'Freeze Rent Increases Campaign', sublabel: '8,241 joined · 82% to goal', href: '/campaigns', icon: Megaphone, group: 'Campaigns', keywords: 'rent housing' },
  { id: 'camp-bulk', label: 'Restore Bulk Billing Campaign', sublabel: '6,102 joined · 61% to goal', href: '/campaigns', icon: Megaphone, group: 'Campaigns', keywords: 'health medicare gp' },
  { id: 'camp-wage', label: 'Living Wage Now Campaign', sublabel: '4,891 joined · 49% to goal', href: '/campaigns', icon: Megaphone, group: 'Campaigns', keywords: 'wages economy jobs' },
  { id: 'camp-solar', label: 'Solar For Schools Campaign', sublabel: '3,210 joined · 32% to goal', href: '/campaigns', icon: Megaphone, group: 'Campaigns', keywords: 'climate energy future' },
]

// ─── Civic profiles ───────────────────────────────────────────────────────────

const PROFILE_ITEMS: CommandItem[] = Object.values(MOCK_PROFILES).map(p => ({
  id: `profile-${p.handle}`,
  label: p.displayName,
  sublabel: `@${p.handle} · ${p.electorate ?? ''}`,
  href: `/u/${p.handle}`,
  icon: Users,
  group: 'Civic Voices',
  keywords: p.topIssues?.join(' '),
}))

// ─── Build searchable items ────────────────────────────────────────────────────

function buildItems(): CommandItem[] {
  const bills: CommandItem[] = dashboardRows.map(row => ({
    id: `bill-${row.id}`,
    label: row.title,
    sublabel: `${row.probability}% · ${row.status}`,
    href: `/issue/${row.id}`,
    icon: FileText,
    group: 'Bills',
  }))

  // All MPs (not just 30)
  const mps: CommandItem[] = MPs.map(mp => ({
    id: `mp-${mp.id}`,
    label: mp.name,
    sublabel: `${mp.electorate} · ${mp.party}`,
    href: `/mp/${mp.id}`,
    icon: User,
    group: 'MPs',
    keywords: `${mp.party} ${mp.electorate}`.toLowerCase(),
  }))

  // Recent user posts
  const posts: CommandItem[] = FEED_POSTS
    .filter(p => p.type === 'user_post' || p.type === 'civic_alert')
    .slice(0, 15)
    .map(p => ({
      id: `post-${p.id}`,
      label: p.content.slice(0, 72) + (p.content.length > 72 ? '…' : ''),
      sublabel: `${p.authorName} · ${p.type === 'civic_alert' ? 'Alert' : 'Post'}`,
      href: `/feed?post=${p.id}`,
      icon: p.type === 'civic_alert' ? ShieldAlert : Rss,
      group: 'Feed',
    }))

  return [...NAV_ITEMS, ...bills, ...mps, ...CAMPAIGN_ITEMS, ...PROFILE_ITEMS, ...posts]
}

const ALL_ITEMS = buildItems()

// ─── CommandPalette ────────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_ITEMS.slice(0, 10)
    const q = query.toLowerCase()
    return ALL_ITEMS.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        item.sublabel?.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.keywords?.toLowerCase().includes(q)
    ).slice(0, 14)
  }, [query])

  const navigate = useCallback((href: string) => {
    router.push(href)
    setOpen(false)
  }, [router])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const item = filtered[activeIndex]
      if (item) navigate(item.href)
    }
  }

  // Group items for display
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    for (const item of filtered) {
      if (!groups[item.group]) groups[item.group] = []
      groups[item.group].push(item)
    }
    return Object.entries(groups)
  }, [filtered])

  if (!open) return null

  // Running index across groups for activeIndex tracking
  let runningIndex = 0

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0) }}
            onKeyDown={onKeyDown}
            placeholder="Search bills, MPs, campaigns, profiles…"
            aria-label="Search"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close command palette"
            className="text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-1.5" role="listbox">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results found</p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {group}
                </p>
                {items.map(item => {
                  const idx = runningIndex++
                  const isActive = idx === activeIndex
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-primary/10 text-foreground' : 'text-foreground/80 hover:bg-muted/40'
                      }`}
                    >
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-primary/20' : 'bg-muted/40'
                      }`}>
                        <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-border/40 px-4 py-2">
          <span className="text-[10px] text-muted-foreground/60">
            <kbd className="rounded bg-muted px-1 py-0.5 text-[9px] font-mono">↑↓</kbd> navigate
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            <kbd className="rounded bg-muted px-1 py-0.5 text-[9px] font-mono">↵</kbd> open
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            <kbd className="rounded bg-muted px-1 py-0.5 text-[9px] font-mono">esc</kbd> close
          </span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground/40">
            {ALL_ITEMS.length} items indexed
          </span>
        </div>
      </div>
    </div>
  )
}
