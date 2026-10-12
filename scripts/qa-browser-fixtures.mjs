import { readFile, writeFile } from 'node:fs/promises'

const api = process.env.LOCAL_SUPABASE_URL
const serviceKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY
const action = process.argv[2] ?? 'create'
const statePath = '/private/tmp/stickee-browser-fixtures.json'
const password = 'LocalBrowserOnly-2026!'
const fixtures = [
  { email: 'qa-browser-ordinary@example.invalid', handle: 'qa_browser_ordinary', admin: false },
  { email: 'qa-browser-admin@example.invalid', handle: 'qa_browser_admin', admin: true },
]

if (!api?.startsWith('http://127.0.0.1:') && !api?.startsWith('http://localhost:')) {
  throw new Error('Refusing to run outside loopback Supabase.')
}
if (!serviceKey) throw new Error('Missing local service key.')

async function call(path, method, body) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) throw new Error(`Local fixture request failed (${response.status}).`)
  return data
}

if (action === 'cleanup') {
  const state = JSON.parse(await readFile(statePath, 'utf8'))
  for (const id of state.ids) await call(`/auth/v1/admin/users/${id}`, 'DELETE')
  console.log('PASS browser fixtures removed')
} else {
  const ids = []
  for (const fixture of fixtures) {
    const user = await call('/auth/v1/admin/users', 'POST', {
      email: fixture.email,
      password,
      email_confirm: true,
      user_metadata: { handle: fixture.handle, display_name: fixture.admin ? 'QA Browser Admin' : 'QA Browser Ordinary' },
    })
    ids.push(user.id)
    if (fixture.admin) {
      await call('/rest/v1/app_admins', 'POST', { user_id: user.id })
    }
  }
  await writeFile(statePath, JSON.stringify({ ids }), { mode: 0o600 })
  console.log('PASS browser fixtures created')
}
