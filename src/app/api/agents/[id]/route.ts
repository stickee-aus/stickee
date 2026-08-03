import type { NextRequest } from 'next/server'
import { isAgentSlug, runAgent } from '@/lib/agents/registry'

/**
 * Auth helper — accepts either:
 *   - x-sync-secret: <SYNC_SECRET>          (manual / curl)
 *   - Authorization: Bearer <CRON_SECRET>   (Vercel cron scheduler)
 */
function isAuthorized(request: NextRequest): boolean {
  if (request.headers.get('x-sync-secret') === process.env.SYNC_SECRET) return true
  const bearer = request.headers.get('authorization') ?? ''
  if (process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`) return true
  return false
}

/**
 * POST /api/agents/[id]
 * ───────────────────────────────────────────────────────────
 * Manual trigger from admin UI or curl.
 * Auth: x-sync-secret header.
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  if (!isAgentSlug(id)) {
    return Response.json({ error: `Unknown agent: ${id}` }, { status: 404 })
  }

  try {
    const result = await runAgent(id, { trigger: 'manual' })
    return Response.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ status: 'error', summary: msg }, { status: 500 })
  }
}

/**
 * GET /api/agents/[id]
 * ───────────────────────────────────────────────────────────
 * Called by Vercel's cron scheduler (Authorization: Bearer CRON_SECRET).
 * Also acts as a liveness probe when unauthenticated.
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params

  // Unauthenticated GET → liveness probe only (no side effects)
  if (!isAuthorized(request)) {
    return Response.json({ agent: id, isKnown: isAgentSlug(id) })
  }

  if (!isAgentSlug(id)) {
    return Response.json({ error: `Unknown agent: ${id}` }, { status: 404 })
  }

  try {
    const result = await runAgent(id, { trigger: 'cron' })
    return Response.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ status: 'error', summary: msg }, { status: 500 })
  }
}
