import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createInterface } from 'node:readline'

// No .env files are loaded by this launcher. Explicit test credentials only.
const mode = process.argv[2] ?? 'check'
assert(['check', 'start'].includes(mode), 'Use check or start.')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const localPath = process.env.STICKEE_QA_LOCAL_CONFIG ?? '/private/tmp/stickee-qa-env.json'
const local = JSON.parse(await readFile(localPath, 'utf8'))
const api = new URL(local.api)
assert(['localhost', '127.0.0.1', '[::1]'].includes(api.hostname), 'Refusing non-loopback Supabase.')
assert.equal(api.protocol, 'http:')
assert(local.anon && local.service, 'Local keys are required.')
const key = process.env.STRIPE_SECRET_KEY ?? ''
assert(!key || key.startsWith('sk_test_'), 'Only sk_test_ keys are accepted; live/restricted/unidentified keys are refused.')
const port = Number(process.env.STICKEE_QA_PORT ?? 3001)
assert(Number.isInteger(port) && port >= 1024 && port <= 65535, 'Invalid QA port.')
const target = `http://127.0.0.1:${port}/api/donations/webhook`
const events = 'checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired'
console.log(`Local Supabase: ${api.origin}; Stripe: test only; forwarding: ${target}`)
console.log(`Events: ${events}`)
if (mode === 'check') {
  console.log(key ? 'Test key supplied; not contacted in check mode.' : 'AUTHENTICATION REQUIRED: supply a fresh sk_test_ key privately before start.')
  console.log('STRIPE_LOCAL_PREFLIGHT_PASS')
} else {
  assert(key, 'Authentication required: provide STRIPE_SECRET_KEY privately; do not paste it in chat.')
  const temporary = '/private/tmp/stickee-stripe-qa'
  await mkdir(temporary, { recursive: true, mode: 0o700 })
  const configPath = path.join(temporary, 'config.toml')
  await writeFile(configPath, 'color = "off"\n', { mode: 0o600 })
  const command = process.env.STRIPE_CLI ?? 'npx'
  const prefix = process.env.STRIPE_CLI ? [] : ['--yes', '@stripe/cli@1.53.1']
  const cliEnv = { ...process.env, STRIPE_API_KEY: key, STRIPE_DEVICE_NAME: 'stickee-local-qa' }
  const common = ['--config', configPath, '--project-name', 'stickee-local-qa']
  // Capture the secret without printing it, putting it in argv, or saving it to the repo.
  let secret
  try {
    const output = execFileSync(command, [...prefix, ...common, 'listen', '--events-from', '@self', '--events', events, '--print-secret', '--skip-update'], {
      env: cliEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000,
    })
    secret = output.match(/whsec_[A-Za-z0-9]+/)?.[0]
  } catch {
    throw new Error('Stripe test authentication failed or timed out; no app process was started.')
  }
  assert(secret, 'Stripe did not supply a signing secret.')
  const env = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: api.origin,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: local.anon,
    SUPABASE_SERVICE_ROLE_KEY: local.service,
    NEXT_PUBLIC_SUPABASE_DISABLED: 'false',
    NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
    STRIPE_SECRET_KEY: key,
    STRIPE_WEBHOOK_SECRET: secret,
    THEYVOTEFORYOU_API_KEY: '', SYNC_SECRET: '',
    STICKEE_ADMIN_EMAILS: '', ADMIN_EMAILS: '', STICKEE_ADMIN_USER_IDS: '', ADMIN_USER_IDS: '',
  }
  // Next dev uses one .next/dev lock per checkout. Stop the earlier local QA
  // process before start; this launcher never terminates unrelated processes.
  const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] })
  const children = [app]
  const logRedacted = stream => createInterface({ input: stream }).on('line', line => console.log(line.replaceAll(key, '[REDACTED]').replaceAll(secret, '[REDACTED]')))
  for (const stream of [app.stdout, app.stderr]) logRedacted(stream)
  const stop = () => children.forEach(child => child.kill('SIGTERM'))
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stop)
  app.on('exit', () => stop())
  app.on('error', () => { console.error('QA app launch failed.'); stop() })
  // Wait for this newly launched server before forwarding events.
  let ready = false
  for (let attempt = 0; attempt < 60 && app.exitCode === null; attempt++) {
    try { ready = (await fetch(`http://127.0.0.1:${port}/donate`, { signal: AbortSignal.timeout(2000) })).ok } catch { /* starting */ }
    if (ready) break
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  if (!ready) { stop(); throw new Error('QA app did not become ready; forwarding was not started.') }
  const listener = spawn(command, [...prefix, ...common, 'listen', '--events-from', '@self', '--events', events, '--forward-to', target, '--skip-update'], { env: cliEnv, stdio: ['ignore', 'pipe', 'pipe'] })
  children.push(listener)
  for (const stream of [listener.stdout, listener.stderr]) logRedacted(stream)
  listener.on('error', () => { console.error('Stripe listener launch failed.'); stop() })
  listener.on('exit', () => stop())
  console.log('Test forwarding started. Ctrl-C stops both local processes. No hosted endpoint or migration created.')
}
