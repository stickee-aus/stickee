import type { LucideIcon } from 'lucide-react'
import { Home, FileText, Landmark, TrendingUp, Users } from 'lucide-react'

// ─── Canonical primary navigation ──────────────────────────────────────────────
//
// Single source of truth for Stickee's five approved top-level sections, used by
// Navbar (desktop), BottomNav (mobile) and CommandPalette so all three agree on
// label, destination and active-state logic. See PAGE_REFACTOR_BATCH_2_REPORT.md.
//
// Forecasts and People currently point at legacy routes (/predictions,
// /leaders) as an interim step — the final /forecasts and /people route
// structure is a later batch's work (PROPOSED_ROUTE_TREE.md). Do not treat
// these hrefs as final destinations.
//
// Government points at /parliament, not /decisions: /decisions renders
// mock-government-data.ts, a 100% fictional decision record with fabricated
// engagement fields and no source field anywhere in its type. /parliament is
// the real, Supabase-backed parliamentary record. See
// STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md.

export type PrimaryNavId = 'today' | 'issues' | 'government' | 'forecasts' | 'people'

export interface PrimaryNavItem {
  id: PrimaryNavId
  label: string
  href: string
  icon: LucideIcon
  /**
   * Extra path prefixes (beyond `href` itself) that should mark this item
   * active — e.g. Government also activates for /parliament even though its
   * href is /decisions.
   */
  activePrefixes: string[]
}

export const PRIMARY_NAV: PrimaryNavItem[] = [
  {
    id: 'today',
    label: 'Today',
    href: '/',
    icon: Home,
    activePrefixes: [],
  },
  {
    id: 'issues',
    label: 'Issues',
    href: '/issues',
    icon: FileText,
    activePrefixes: ['/issue'], // singular /issue/[id] detail route
  },
  {
    id: 'government',
    label: 'Government',
    href: '/parliament', // real parliamentary record — see comment above re: /decisions
    icon: Landmark,
    activePrefixes: ['/government', '/decisions'],
  },
  {
    id: 'forecasts',
    label: 'Forecasts',
    href: '/predictions', // temporary — route renames to /forecasts in a later batch
    icon: TrendingUp,
    activePrefixes: [],
  },
  {
    id: 'people',
    label: 'People',
    href: '/leaders', // temporary — route renames to /people in a later batch
    icon: Users,
    activePrefixes: ['/mp'],
  },
]

/** True if `pathname` should mark this primary nav item as the active section. */
export function isPrimaryNavItemActive(item: PrimaryNavItem, pathname: string): boolean {
  if (item.href === '/') return pathname === '/'
  const prefixes = [item.href, ...item.activePrefixes]
  return prefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/** The primary nav item (if any) active for a given pathname. */
export function activePrimaryNavId(pathname: string): PrimaryNavId | null {
  const match = PRIMARY_NAV.find(item => isPrimaryNavItemActive(item, pathname))
  return match?.id ?? null
}

// ─── Secondary navigation ───────────────────────────────────────────────────────
//
// Always reachable, but intentionally not one of the five primary positions.

export const SECONDARY_NAV: { label: string; href: string }[] = [
  { label: 'Support', href: '/donate' },
]
