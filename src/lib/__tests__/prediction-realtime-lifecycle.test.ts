import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const harness = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>,
  createClient: vi.fn(),
}))
vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: (effect: () => void | (() => void)) => { harness.effects.push(effect) },
  useState: (value: unknown) => [value, vi.fn()],
  useMemo: (compute: () => unknown) => compute(),
}))
vi.mock('@/lib/supabase', () => ({ createClient: harness.createClient }))
vi.mock('@/lib/supabase-config', () => ({ isSupabaseConfigured: true }))
vi.mock('@/hooks/usePredictionWallet', () => ({ usePredictionWallet: () => ({ openPositions: [], authenticated: false }) }))
vi.mock('@/hooks/useLiveElection', () => ({ useLiveElection: () => ({ data: { active: false } }) }))
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ toast: vi.fn() }) }))
import { PredictionsPageClient } from '@/components/PredictionsPageClient'

function mountEffects() {
  harness.effects = []
  PredictionsPageClient({ initialBillMarkets: [], issueSummaries: {} })
  return harness.effects.map(effect => effect())
}

describe('forecast Realtime subscription lifecycle', () => {
  let client: ReturnType<typeof createSupabaseClient>
  beforeEach(() => {
    client = createSupabaseClient('http://127.0.0.1:54321', 'local-test-placeholder', {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const channel = client.channel.bind(client)
    vi.spyOn(client, 'channel').mockImplementation((...args) => {
      const result = channel(...args)
      // Keep the SDK's actual topic lookup and on() guard. Suppress only the
      // socket connection; mark the channel joined as the server would.
      vi.spyOn(result, 'subscribe').mockImplementation(() => {
        result.state = 'joined' as typeof result.state
        return result
      })
      return result
    })
    // Model an unsubscribe that has not yet finished: the old channel remains
    // discoverable in the SDK while the replacement effect starts.
    vi.spyOn(client, 'removeChannel').mockImplementation(() => new Promise(() => {}))
    harness.createClient.mockReturnValue(client)
  })
  afterEach(() => { vi.restoreAllMocks() })

  it('reproduces the installed SDK failure when a subscribed topic is reused', () => {
    client.channel('control').on('postgres_changes', { event: '*', schema: 'public' }, () => {}).subscribe()
    expect(() => client.channel('control').on('postgres_changes', { event: '*', schema: 'public' }, () => {}))
      .toThrow('after `subscribe()`')
  })

  it('survives Strict Mode cleanup and remount before channel removal completes', async () => {
    const first = mountEffects()
    const original = client.getChannels()[0]
    expect(original).toBeDefined()
    first.forEach(cleanup => cleanup?.())
    expect(client.removeChannel).toHaveBeenCalledWith(original)
    const second = mountEffects()
    expect(client.getChannels()).toHaveLength(2)
    expect(new Set(client.getChannels().map(channel => channel.topic)).size).toBe(2)
    second.forEach(cleanup => cleanup?.())
    expect(client.removeChannel).toHaveBeenCalledTimes(2)
    await Promise.resolve()
    expect(client.channel).toHaveBeenCalledTimes(2)
  })

  it('does not share a subscribed channel between simultaneous component instances', () => {
    const first = mountEffects()
    const second = mountEffects()
    expect(client.getChannels()).toHaveLength(2)
    for (const channel of client.getChannels()) {
      expect(channel.bindings.postgres_changes).toHaveLength(1)
      expect(channel.bindings.postgres_changes[0].filter.table).toBe('issue_markets')
    }
    first.forEach(cleanup => cleanup?.())
    second.forEach(cleanup => cleanup?.())
    expect(client.removeChannel).toHaveBeenNthCalledWith(1, client.getChannels()[0])
    expect(client.removeChannel).toHaveBeenNthCalledWith(2, client.getChannels()[1])
  })
})
