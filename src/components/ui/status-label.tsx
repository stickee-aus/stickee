import { cn } from '@/lib/utils'

export type Status =
  | 'active'
  | 'proposed'
  | 'passed'
  | 'resolved'
  | 'voided'
  | 'unavailable'
  | 'demo'

interface StatusConfig {
  label: string
  color: string
}

const STATUS_CONFIG: Record<Status, StatusConfig> = {
  active: { label: 'Active', color: 'var(--status-positive)' },
  proposed: { label: 'Proposed', color: 'var(--status-pending)' },
  passed: { label: 'Passed', color: 'var(--status-positive)' },
  resolved: { label: 'Resolved', color: 'var(--status-positive)' },
  voided: { label: 'Voided', color: 'var(--status-negative)' },
  unavailable: { label: 'Unavailable', color: 'var(--status-negative)' },
  demo: { label: 'Demo', color: 'var(--status-pending)' },
}

export interface StatusLabelProps {
  status: Status
  label?: string
  className?: string
}

/**
 * Text-first status tag. Colour reinforces meaning but is never the only
 * signal — the label always renders, and there is no filled colour pill.
 */
export function StatusLabel({ status, label, className }: StatusLabelProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'text-micro-label inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5',
        className
      )}
      style={{ color: config.color, borderColor: config.color }}
    >
      {label ?? config.label}
    </span>
  )
}
