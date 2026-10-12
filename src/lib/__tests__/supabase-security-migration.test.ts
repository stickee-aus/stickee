import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '../../..')
const migration = readFileSync(
  path.join(root, 'supabase/migrations/027_payment_admin_and_profile_security.sql'),
  'utf8',
)

describe('prepared Supabase security migration', () => {
  it('atomically claims and retries Stripe events without exposing the RPC', () => {
    expect(migration).toContain('create table if not exists public.stripe_webhook_events')
    expect(migration).toContain('on conflict (event_id) do update')
    expect(migration).toContain("status = 'failed'")
    expect(migration).toContain("processing_started_at < now() - interval '5 minutes'")
    expect(migration).toContain('revoke all on function public.claim_stripe_webhook_event')
    expect(migration).toContain('to service_role;')
  })

  it('removes client authority to forge donation and notification content', () => {
    expect(migration).toContain('drop policy if exists "Users can create own donation records"')
    expect(migration).toContain('revoke insert, update, delete on public.donation_records from anon, authenticated')
    expect(migration).toContain('drop policy if exists "Service role can insert notifications"')
    expect(migration).toContain('grant update (read) on public.notifications to authenticated')
  })

  it('removes civic_score from ordinary profile mutation and awards atomically', () => {
    expect(migration).toContain('revoke insert, update, delete on public.user_profiles from anon, authenticated')
    expect(migration).toContain('grant update (')
    expect(migration.replaceAll('\n', ' ')).not.toMatch(/grant update \([^)]*civic_score/)
    expect(migration).toContain('create table if not exists public.prediction_civic_awards')
    expect(migration).toContain('on conflict (issue_id, user_id) do nothing')
    expect(migration).toContain('civic_score = coalesce(civic_score, 0) + p_points')
  })

  it('closes default PUBLIC execution on privileged existing functions', () => {
    expect(migration).toContain('revoke all on function public.is_app_admin() from public')
    expect(migration).toContain('grant execute on function public.is_app_admin() to anon, authenticated, service_role')
    expect(migration).toContain('revoke all on function public.increment_feed_count(text, text) from public, anon, authenticated')
    expect(migration).toContain('set search_path = public')
  })
})
