'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { MPs, PARTY_COLORS } from '@/lib/mock-data'
import { useLiveParliamentMembers } from '@/hooks/useLiveParliamentMembers'
import { useElectorate } from '@/hooks/useElectorate'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { SectionHeader } from '@/components/ui/section-header'
import { RecordRow } from '@/components/ui/record-row'
import { StatusLabel } from '@/components/ui/status-label'
import { EmptyState } from '@/components/ui/empty-state'
import { UnderlineTabs, type UnderlineTabItem } from '@/components/ui/underline-tabs'
import { LinkButton } from '@/components/LinkButton'
import { FindYourRepresentative } from '@/components/FindYourRepresentative'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PARTY_SHORT: Record<string, string> = {
  'Labor':                        'ALP',
  'Coalition':                    'LIB/NAT',
  'Greens':                       'GRN',
  'Independent':                  'IND',
  'Centre Alliance':              'CA',
  "Katter's Australian Party":   'KAP',
  'One Nation':                   'ONP',
  'Jacqui Lambie Network':        'JLN',
  'United Australia Party':       'UAP',
  "Australia's Voice":           'AV',
}

type SortKey = 'party' | 'name'
type PartyFilter = 'all' | string
type Chamber = 'house' | 'senate'

const PAGE_SIZE = 25

const CHAMBER_TABS: UnderlineTabItem[] = [
  { id: 'house', label: 'House of Reps' },
  { id: 'senate', label: 'Senate' },
]

// A profile only resolves on /mp/[id] when the id round-trips through the
// static MPIndex (mock-data.ts's mp-* scheme) — real per-senator and some
// live-synced House ids don't (see PEOPLE_V1_SIMPLIFICATION_REPORT.md's
// canonical-ID findings). Never render a link that would 404.
function isResolvableProfileId(id: string) {
  return id.startsWith('mp-')
}

function formatSyncedDate(value: string | null) {
  if (!value) return undefined
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Composition summary — real countsByParty, no embedded chamber map ──────
// Collapsed by default (largest parties only) so the directory, not this
// summary, is what a mobile reader scrolls through first. Never groups
// parties into an invented "Other" bucket — every real party keeps its own
// row, just hidden behind the same expand toggle as the rest.

const COMPOSITION_COLLAPSED_COUNT = 4

function CompositionList({ counts, total, expanded }: { counts: Record<string, number>; total: number; expanded: boolean }) {
  const parties = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
  if (parties.length === 0) {
    return <p className="text-xs text-muted-foreground">No composition data available.</p>
  }
  const visible = expanded ? parties : parties.slice(0, COMPOSITION_COLLAPSED_COUNT)
  const hiddenCount = parties.length - visible.length
  return (
    <ul className="space-y-1.5">
      {visible.map(([party, count]) => {
        const color = PARTY_COLORS[party] ?? '#999'
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <li key={party} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 border" style={{ backgroundColor: color, borderColor: color }} aria-hidden="true" />
            <span className="flex-1 text-foreground">{party}</span>
            <span className="font-mono text-xs text-muted-foreground">{count} · {pct}%</span>
          </li>
        )
      })}
      {!expanded && hiddenCount > 0 && (
        <li className="text-xs text-muted-foreground">+{hiddenCount} more party{hiddenCount === 1 ? '' : ' groups'}</li>
      )}
    </ul>
  )
}

// ─── People page ──────────────────────────────────────────────────────────────

