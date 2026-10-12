import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  signInWithOtp: vi.fn(),
  createServerSupabaseClient: vi.fn(),
}))
vi.mock('next/headers', () => ({ headers: async () => new Headers({ origin: 'http://127.0.0.1:3000' }) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: mocks.createServerSupabaseClient }))
vi.mock('@/lib/admin-auth', () => ({
  normalizeReturnPath: (path: string, fallback: string) => path.startsWith('/') && !path.startsWith('//') ? path : fallback,
  getPostAuthRedirectPath: vi.fn(),
}))
import { sendPasswordReset } from '@/app/auth/forgot-password/actions'
import { sendMagicLink } from '@/app/auth/sign-in/actions'

beforeEach(() => {
  vi.resetAllMocks()
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null })
  mocks.signInWithOtp.mockResolvedValue({ error: null })
  mocks.createServerSupabaseClient.mockResolvedValue({ auth: mocks })
})
const state = { email: '', error: null, sent: false }
function form(next = '') {
  const data = new FormData()
  data.set('email', 'qa@example.invalid')
  data.set('next', next)
  return data
}

describe('email authentication handoff', () => {
  it('routes password recovery through code exchange before the reset form', async () => {
    expect((await sendPasswordReset(state, form())).sent).toBe(true)
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('qa@example.invalid', {
      redirectTo: 'http://127.0.0.1:3000/auth/callback?next=/auth/reset-password',
    })
  })
  it('uses the cookie-backed PKCE client for magic links and preserves the destination', async () => {
    expect((await sendMagicLink(state, form('/profile'))).sent).toBe(true)
    expect(mocks.createServerSupabaseClient).toHaveBeenCalledOnce()
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({ email: 'qa@example.invalid', options: { emailRedirectTo: 'http://127.0.0.1:3000/auth/callback?next=%2Fprofile' } })
  })
  it('does not claim email was sent when Auth rejects the request', async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: { message: 'Email rate limit exceeded' } })
    expect(await sendMagicLink(state, form())).toEqual({ email: 'qa@example.invalid', error: 'Email rate limit exceeded', sent: false })
  })
})

// The request's internal origin must not move cookies to another host.
describe('email callback host preservation', () => {
  it('returns a relative destination after exchanging the PKCE code', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    mocks.createServerSupabaseClient.mockResolvedValue({ auth: { exchangeCodeForSession } })
    const { getPostAuthRedirectPath } = await import('@/lib/admin-auth')
    vi.mocked(getPostAuthRedirectPath).mockResolvedValue('/auth/reset-password')
    const { GET } = await import('@/app/auth/callback/route')
    const response = await GET(new Request('http://localhost:3000/auth/callback?code=local-fixture&next=/auth/reset-password'))
    expect(exchangeCodeForSession).toHaveBeenCalledWith('local-fixture')
    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe('/auth/reset-password')
  })
})
