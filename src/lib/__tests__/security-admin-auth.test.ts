import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@supabase/supabase-js'

const upsert = vi.fn(async () => ({ error: null }))
const maybeSingle = vi.fn(async () => ({ data: null }))

vi.mock('@/lib/supabase-admin', () => ({
  createAdminSupabaseClient: () => ({
    from: () => ({
      upsert,
      select: () => ({ eq: () => ({ maybeSingle }) }),
    }),
  }),
}))

import { isAppAdmin, isConfiguredAdminUser, normalizeReturnPath } from '@/lib/admin-auth'

const ADMIN_ID = '22222222-2222-4222-8222-222222222222'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'boss@example.test',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as User
}

describe('admin auth: unconfirmed email is never admin', () => {
  beforeEach(() => {
    vi.stubEnv('STICKEE_ADMIN_EMAILS', 'boss@example.test, Other@Example.test')
    vi.stubEnv('STICKEE_ADMIN_USER_IDS', ADMIN_ID)
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    upsert.mockClear()
    maybeSingle.mockClear()
  })
  afterEach(() => vi.unstubAllEnvs())

  it('rejects an allowlisted email that is not confirmed', async () => {
    const user = makeUser({ email_confirmed_at: undefined })
    expect(isConfiguredAdminUser(user)).toBe(false)
    expect(await isAppAdmin(user)).toBe(false)
  })

  it('rejects an allowlisted email with a null confirmation timestamp', () => {
    expect(isConfiguredAdminUser(makeUser({ email_confirmed_at: null as unknown as undefined }))).toBe(false)
  })

  it('accepts an allowlisted email once confirmed (case-insensitive exact match)', async () => {
    expect(isConfiguredAdminUser(makeUser())).toBe(true)
    expect(isConfiguredAdminUser(makeUser({ email: 'OTHER@example.test' }))).toBe(true)
    expect(await isAppAdmin(makeUser())).toBe(true)
  })

  it('does not match partial or look-alike emails', () => {
    expect(isConfiguredAdminUser(makeUser({ email: 'boss@example.test.evil.test' }))).toBe(false)
    expect(isConfiguredAdminUser(makeUser({ email: 'xboss@example.test' }))).toBe(false)
    expect(isConfiguredAdminUser(makeUser({ email: 'boss@example.test ' }))).toBe(true) // trimmed, still exact
  })

  it('accepts a configured user id regardless of email state', () => {
    expect(isConfiguredAdminUser(makeUser({ id: ADMIN_ID, email: undefined, email_confirmed_at: undefined }))).toBe(true)
  })

  it('rejects unrelated users and null', async () => {
    expect(isConfiguredAdminUser(makeUser({ email: 'nobody@example.test' }))).toBe(false)
    expect(await isAppAdmin(null)).toBe(false)
  })

  it('does not write app_admins for an unconfirmed allowlisted email', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role')
    const user = makeUser({ email_confirmed_at: undefined })
    expect(await isAppAdmin(user)).toBe(false)
    expect(upsert).not.toHaveBeenCalled()
    expect(maybeSingle).toHaveBeenCalledTimes(1)
  })

  it('still grants the role-table match and upserts for a confirmed allowlisted email', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role')
    expect(await isAppAdmin(makeUser())).toBe(true)
    expect(upsert).toHaveBeenCalledTimes(1)
  })

  it('grants admin from the app_admins role table', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role')
    maybeSingle.mockResolvedValueOnce({ data: { user_id: 'x' } as never })
    expect(await isAppAdmin(makeUser({ email: 'nobody@example.test' }))).toBe(true)
  })
})

describe('normalizeReturnPath: same-origin only', () => {
  it('keeps normal in-app paths', () => {
    expect(normalizeReturnPath('/predictions?x=1#top', '/')).toBe('/predictions?x=1#top')
    expect(normalizeReturnPath('/onboarding', '/')).toBe('/onboarding')
  })

  it.each([
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/\\/evil.test',
    '/foo\nbar',
    '/foo\tbar',
    'javascript:alert(1)',
    'evil.test/path',
    '/auth/sign-in',
    '/auth/sign-up?x=1',
    '',
    '   ',
  ])('rejects %j', value => {
    expect(normalizeReturnPath(value, '/safe')).toBe('/safe')
  })

  it('rejects non-strings', () => {
    expect(normalizeReturnPath(undefined, '/safe')).toBe('/safe')
    expect(normalizeReturnPath(['/x'], '/safe')).toBe('/safe')
  })
})
