'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import dynamic from 'next/dynamic'

const CampaignModal = dynamic(
  () => import('@/components/CampaignModal').then(mod => mod.CampaignModal),
  { ssr: false }
)
const EmailMPModal = dynamic(
  () => import('@/components/EmailMPModal').then(mod => mod.EmailMPModal),
  { ssr: false }
)
import { StatusLabel } from '@/components/ui/status-label'
import { MetadataLine } from '@/components/ui/metadata-line'
import { Button } from '@/components/ui/button'
import { parliamentSupportPct } from '@/lib/mock-parliament-data'
import type { BillVoteRow } from '@/lib/mock-parliament-data'
import type { PressureSummary } from '@/app/api/bills/pressure-summary/route'
import type { ActionChoice } from '@/components/CampaignModal'
import type { MP, Issue } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriorityBillFocusProps {
  bill: BillVoteRow
  pressureSummary: PressureSummary | null
  mp: MP | null
  electorate: string | null
  userStance: 'support' | 'oppose' | null
  /** Whether `bill` came from the real, Supabase-backed sync or the illustrative fallback dataset. */
  source: 'database' | 'mock'
  onTakeStance: (billId: string, stance: 'support' | 'oppose') => void
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PriorityBillFocus({
  bill,
  pressureSummary,
  mp,
  electorate,
  userStance,
  source,
  onTakeStance,
}: PriorityBillFocusProps) {
  const [campaignOpen, setCampaignOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)

  const parlPct = parliamentSupportPct(bill)
  const registeredTotal = pressureSummary?.total ?? 0

  const emailIssue: Issue | null = mp ? {
    id: 'priority-bill-contact',
    title: bill.name,
    summary: `I am contacting you as a constituent regarding the ${bill.name}. ${bill.eli15}`,
    content: '',
    whatIsHappening: bill.eli15,
    whoSupports: '',
    whoOpposes: '',
    status: 'active',
  } : null

  function handleCampaignConfirm(stance: 'support' | 'oppose', _action: ActionChoice) {
    onTakeStance(bill.id, stance)
    setCampaignOpen(false)
  }

  return (
    <div className="border border-border border-l-4 border-l-foreground overflow-hidden">
      <div className="p-5 sm:p-6">
        {/* Header: label + source classification */}
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <span className="text-micro-label">Current priority item</span>
          {source === 'mock' && <StatusLabel status="demo" />}
        </div>

        {/* Bill title */}
        <h2 className="font-heading text-xl font-semibold text-foreground leading-tight mb-2">
          {bill.name}
        </h2>

        {/* Plain English summary */}
        <p className="text-body-copy text-muted-foreground leading-relaxed mb-4">
          {bill.eli15}
        </p>

        <MetadataLine
          source={source === 'database' ? 'TheyVoteForYou · Parliament of Australia' : 'Illustrative demo data'}
          verification={source === 'database' ? 'verified' : 'demo'}
          className="mb-5"
        />

        {/* Real vote tally — computed from totalFor/totalAgainst/totalAbstain */}
        <div className="mb-4 border border-border p-4">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <p className="text-sm text-foreground">
              <span className="font-mono font-semibold">{parlPct}%</span>
              <span className="text-muted-foreground"> of recorded votes are for this bill</span>
            </p>
            <p className="text-metadata normal-case tracking-normal text-muted-foreground">
              {bill.totalFor} for · {bill.totalAgainst} against{bill.totalAbstain > 0 ? ` · ${bill.totalAbstain} abstained` : ''}
            </p>
          </div>
        </div>

        {/* How can I influence this? */}
        <div className="space-y-3">
          <p className="text-micro-label">How can I influence this?</p>

          {userStance ? (
            <div className="border border-border px-4 py-3">
              <p className="text-sm text-foreground">
                You&apos;re {userStance === 'support' ? 'supporting' : 'opposing'} this bill.{' '}
                <span className="text-muted-foreground">
                  {registeredTotal > 0
                    ? `${registeredTotal.toLocaleString()} Australians have registered a position.`
                    : 'You are the first to register a position on this bill.'}
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Button onClick={() => setCampaignOpen(true)} className="w-full sm:w-auto">
                Register a position
              </Button>
              <p className="text-xs text-muted-foreground">
                {registeredTotal > 0
                  ? `${registeredTotal.toLocaleString()} Australians have registered a position on this bill. `
                  : ''}
                This adds to a real, public tally — it does not notify any MP directly.
              </p>
            </div>
          )}

          {emailIssue && mp && (
            <button
              onClick={() => setEmailOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:opacity-70 transition-calm"
            >
              <Mail size={12} />
              Contact {mp.name.split(' ')[0]} — opens a real, addressed email draft
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <CampaignModal
        bill={bill}
        initialStance="support"
        open={campaignOpen}
        onOpenChange={open => { if (!open) setCampaignOpen(false) }}
        onConfirm={handleCampaignConfirm}
        electorate={electorate}
        pressureSummary={pressureSummary}
      />

      {emailIssue && mp && (
        <EmailMPModal
          issue={emailIssue}
          open={emailOpen}
          onOpenChange={setEmailOpen}
        />
      )}
    </div>
  )
}
