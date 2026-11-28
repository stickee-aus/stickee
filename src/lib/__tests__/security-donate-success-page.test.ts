import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const USER = '66666666-6666-4666-8666-666666666666'
const SID = 'cs_test_page12345'

let currentUser: { id: string } | null = { id: USER }
const fromSpy = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: currentUser } }) },
    from: fromSpy,
  }),
}))

function stripeReturns(session: Record<string, unknown>, status = 200) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(session), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function render(sessionId?: string) {
  const mod = await import('@/app/donate/success/page')
  const element = await mod.default({ searchParams: Promise.resolve({ session_id: sessionId }) })
  return renderToStaticMarkup(element)
}

describe('/donate/success verifies server-side and never writes', () => {
  beforeEach(() => {
    vi.resetModules()
    fromSpy.mockClear()
    currentUser = { id: USER }
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fixture')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('shows success for a paid session that belongs to the signed-in user', async () => {
    stripeReturns({ id: SID, payment_status: 'paid', status: 'complete', client_reference_id: USER })
    const html = await render(SID)
    expect(html).toContain('Donation received')
    expect(html).toContain('Thank you for backing Stickee.')
  })

  it('does not claim success for a paid session owned by someone else', async () => {
    stripeReturns({ id: SID, payment_status: 'paid', status: 'complete', client_reference_id: 'someone-else' })
    const html = await render(SID)
    expect(html).not.toContain('Donation received')
    expect(html).toContain('could not confirm')
  })

  it('does not claim success for an anonymous visitor, and does not call Stripe', async () => {
    currentUser = null
    const fetchMock = stripeReturns({ id: SID, payment_status: 'paid', client_reference_id: USER })
    const html = await render(SID)
    expect(html).not.toContain('Donation received')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not claim success with no session_id or an unpaid open session', async () => {
    const fetchMock = stripeReturns({ id: SID, payment_status: 'unpaid', status: 'open', client_reference_id: USER })
    expect(await render(undefined)).not.toContain('Donation received')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(await render(SID)).not.toContain('Donation received')
  })

  it('shows processing for a completed but unpaid session', async () => {
    stripeReturns({ id: SID, payment_status: 'unpaid', status: 'complete', client_reference_id: USER })
    const html = await render(SID)
    expect(html).toContain('Payment processing')
    expect(html).not.toContain('Donation received')
  })

  it('falls back to unverified when Stripe errors', async () => {
    stripeReturns({ error: { message: 'nope' } }, 404)
    expect(await render(SID)).not.toContain('Donation received')
  })

  it('never writes to the database from the page', async () => {
    stripeReturns({ id: SID, payment_status: 'paid', status: 'complete', client_reference_id: USER })
    await render(SID)
    expect(fromSpy).not.toHaveBeenCalled()
  })
})
