import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../../..')
const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8')

describe('security hardening (static guards)', () => {
  it('supabase-admin is server-only', () => {
    expect(read('src/lib/supabase-admin.ts')).toMatch(/^import 'server-only'/m)
  })

  it.each([
    'src/app/auth/sign-in/actions.ts',
    'src/app/auth/sign-up/actions.ts',
    'src/app/auth/forgot-password/actions.ts',
    'src/app/api/donations/checkout/route.ts',
    'src/app/auth/callback/route.ts',
  ])('%s does not read x-forwarded-host or the Origin header', file => {
    const src = read(file)
    expect(src).not.toMatch(/get\(['"]x-forwarded-(host|proto)['"]\)/i)
    expect(src).not.toMatch(/headers?(Store)?\.get\(['"]origin['"]\)/i)
    expect(src).toContain('getTrustedSiteOrigin')
  })

  it('checkout sends an Idempotency-Key header', () => {
    expect(read('src/app/api/donations/checkout/route.ts')).toContain("'Idempotency-Key'")
  })

  it('donate success page never writes to the database or imports the admin client', () => {
    const src = read('src/app/donate/success/page.tsx')
    expect(src).not.toMatch(/supabase-admin|service_role|SERVICE_ROLE|\.update\(|\.insert\(|\.upsert\(/)
    expect(src).toContain('retrieveCheckoutSession')
    expect(src).toContain('verifyDonationSession')
  })

  it('no stripe library dependency is added', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })).not.toContain('stripe')
  })
})
