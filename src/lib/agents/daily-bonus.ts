import 'server-only'
import type { AgentContext, AgentResult } from './runner'

/**
 * Daily Bonus Distributor
 * ──────────────────────────────────────────────────────────────────────────
 * Runs once a day (configured in vercel.json + agents table).
 * Finds every user_wallets row where last_daily_bonus is NULL or before
 * today (AEST), then credits DAILY_BONUS_PTS points and stamps the date.
 *
 * Why an agent instead of a client-side claim?
 *  - Prevents double-claiming across devices (single authoritative write).
 *  - Works even if the user never opens the app that day (passive reward).
 *  - Feeds into the server-side leaderboard (balance is the source of truth).
 *
 * Config keys (from agents.config in the DB):
 *   bonusPts   – points to award per user (default 100)
 *   maxBatch   – max wallets to process per run (default 5000)
 */

const DEFAULT_BONUS_PTS = 100
const DEFAULT_MAX_BATCH = 5_000

export async function dailyBonusDistributor(
  ctx: AgentContext,
): Promise<AgentResult | void> {
  const bonusPts = Number(ctx.config.bonusPts ?? DEFAULT_BONUS_PTS)
  const maxBatch = Number(ctx.config.maxBatch ?? DEFAULT_MAX_BATCH)

  // Today's date in YYYY-MM-DD, evaluated in UTC (Supabase stores dates as UTC)
  const today = new Date().toISOString().slice(0, 10)

  // ── 1. Find wallets that haven't received today's bonus ─────────────────
  // (This SELECT is only used to know which notifications to send and to cap
  // the batch size — the actual credit-and-idempotency guard below happens
  // atomically in SQL via apply_daily_bonus(), not from this snapshot.)
  const { data: wallets, error: fetchErr } = await ctx.admin
    .from('user_wallets')
    .select('user_id, last_daily_bonus')
    .or(`last_daily_bonus.is.null,last_daily_bonus.lt.${today}`)
    .limit(maxBatch)

  if (fetchErr) {
    ctx.notes.push(`fetch error: ${fetchErr.message}`)
    return { status: 'error', summary: `Could not read user_wallets: ${fetchErr.message}` }
  }

  ctx.processed = wallets?.length ?? 0

  if (!wallets || wallets.length === 0) {
    return { status: 'ok', summary: 'All wallets already credited for today.' }
  }

  // ── 2. Credit each wallet atomically via apply_daily_bonus() ─────────────
  // The increment (`balance = balance + p_amount`) and the idempotency guard
  // (`last_daily_bonus < p_today`) are evaluated together, at write time, by
  // Postgres — not from the batch SELECT above. This means a stake placed by
  // the user between the SELECT and this call can no longer be silently
  // overwritten (the previous implementation computed the new balance from a
  // stale JS-side read, which could clobber a concurrent balance change).
  let credited = 0
  let failed = 0

  for (const wallet of wallets) {
    const { data: applied, error: updateErr } = await ctx.admin
      .rpc('apply_daily_bonus', {
        p_user_id: wallet.user_id,
        p_amount: bonusPts,
        p_today: today,
      })

    if (updateErr || !applied) {
      // `applied === false` means another process already credited this
      // wallet today (e.g. a concurrent run) — not a failure, just a no-op.
      if (updateErr) failed++
      continue
    }

    // ── 3. Post a notification ──────────────────────────────────────────
    // Insert into notifications table (migration 006 creates it).
    // Non-fatal if this fails. `notifications` has no `data` column — the
    // previous version of this insert referenced one that doesn't exist,
    // so every bonus notification was silently failing.
    await ctx.admin
      .from('notifications')
      .insert({
        user_id: wallet.user_id,
        type: 'bonus',
        title: 'Daily bonus',
        body: `+${bonusPts} civic points credited to your wallet.`,
        read: false,
      })
      .select('id')
      .maybeSingle()
      // Silently ignore errors — notification is a nice-to-have.
      .then(() => null)

    credited++
  }

  ctx.written = credited

  const notes: string[] = [`+${bonusPts}pts × ${credited} wallets`]
  if (failed > 0) notes.push(`${failed} skipped (concurrent update)`)
  ctx.notes.push(...notes)

  return {
    status: failed > 0 && credited === 0 ? 'warn' : 'ok',
    summary: notes.join(' · '),
  }
}
