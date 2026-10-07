import type { Metadata } from 'next'
import { connection } from 'next/server'
import { headers } from 'next/headers'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { resolveMarketAction } from './actions'

export const metadata: Metadata = {
  title: 'Markets — Stickee Admin',
  description: 'Resolve or void prediction markets.',
}

// Note: like the other pages in this admin console, authorization here
// relies on the parent /admin layout's isAppAdmin() check (see
// docs/audits/SECURITY_AND_PERMISSIONS_AUDIT.md's finding on that pattern — unchanged
// in this batch, since fixing it across the whole console was out of this
// batch's scope). The one action this page exposes, resolveMarketAction,
// re-checks admin status itself, and the underlying resolve_market() SQL
// function checks it again independently — a non-admin cannot resolve a
// market even if they somehow reached this page.

interface MarketRow {
  issue_id: string
  question: string
  status: string
  opens_at: string | null
  closes_at: string | null
  is_test_fixture: boolean
  outcome: string | null
  resolved_at: string | null
  resolution_source: string | null
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })
}

export default async function MarketsAdminPage() {
  await connection()

  await headers() // avoid build-time caching, matches the agents page's convention
  const admin = createAdminSupabaseClient()

  const { data: markets } = await admin
    .from('issue_markets')
    .select('issue_id, question, status, opens_at, closes_at, is_test_fixture, outcome, resolved_at, resolution_source')
    .order('updated_at', { ascending: false })

  const rows = (markets ?? []) as MarketRow[]

  const openPositionCounts = new Map<string, number>()
  if (rows.length > 0) {
    const { data: positions } = await admin
      .from('wallet_positions')
      .select('market_id')
      .eq('status', 'open')
      .in('market_id', rows.map(r => r.issue_id))
    for (const p of positions ?? []) {
      openPositionCounts.set(p.market_id, (openPositionCounts.get(p.market_id) ?? 0) + 1)
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          System · Prediction markets
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Markets</h1>
        <p className="text-sm text-muted-foreground">
          Resolve a market YES/NO (pays out matching open positions) or VOID it (refunds every open position its
          original stake). Resolution is permanent — see docs/audits/MARKET_ENGINE_AUDIT.md for the settlement model.
          A resolution source is required for every resolution, for audit purposes.
        </p>
      </section>

      <section className="rounded-md border border-border bg-card/30 overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-xs text-muted-foreground">
            No markets exist yet. This is expected in this batch — no market has been seeded as live/stakeable;
            see docs/audits/PRODUCTION_BLOCKERS.md and docs/audits/IMPLEMENTATION_BATCH_1_REPORT.md for why, and
            supabase/seed.sql for test fixtures you can load in a dev/staging database to exercise this page.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {rows.map(m => {
              const openCount = openPositionCounts.get(m.issue_id) ?? 0
              const resolvable = m.status === 'active'
              return (
                <div key={m.issue_id} className="px-5 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        {m.question}
                        {m.is_test_fixture && (
                          <span className="ml-2 rounded-full border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
                            test fixture
                          </span>
                        )}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                        {m.issue_id} · status: {m.status} · opens: {fmt(m.opens_at)} · closes: {fmt(m.closes_at)} · {openCount} open position(s)
                      </p>
                      {m.resolved_at && (
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                          resolved {fmt(m.resolved_at)} · outcome: {m.outcome} · source: {m.resolution_source}
                        </p>
                      )}
                    </div>
                  </div>

                  {resolvable && (
                    <form action={resolveMarketAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="issueId" value={m.issue_id} />
                      <select
                        name="outcome"
                        required
                        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                        defaultValue=""
                      >
                        <option value="" disabled>Outcome…</option>
                        <option value="yes">YES</option>
                        <option value="no">NO</option>
                        <option value="void">VOID</option>
                      </select>
                      <input
                        type="text"
                        name="resolutionSource"
                        required
                        placeholder="Resolution source / evidence (required)"
                        className="flex-1 min-w-64 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
                      />
                      <button
                        type="submit"
                        className="text-[10px] uppercase tracking-widest border border-border px-3 py-1.5 text-foreground hover:bg-foreground hover:text-background transition-colors"
                      >
                        Resolve
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
