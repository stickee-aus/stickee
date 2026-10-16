import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getOpenInquiries, daysUntil, formatCountdown } from '@/lib/open-inquiries-db'
import { SectionHeader } from '@/components/ui/section-header'
import { EmptyState } from '@/components/ui/empty-state'
import { BillUrgencyBadge } from '@/components/BillUrgencyBadge'

export async function OpenInquiries() {
  const inquiries = await getOpenInquiries()

  return (
    <section>
      <SectionHeader
        title="Open inquiries"
        description="Committee inquiries still accepting public submissions."
        action={
          <Link href="https://www.aph.gov.au/Parliamentary_Business/Committees" className="inline-flex items-center gap-1 font-medium text-foreground">
            See all on APH <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="mt-6">
        {inquiries.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {inquiries.map(inquiry => {
              const days = daysUntil(inquiry.closes_on)
              return (
                <a
                  key={inquiry.id}
                  href={inquiry.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[var(--radius-lg)] border border-border bg-card p-5 transition-calm hover:border-foreground/30"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium text-foreground">{inquiry.title}</h3>
                    <BillUrgencyBadge
                      urgency={days <= 3 ? 'closing-soon' : 'just-moved'}
                      countdown={formatCountdown(days)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{inquiry.committee}</p>
                </a>
              )
            })}
          </div>
        ) : (
          <EmptyState
            variant="no-data"
            title="No open inquiries right now."
            description="Check back when a new inquiry opens for submissions."
            action={
              <Link href="https://www.aph.gov.au/Parliamentary_Business/Committees" className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                Browse APH committees <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
        )}
      </div>
    </section>
  )
}
