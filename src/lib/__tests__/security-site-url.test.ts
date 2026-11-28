import { describe, expect, it } from 'vitest'
import { getTrustedSiteOrigin, isTrustedOrigin } from '@/lib/site-url'

const env = (e: Record<string, string>) => e as unknown as NodeJS.ProcessEnv

describe('trusted site origin', () => {
  it('uses the configured site URL and ignores any request host', () => {
    const e = env({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://stickee.example.test/some/path' })
    expect(getTrustedSiteOrigin('evil.test', e)).toBe('https://stickee.example.test')
  })

  it('falls back to SITE_URL', () => {
    expect(getTrustedSiteOrigin(null, env({ NODE_ENV: 'production', SITE_URL: 'https://a.example.test' }))).toBe('https://a.example.test')
  })

  it('ignores invalid or non-http configured values', () => {
    const e = env({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'javascript:alert(1)' })
    expect(getTrustedSiteOrigin('evil.test', e)).toBeNull()
  })

  it('uses the Vercel production hostname in production only', () => {
    expect(getTrustedSiteOrigin(null, env({ NODE_ENV: 'production', VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'stickee.example.test' }))).toBe('https://stickee.example.test')
    expect(getTrustedSiteOrigin(null, env({ NODE_ENV: 'production', VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'stickee.example.test' }))).toBe('http://localhost:3000')
  })

  it('fails closed in production when nothing is configured', () => {
    expect(getTrustedSiteOrigin('evil.test', env({ NODE_ENV: 'production' }))).toBeNull()
  })

  it('in development trusts only a localhost request host', () => {
    const e = env({ NODE_ENV: 'development' })
    expect(getTrustedSiteOrigin('localhost:3005', e)).toBe('http://localhost:3005')
    expect(getTrustedSiteOrigin('evil.test', e)).toBe('http://localhost:3000')
    expect(getTrustedSiteOrigin('localhost.evil.test', e)).toBe('http://localhost:3000')
    expect(getTrustedSiteOrigin(null, e)).toBe('http://localhost:3000')
  })

  it('isTrustedOrigin matches the trusted origin exactly', () => {
    const e = env({ NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://stickee.example.test' })
    expect(isTrustedOrigin('https://stickee.example.test', null, e)).toBe(true)
    expect(isTrustedOrigin('https://stickee.example.test.evil.test', null, e)).toBe(false)
    expect(isTrustedOrigin('http://stickee.example.test', null, e)).toBe(false)
    expect(isTrustedOrigin(null, null, e)).toBe(false)
  })
})
