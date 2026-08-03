import {
  allMarkets,
  type PredictionMarket,
} from '@/lib/mock-market-data'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  mapIssueMarketRecordToPredictionMarket,
  type IssueMarketRecord,
} from '@/lib/issues-data'

export async function getLiveBillMarkets(): Promise<PredictionMarket[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('issue_markets')
      .select('issue_id, question, category, status, probability, total_participants, resolves_by, yes_change, yes_volume, no_volume, yes_history')
      .eq('is_test_fixture', false)
      .order('updated_at', { ascending: false })

    if (error || !data || data.length === 0) {
      return allMarkets.filter(market => market.category === 'bill')
    }

    return (data as IssueMarketRecord[]).map(mapIssueMarketRecordToPredictionMarket)
  } catch {
    return allMarkets.filter(market => market.category === 'bill')
  }
}

export function getStaticNonBillMarkets(): PredictionMarket[] {
  return allMarkets.filter(market => market.category !== 'bill')
}