export default function LeadersPage() {
  const { data: liveParliament, loading: liveParliamentLoading } = useLiveParliamentMembers()
  const houseMembers = liveParliament?.house.members.length ? liveParliament.house.members : MPs
  const senateMembers = liveParliament?.senate.members ?? []

  const {
    electorate,
    mp: electorateMP,
    detectState,
    suggestedElectorate,
    setElectorate,
    clearElectorate,
    detectByLocation,
    confirmSuggestedElectorate,
    rejectSuggestedElectorate,
  } = useElectorate()

  const [chamberTab, setChamberTab] = useState<Chamber>('house')
  const [sortBy, setSortBy] = useState<SortKey>('party')
  const [partyFilter, setPartyFilter] = useState<PartyFilter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [compositionExpanded, setCompositionExpanded] = useState(false)
  const [rolesExpanded, setRolesExpanded] = useState(false)

  const activeMembers = chamberTab === 'senate' ? senateMembers : houseMembers
  const isLive = liveParliament?.source === 'tvfy' || liveParliament?.source === 'supabase'

  useEffect(() => {
    setPartyFilter('all')
    setSearch('')
    setPage(1)
  }, [chamberTab])

  const allMPs = useMemo(() => {
    let list = [...activeMembers]
    if (partyFilter !== 'all') list = list.filter(m => m.party === partyFilter)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(m => m.name.toLowerCase().includes(q) || m.electorate.toLowerCase().includes(q))

    list.sort((a, b) => (sortBy === 'party' ? a.party.localeCompare(b.party) : a.name.localeCompare(b.name)))
    return list
  }, [activeMembers, sortBy, partyFilter, search])

  const displayedMPs = allMPs.slice(0, page * PAGE_SIZE)
  const hasMore = displayedMPs.length < allMPs.length

  const uniqueParties = useMemo(() => {
    const parties = [...new Set(activeMembers.map(m => m.party))].sort()
    return ['all', ...parties] as PartyFilter[]
  }, [activeMembers])

  const totalMPs = houseMembers.length

  return (
    <PageShell>
      <PageHeader
        eyebrow="Australia · People"
        title="People"
        summary="Who represents Australians, what are they responsible for, and what have they actually done?"
        metadata={{
          source: liveParliament?.source === 'tvfy'
            ? 'TheyVoteForYou live feed'
            : liveParliament?.source === 'supabase'
            ? 'Synced members table'
            : 'Illustrative demo data',
          updatedDate: formatSyncedDate(liveParliament?.syncedAt ?? null),
          verification: isLive ? 'verified' : 'demo',
        }}
        metric={{ value: totalMPs, label: 'House members tracked' }}
      />

      {/* ── Find your representative ────────────────────────────────────────── */}
      <section className="mt-8 space-y-4">
        <SectionHeader title="Find your representative" />
        <FindYourRepresentative
          mp={electorateMP}
          electorate={electorate}
          detectState={detectState}
          suggestedElectorate={suggestedElectorate}
          onDetectByLocation={detectByLocation}
          onManualSetElectorate={setElectorate}
          onClearElectorate={clearElectorate}
          onConfirmSuggested={confirmSuggestedElectorate}
          onRejectSuggested={rejectSuggestedElectorate}
        />
      </section>

      {/* ── Representative directory ────────────────────────────────────────── */}
      <section className="mt-10 space-y-4">
        <SectionHeader title="Representative directory" />

        <UnderlineTabs items={CHAMBER_TABS} value={chamberTab} onChange={value => setChamberTab(value as Chamber)} />

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name or electorate"
            aria-label="Search representatives by name or electorate"
            className="flex-1 min-w-[200px] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none transition-calm"
          />
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-micro-label">Sort</span>
            {([{ key: 'party', label: 'Party' }, { key: 'name', label: 'Name' }] as { key: SortKey; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`text-xs uppercase tracking-widest pb-0.5 border-b-2 transition-calm ${
                  sortBy === key ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by party">
          {uniqueParties.map(p => (
            <button
              key={p}
              onClick={() => { setPartyFilter(p); setPage(1) }}
              className={`text-[11px] uppercase tracking-widest px-2 py-1 border transition-calm ${
                partyFilter === p ? 'border-foreground text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === 'all' ? 'All' : PARTY_SHORT[p] ?? p}
            </button>
          ))}
        </div>

        {displayedMPs.length === 0 ? (
          liveParliamentLoading && chamberTab === 'senate' ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading current senators…</p>
          ) : (
            <EmptyState
              variant="no-data"
              title="No representatives match this filter"
              description="Try a different search, party filter, or chamber."
            />
          )
        ) : (
          <div role="list">
            {displayedMPs.map(mp => {
              const partyShort = PARTY_SHORT[mp.party] ?? mp.party.slice(0, 3).toUpperCase()
              const chamberLabel = chamberTab === 'house' ? 'House of Reps' : 'Senate'
              const resolvable = isResolvableProfileId(mp.id)
              return (
                <div role="listitem" key={mp.id}>
                  <RecordRow
                    label={mp.name}
                    meta={`${partyShort} · ${mp.electorate} · ${chamberLabel}`}
                    href={resolvable ? `/mp/${mp.id}` : undefined}
                    status={resolvable
                      ? undefined
                      : <StatusLabel status="unavailable" label="Profile not yet available" />}
                    value={resolvable
                      ? <span className="text-metadata normal-case tracking-normal text-muted-foreground">View profile →</span>
                      : undefined}
                  />
                </div>
              )
            })}
          </div>
        )}

        {hasMore && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full py-3 text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-calm"
          >
            Show more ({allMPs.length - displayedMPs.length} remaining)
          </button>
        )}

        <p className="text-xs text-muted-foreground">
          {displayedMPs.length} of {allMPs.length} shown
        </p>
      </section>

      {/* ── Representation summary ──────────────────────────────────────────── */}
      <section className="mt-10 space-y-4">
        <SectionHeader
          title="Representation summary"
          action={<LinkButton href="/parliament" variant="outline" size="sm">Explore Parliament →</LinkButton>}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-micro-label mb-2">House of Representatives · {liveParliament?.house.total ?? 150} seats</p>
            <CompositionList counts={liveParliament?.house.countsByParty ?? {}} total={liveParliament?.house.total ?? 150} expanded={compositionExpanded} />
          </div>
          <div>
            <p className="text-micro-label mb-2">Senate · {liveParliament?.senate.total ?? 76} seats</p>
            <CompositionList counts={liveParliament?.senate.countsByParty ?? {}} total={liveParliament?.senate.total ?? 76} expanded={compositionExpanded} />
          </div>
        </div>
        <button
          onClick={() => setCompositionExpanded(v => !v)}
          aria-expanded={compositionExpanded}
          className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-calm"
        >
          <ChevronDown size={12} className={compositionExpanded ? 'rotate-180 transition-calm' : 'transition-calm'} aria-hidden="true" />
          {compositionExpanded ? 'Show fewer parties' : 'View full composition'}
        </button>
        <p className="text-xs text-muted-foreground">
          For the full interactive chamber, live votes, and bills before Parliament, see{' '}
          <LinkButton href="/parliament" variant="link" size="sm" className="p-0 h-auto align-baseline">Government · Federal Parliament</LinkButton>.
        </p>
      </section>

      {/* ── Role explainer — plain-language, generic, never a per-person claim ── */}
      <section className="mt-10 space-y-4">
        <button
          onClick={() => setRolesExpanded(v => !v)}
          aria-expanded={rolesExpanded}
          className="flex w-full items-center justify-between gap-3 border-b border-border pb-4 text-left"
        >
          <h2 className="text-section-title">What can these roles actually do?</h2>
          <ChevronDown size={14} className={rolesExpanded ? 'rotate-180 transition-calm shrink-0' : 'transition-calm shrink-0'} aria-hidden="true" />
        </button>
        {rolesExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-micro-label mb-2">Federal MP</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Represents an electorate in the House of Representatives</li>
                <li>Debates and votes on legislation</li>
                <li>May sit on committees</li>
                <li>May introduce a private member&apos;s bill</li>
                <li>May ask questions in Parliament</li>
              </ul>
            </div>
            <div>
              <p className="text-micro-label mb-2">Senator</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Represents a state or territory</li>
                <li>Reviews and votes on legislation</li>
                <li>May sit on committees</li>
              </ul>
            </div>
            <div>
              <p className="text-micro-label mb-2">Minister</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Is a parliamentarian with executive responsibility for a portfolio</li>
              </ul>
            </div>
          </div>
        )}
        {rolesExpanded && (
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            No MP, Senator, or Minister can act alone: none can unilaterally change law, direct a
            government department, or set executive policy by themselves. Stickee does not yet
            verify or display which individual MPs hold a ministerial or shadow portfolio.
          </p>
        )}
      </section>
    </PageShell>
  )
}
