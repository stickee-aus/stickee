import { randomUUID } from 'node:crypto'

const api = process.env.LOCAL_SUPABASE_URL
const anonKey = process.env.LOCAL_SUPABASE_ANON_KEY
const serviceKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY
const mailpit = process.env.LOCAL_MAILPIT_URL ?? 'http://127.0.0.1:54324'

if (!api?.startsWith('http://127.0.0.1:') && !api?.startsWith('http://localhost:')) {
  throw new Error('Refusing to run: LOCAL_SUPABASE_URL is not loopback.')
}
if (!anonKey || !serviceKey) throw new Error('Missing disposable local Supabase keys.')

const suffix = randomUUID().slice(0, 8)
const password = `Local-only-${randomUUID()}!`
const ordinaryEmail = `qa-ordinary-${suffix}@example.invalid`
const adminEmail = `qa-admin-${suffix}@example.invalid`
const users = []
const results = []

function pass(name) {
  results.push({ name, status: 'PASS' })
  console.log(`PASS ${name}`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function request(path, { key = anonKey, token = key, method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  })
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  return { response, data }
}

async function signUp(email, metadata) {
  const { response, data } = await request('/auth/v1/signup', {
    method: 'POST',
    body: { email, password, data: metadata },
  })
  assert(response.ok && data?.user?.id && data?.access_token, `Sign-up failed (${response.status}).`)
  users.push(data.user.id)
  return data
}

async function postgrest(path, token, options = {}) {
  return request(`/rest/v1/${path}`, { token, ...options })
}

async function cleanup() {
  for (const id of users) {
    await request(`/auth/v1/admin/users/${id}`, {
      key: serviceKey,
      token: serviceKey,
      method: 'DELETE',
    })
  }
}

try {
  const ordinary = await signUp(ordinaryEmail, { handle: `qa_${suffix}`, display_name: 'QA Ordinary' })
  const admin = await signUp(adminEmail, { handle: `qa_admin_${suffix}`, display_name: 'QA Admin' })
  pass('ordinary and administrator fixture sign-up')

  const wrong = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email: ordinaryEmail, password: 'definitely-wrong-password' },
  })
  assert(wrong.response.status === 400, `Wrong-password sign-in returned ${wrong.response.status}.`)

  const signedIn = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email: ordinaryEmail, password },
  })
  assert(signedIn.response.ok && signedIn.data?.access_token, 'Correct password sign-in failed.')
  pass('password sign-in rejects invalid and accepts valid credentials')

  const persisted = await request('/auth/v1/user', { token: signedIn.data.access_token })
  assert(persisted.response.ok && persisted.data?.id === ordinary.user.id, 'Access-token session did not persist.')
  pass('session persistence through authenticated user endpoint')

  const recovery = await request('/auth/v1/recover', {
    method: 'POST',
    body: { email: ordinaryEmail },
  })
  assert(recovery.response.ok, `Password recovery request failed (${recovery.response.status}).`)
  await new Promise(resolve => setTimeout(resolve, 300))
  const mailResponse = await fetch(`${mailpit}/api/v1/messages`)
  const mail = await mailResponse.json()
  const delivered = (mail.messages ?? []).some(message =>
    (message.To ?? []).some(recipient => recipient.Address === ordinaryEmail),
  )
  assert(delivered, 'Mailpit did not receive the recovery email.')
  pass('password recovery request and isolated Mailpit delivery')

  const makeAdmin = await postgrest('app_admins', serviceKey, {
    key: serviceKey,
    method: 'POST',
    body: { user_id: admin.user.id },
    headers: { Prefer: 'return=minimal' },
  })
  assert(makeAdmin.response.ok, `Admin fixture grant failed (${makeAdmin.response.status}).`)

  const ordinaryAdmin = await postgrest('rpc/is_app_admin', ordinary.access_token, { method: 'POST', body: {} })
  const adminAdmin = await postgrest('rpc/is_app_admin', admin.access_token, { method: 'POST', body: {} })
  const anonAdmin = await postgrest('rpc/is_app_admin', anonKey, { method: 'POST', body: {} })
  assert(ordinaryAdmin.data === false && adminAdmin.data === true && anonAdmin.data === false, 'Admin role separation failed.')
  pass('anonymous, ordinary-user and administrator role separation')

  const profileEdit = await postgrest(`user_profiles?user_id=eq.${ordinary.user.id}`, ordinary.access_token, {
    method: 'PATCH',
    body: { display_name: 'QA Ordinary Updated' },
    headers: { Prefer: 'return=representation' },
  })
  assert(profileEdit.response.ok && profileEdit.data?.[0]?.display_name === 'QA Ordinary Updated', 'Ordinary profile edit failed.')
  const scoreForge = await postgrest(`user_profiles?user_id=eq.${ordinary.user.id}`, ordinary.access_token, {
    method: 'PATCH',
    body: { civic_score: 999999 },
  })
  assert(scoreForge.response.status === 401 || scoreForge.response.status === 403, `Civic-score forgery returned ${scoreForge.response.status}.`)
  pass('profile edits allowed while civic-score mutation is denied')

  const notificationInsert = await postgrest('notifications', ordinary.access_token, {
    method: 'POST',
    body: { user_id: ordinary.user.id, type: 'forged', title: 'Forged', body: 'Forged' },
  })
  assert(notificationInsert.response.status === 401 || notificationInsert.response.status === 403, 'Ordinary user forged a notification.')

  const serviceNotification = await postgrest('notifications', serviceKey, {
    key: serviceKey,
    method: 'POST',
    body: { user_id: ordinary.user.id, type: 'test', title: '[TEST FIXTURE] Notice', body: 'Local-only fixture.' },
    headers: { Prefer: 'return=representation' },
  })
  assert(serviceNotification.response.ok && serviceNotification.data?.[0]?.id, 'Service notification fixture failed.')
  const notificationId = serviceNotification.data[0].id
  const markRead = await postgrest(`notifications?id=eq.${notificationId}`, ordinary.access_token, {
    method: 'PATCH', body: { read: true }, headers: { Prefer: 'return=representation' },
  })
  assert(markRead.response.ok && markRead.data?.[0]?.read === true, 'Mark-notification-read failed.')
  const rewriteNotification = await postgrest(`notifications?id=eq.${notificationId}`, ordinary.access_token, {
    method: 'PATCH', body: { title: 'Rewritten' },
  })
  assert(rewriteNotification.response.status === 401 || rewriteNotification.response.status === 403, 'Notification content rewrite was allowed.')
  pass('notification creation/content denied while read-state update succeeds')

  const donationForge = await postgrest('donation_records', ordinary.access_token, {
    method: 'POST',
    body: { user_id: ordinary.user.id, amount_cents: 100, status: 'paid', cadence: 'one_time' },
  })
  assert(donationForge.response.status === 401 || donationForge.response.status === 403, 'Ordinary user forged a paid donation.')
  pass('donation status forgery denied')

  const walletBefore = await postgrest(`user_wallets?user_id=eq.${ordinary.user.id}&select=balance`, ordinary.access_token)
  assert(walletBefore.response.ok && walletBefore.data?.[0]?.balance === 5000, 'Signup wallet was not initialized.')
  const walletForge = await postgrest(`user_wallets?user_id=eq.${ordinary.user.id}`, ordinary.access_token, {
    method: 'PATCH', body: { balance: 999999 }, headers: { Prefer: 'return=representation' },
  })
  assert(!walletForge.response.ok || walletForge.data?.length === 0, 'Direct wallet mutation succeeded.')
  const stake = await postgrest('rpc/place_wallet_stake', ordinary.access_token, {
    method: 'POST',
    body: {
      p_market_id: 'test-market-open',
      p_market_question: '[TEST FIXTURE] Open market',
      p_category: 'bill',
      p_direction: 'yes',
      p_amount: 100,
      p_price: 50,
    },
  })
  assert(stake.response.ok, `Valid local stake failed (${stake.response.status}).`)
  const overStake = await postgrest('rpc/place_wallet_stake', ordinary.access_token, {
    method: 'POST',
    body: {
      p_market_id: 'test-market-open',
      p_market_question: '[TEST FIXTURE] Open market',
      p_category: 'bill',
      p_direction: 'yes',
      p_amount: 999999,
      p_price: 50,
    },
  })
  assert(!overStake.response.ok, 'Over-balance stake succeeded.')
  pass('wallet initialization, direct-mutation denial, valid stake and over-balance denial')

  const prediction = await postgrest('predictions', serviceKey, {
    key: serviceKey,
    method: 'POST',
    body: { user_id: ordinary.user.id, issue_id: 'climate-safeguard', prediction: 'yes' },
    headers: { Prefer: 'return=minimal' },
  })
  assert(prediction.response.ok, `Prediction fixture failed (${prediction.response.status}).`)
  const userAward = await postgrest('rpc/award_prediction_civic_score', ordinary.access_token, {
    method: 'POST',
    body: { p_issue_id: 'climate-safeguard', p_user_id: ordinary.user.id, p_resolved_status: 'passed', p_points: 2 },
  })
  assert(userAward.response.status === 401 || userAward.response.status === 403, 'Ordinary user called civic award RPC.')
  const firstAward = await postgrest('rpc/award_prediction_civic_score', serviceKey, {
    key: serviceKey,
    method: 'POST',
    body: { p_issue_id: 'climate-safeguard', p_user_id: ordinary.user.id, p_resolved_status: 'passed', p_points: 2 },
  })
  const duplicateAward = await postgrest('rpc/award_prediction_civic_score', serviceKey, {
    key: serviceKey,
    method: 'POST',
    body: { p_issue_id: 'climate-safeguard', p_user_id: ordinary.user.id, p_resolved_status: 'passed', p_points: 2 },
  })
  assert(firstAward.data === true && duplicateAward.data === false, 'Civic award was not idempotent.')
  pass('service-only atomic civic-score award and duplicate prevention')

  const signOut = await request('/auth/v1/logout', { token: signedIn.data.access_token, method: 'POST' })
  assert(signOut.response.ok, `Sign-out failed (${signOut.response.status}).`)
  const refresh = await request('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST', body: { refresh_token: signedIn.data.refresh_token },
  })
  assert(!refresh.response.ok, 'Signed-out refresh token remained usable.')
  pass('sign-out revokes session refresh')
} finally {
  await cleanup()
}

console.log(`SUMMARY ${results.length} integration checks passed`)
