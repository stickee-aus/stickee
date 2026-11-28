// In-memory stand-in for the Supabase service client, covering only the
// query shapes the Stripe webhook handler uses. Test-only.

type Row = Record<string, unknown>
type Result = { data: Row[] | null; error: { message: string; code?: string } | null }

export type MemoryOptions = {
  failUpdate?: boolean
  failMessage?: string
  failEventClaim?: boolean
}

export function createStripeMemoryAdmin(
  donations: Row[],
  options: MemoryOptions & { events?: Row[] } = {},
) {
  const events: Row[] = options.events ?? []
  const updateCalls: Row[] = []
  const insertCalls: Row[] = []

  function tableRows(table: string) {
    if (table === 'donation_records') return donations
    if (table === 'processed_stripe_events') return events
    throw new Error(`unexpected table ${table}`)
  }

  function builder(table: string) {
    const rows = tableRows(table)
    let mode: 'select' | 'update' | 'insert' = 'select'
    let patch: Row = {}
    let inserted: Row = {}
    let limit = Infinity
    const filters: Array<(row: Row) => boolean> = []

    function execute(): Result {
      if (mode === 'insert') {
        if (table === 'processed_stripe_events') {
          if (options.failEventClaim) return { data: null, error: { message: 'simulated' } }
          if (rows.some(r => r.event_id === inserted.event_id)) {
            return { data: null, error: { message: 'duplicate key', code: '23505' } }
          }
          rows.push({ processed_at: null, ...inserted })
          return { data: null, error: null }
        }
        if (inserted.stripe_invoice_id && rows.some(r => r.stripe_invoice_id === inserted.stripe_invoice_id)) {
          return { data: null, error: { message: 'duplicate key', code: '23505' } }
        }
        rows.push({ id: `row_${rows.length + 1}`, ...inserted })
        return { data: null, error: null }
      }
      if (mode === 'update') {
        if (table === 'donation_records' && options.failUpdate) {
          return { data: null, error: { message: options.failMessage ?? 'simulated-db-failure' } }
        }
        const matches = rows.filter(r => filters.every(f => f(r)))
        for (const r of matches) Object.assign(r, patch)
        return { data: matches, error: null }
      }
      return { data: rows.filter(r => filters.every(f => f(r))).slice(0, limit), error: null }
    }

    const q = {
      select() { return q },
      order() { return q },
      limit(n: number) { limit = n; return q },
      insert(row: Row) { mode = 'insert'; inserted = row; insertCalls.push({ table, ...row }); return q },
      update(p: Row) {
        mode = 'update'; patch = p
        if (table === 'donation_records') updateCalls.push(p)
        return q
      },
      eq(col: string, val: unknown) { filters.push(r => r[col] === val); return q },
      in(col: string, vals: unknown[]) { filters.push(r => vals.includes(r[col])); return q },
      then(resolve: (v: Result) => unknown, reject?: (r: unknown) => unknown) {
        return Promise.resolve(execute()).then(resolve, reject)
      },
    }
    return q
  }

  return { admin: { from: builder }, donations, events, updateCalls, insertCalls }
}
