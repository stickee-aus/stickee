import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '../../..')
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')
const adminPages = [
  'src/app/admin/page.tsx',
  'src/app/admin/activity/page.tsx',
  'src/app/admin/agents/page.tsx',
  'src/app/admin/agents/[id]/page.tsx',
  'src/app/admin/analytics/page.tsx',
  'src/app/admin/markets/page.tsx',
  'src/app/admin/users/page.tsx',
]

describe('administrator data boundaries', () => {
  it.each(adminPages)('%s checks admin status before creating a service client', file => {
    const source = read(file)
    const check = source.indexOf("if (!(await getAdminUser()).isAdmin) return null")
    const privilegedRead = source.indexOf('createAdminSupabaseClient()', check)
    expect(check).toBeGreaterThan(-1)
    expect(privilegedRead).toBeGreaterThan(check)
  })

  it('marks the service-role factory server-only', () => {
    expect(read('src/lib/supabase-admin.ts')).toMatch(/^import 'server-only'/)
  })

  it('does not mutate the admin table during an authorization check', () => {
    expect(read('src/lib/admin-auth.ts')).not.toContain("from('app_admins').upsert")
  })

  it('renders header authentication from the server-verified status endpoint', () => {
    const source = read('src/components/AuthButton.tsx')
    expect(source).toContain('if (auth.authenticated)')
    expect(source).not.toContain('supabase.auth.getUser()')
  })

  it('uses an instance-scoped realtime topic for notifications', () => {
    const source = read('src/hooks/useNotifications.ts')
    expect(source).toContain('crypto.randomUUID()')
    expect(source).toContain('notifications:${uid}:${channelInstanceId}')
    expect(source).toContain('await supabase.removeChannel(previousChannel)')
  })
})
