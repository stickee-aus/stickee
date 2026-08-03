import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Ban,
  RotateCcw,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  Users,
} from 'lucide-react'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import {
  banUserAction,
  unbanUserAction,
  promoteToAdminAction,
  demoteAdminAction,
  deleteUserAction,
} from './actions'

export const metadata: Metadata = { title: 'Users — Admin' }

const PAGE_SIZE = 25
const SEARCH_FETCH_PAGES = 4 // when searching, scan this many auth pages

type FilterValue = 'all' | 'admins' | 'banned' | 'not_onboarded'

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All users' },
  { value: 'admins', label: 'Admins' },
  { value: 'banned', label: 'Banned' },
  { value: 'not_onboarded', label: 'Not onboarded' },
]

type SearchParams = Promise<{ q?: string; page?: string; filter?: string }>

type AuthUser = {
  id: string
  email: string | null
  banned_until?: string | null
  created_at: string
  last_sign_in_at?: string | null
}

type ProfileRow = {
  user_id: string
  handle: string | null
  display_name: string | null
  electorate: string | null
  civic_score: number | null
  onboarding_completed_at: string | null
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function relative(iso: string | null | undefined) {
  if (!iso) return 'never'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const s = Math.round((now - then) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return formatDate(iso)
}

function isCurrentlyBanned(banned_until: string | null | undefined) {
  if (!banned_until) return false
  return new Date(banned_until).getTime() > Date.now()
}

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = (params.q ?? '').trim()
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const filter: FilterValue =
    (FILTERS.find(f => f.value === (params.filter ?? 'all'))?.value as FilterValue) ?? 'all'

  const admin = createAdminSupabaseClient()

  // ── Search across the profile table first if there's a query, so we can
  //    match handle and display_name (auth.listUsers only exposes email). ─
  let searchedUserIds: Set<string> | null = null
  if (q) {
    const like = `%${q.toLowerCase()}%`
    const { data: profileMatches } = await admin
      .from('user_profiles')
      .select('user_id')
      .or(`handle.ilike.${like},display_name.ilike.${like}`)
      .limit(500)
    searchedUserIds = new Set((profileMatches ?? []).map(r => r.user_id))
  }

  // ── Pull a window of auth users. When searching we fetch a few pages so
  //    email matches aren't truncated to the first 25. ─────────────────
  const pagesToFetch = q ? SEARCH_FETCH_PAGES : 1
  let allAuthUsers: AuthUser[] = []
  let authError: string | null = null

  for (let p = q ? 1 : page; p < (q ? pagesToFetch + 1 : page + 1); p++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page: p,
      perPage: PAGE_SIZE,
    })
    if (error) { authError = error.message; break }
    allAuthUsers = allAuthUsers.concat((data?.users ?? []) as unknown as AuthUser[])
    if ((data?.users ?? []).length < PAGE_SIZE) break
  }

  // ── Pull profiles + admin set for everyone we have ────────────────────
  const allIds = allAuthUsers.map(u => u.id)
  const [{ data: profileRows }, { data: adminRows }] = await Promise.all([
    allIds.length === 0
      ? Promise.resolve({ data: [] as ProfileRow[] })
      : admin
          .from('user_profiles')
          .select('user_id, handle, display_name, electorate, civic_score, onboarding_completed_at')
          .in('user_id', allIds),
    allIds.length === 0
      ? Promise.resolve({ data: [] as { user_id: string }[] })
      : admin.from('app_admins').select('user_id').in('user_id', allIds),
  ])

  const profileById = new Map<string, ProfileRow>()
  for (const p of (profileRows ?? []) as ProfileRow[]) profileById.set(p.user_id, p)
  const adminIdSet = new Set<string>()
  for (const a of (adminRows ?? [])) adminIdSet.add(a.user_id)

  // ── Apply text + filter selection ─────────────────────────────────────
  let filtered = allAuthUsers
  if (q) {
    const needle = q.toLowerCase()
    filtered = filtered.filter(u => {
      if ((u.email ?? '').toLowerCase().includes(needle)) return true
      if (u.id.toLowerCase().includes(needle)) return true
      if (searchedUserIds && searchedUserIds.has(u.id)) return true
      return false
    })
  }
  if (filter === 'admins') {
    filtered = filtered.filter(u => adminIdSet.has(u.id))
  } else if (filter === 'banned') {
    filtered = filtered.filter(u => isCurrentlyBanned(u.banned_until))
  } else if (filter === 'not_onboarded') {
    filtered = filtered.filter(u => !profileById.get(u.id)?.onboarding_completed_at)
  }

  // ── Counts for filter tabs (across the fetched window) ───────────────
  const counts = {
    all: allAuthUsers.length,
    admins: allAuthUsers.filter(u => adminIdSet.has(u.id)).length,
    banned: allAuthUsers.filter(u => isCurrentlyBanned(u.banned_until)).length,
    not_onboarded: allAuthUsers.filter(u => !profileById.get(u.id)?.onboarding_completed_at).length,
  }

  // ── Pagination only applies when not searching/filtering ─────────────
  const isFiltered = q !== '' || filter !== 'all'
  const visible = isFiltered ? filtered : filtered // already paginated by listUsers

  const totalRow = await admin.from('user_profiles').select('*', { count: 'exact', head: true })
  const totalProfiles = totalRow.count ?? 0

  return (
    <div className="space-y-6">
      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Admin · Users
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            User management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalProfiles.toLocaleString('en-AU')} total profile{totalProfiles === 1 ? '' : 's'}
            {isFiltered
              ? ` · ${visible.length} match${visible.length === 1 ? '' : 'es'}`
              : ` · page ${page}`}
          </p>
        </div>

        {/* Search */}
        <form className="flex gap-2 w-full md:w-auto">
          <input type="hidden" name="filter" value={filter} />
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search email, handle, name, or ID…"
              className="w-full h-10 rounded-md border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>
          <button
            type="submit"
            className="h-10 rounded-md bg-foreground px-4 text-[10px] uppercase tracking-widest text-background hover:opacity-90 transition-opacity"
          >
            Search
          </button>
          {(q || filter !== 'all') && (
            <Link
              href="/admin/users"
              className="h-10 inline-flex items-center rounded-md border border-border px-4 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Reset
            </Link>
          )}
        </form>
      </section>

      {/* ─── Filter tabs ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => {
          const active = f.value === filter
          const href = (() => {
            const sp = new URLSearchParams()
            if (f.value !== 'all') sp.set('filter', f.value)
            if (q) sp.set('q', q)
            const s = sp.toString()
            return s ? `/admin/users?${s}` : '/admin/users'
          })()
          const count = counts[f.value]
          return (
            <Link
              key={f.value}
              href={href}
              className={`inline-flex items-center gap-2 px-3 h-8 rounded-md text-[10px] uppercase tracking-widest border ${
                active
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
              <span className={active ? 'opacity-70' : 'opacity-60'}>{count}</span>
            </Link>
          )
        })}
      </div>

      {/* ─── List ────────────────────────────────────────────────── */}
      <section className="rounded-md border border-border bg-card/30">
        {authError && (
          <p className="px-5 py-6 text-xs" style={{ color: '#f04747' }}>
            Error loading users: {authError}
          </p>
        )}
        {!authError && visible.length === 0 && (
          <p className="px-5 py-10 text-xs text-muted-foreground text-center">
            {q ? `No users match "${q}".` : 'No users in this view yet.'}
          </p>
        )}

        <div className="divide-y divide-border">
          {visible.map(user => {
            const profile = profileById.get(user.id)
            const banned = isCurrentlyBanned(user.banned_until)
            const isAdmin = adminIdSet.has(user.id)
            const name = profile?.display_name ?? profile?.handle ?? user.email ?? user.id

            return (
              <article key={user.id} className="px-5 py-4">
                <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] items-start">
                  <Avatar name={name} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {profile?.display_name ?? profile?.handle ?? user.email ?? user.id}
                      </p>
                      {isAdmin && (
                        <span
                          className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md border"
                          style={{ color: '#5b9bd5', borderColor: '#14253a', background: '#0a141e' }}
                        >
                          Admin
                        </span>
                      )}
                      {banned && (
                        <span
                          className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md border"
                          style={{ color: '#f04747', borderColor: '#3a1414', background: '#1e0a0a' }}
                        >
                          Banned
                        </span>
                      )}
                      {!profile?.onboarding_completed_at && (
                        <span
                          className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md border"
                          style={{ color: '#5a5a5e', borderColor: '#1e1e20' }}
                        >
                          Not onboarded
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {user.email ?? '(no email)'} · @{profile?.handle ?? 'unclaimed'}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Joined {formatDate(user.created_at)} · Last seen {relative(user.last_sign_in_at)}
                      {' · '}Score {profile?.civic_score ?? 0}
                      {profile?.electorate ? ` · ${profile.electorate}` : ''}
                    </p>
                  </div>

                  <details className="md:justify-self-end">
                    <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 rounded-md border border-border px-3 h-8 text-[10px] uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors">
                      Manage
                    </summary>
                    <div className="mt-3 space-y-2">
                      {!banned ? (
                        <form action={banUserAction} className="flex flex-wrap gap-2 items-center">
                          <input type="hidden" name="userId" value={user.id} />
                          <input
                            name="reason"
                            placeholder="Reason (optional)"
                            className="h-8 rounded-md border border-border bg-background px-2 text-[11px] text-foreground placeholder:text-muted-foreground w-44"
                          />
                          <select
                            name="durationHours"
                            defaultValue="999999"
                            className="h-8 rounded-md border border-border bg-background px-2 text-[11px] text-foreground"
                          >
                            <option value="24">24h</option>
                            <option value="168">7d</option>
                            <option value="720">30d</option>
                            <option value="999999">Permanent</option>
                          </select>
                          <button
                            type="submit"
                            className="h-8 inline-flex items-center gap-1.5 rounded-md border px-3 text-[10px] uppercase tracking-widest"
                            style={{ color: '#f04747', borderColor: '#3a1414', background: '#1e0a0a' }}
                          >
                            <Ban className="h-3 w-3" /> Ban
                          </button>
                        </form>
                      ) : (
                        <form action={unbanUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button
                            type="submit"
                            className="h-8 inline-flex items-center gap-1.5 rounded-md border border-border px-3 text-[10px] uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background"
                          >
                            <RotateCcw className="h-3 w-3" /> Unban
                          </button>
                        </form>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {!isAdmin ? (
                          <form action={promoteToAdminAction}>
                            <input type="hidden" name="userId" value={user.id} />
                            <button
                              type="submit"
                              className="h-8 inline-flex items-center gap-1.5 rounded-md border border-border px-3 text-[10px] uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background"
                            >
                              <Shield className="h-3 w-3" /> Promote to admin
                            </button>
                          </form>
                        ) : (
                          <form action={demoteAdminAction}>
                            <input type="hidden" name="userId" value={user.id} />
                            <button
                              type="submit"
                              className="h-8 inline-flex items-center gap-1.5 rounded-md border border-border px-3 text-[10px] uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background"
                            >
                              <ShieldOff className="h-3 w-3" /> Demote
                            </button>
                          </form>
                        )}

                        <form action={deleteUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button
                            type="submit"
                            className="h-8 inline-flex items-center gap-1.5 rounded-md border px-3 text-[10px] uppercase tracking-widest"
                            style={{ borderColor: '#3a1414', color: '#f04747' }}
                          >
                            <Trash2 className="h-3 w-3" /> Delete user
                          </button>
                        </form>
                      </div>
                    </div>
                  </details>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ─── Pagination (only when not filtering) ────────────────── */}
      {!isFiltered && (
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Page {page}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/users?page=${page - 1}`}
                className="rounded-md border border-border px-3 py-1.5 hover:text-foreground"
              >
                ← Previous
              </Link>
            )}
            {visible.length === PAGE_SIZE && (
              <Link
                href={`/admin/users?page=${page + 1}`}
                className="rounded-md border border-border px-3 py-1.5 hover:text-foreground"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Avatar (color-hashed initial) ───────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  const hue = h % 360
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
      style={{
        background: `hsl(${hue} 60% 18%)`,
        color: `hsl(${hue} 80% 70%)`,
        border: `1px solid hsl(${hue} 50% 25%)`,
      }}
    >
      {initial}
    </div>
  )
}
