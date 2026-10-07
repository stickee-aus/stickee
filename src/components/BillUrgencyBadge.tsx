import { Clock, Flame, AlertTriangle, Zap } from 'lucide-react'
import type { BillUrgency } from '@/lib/mock-parliament-data'

interface BillUrgencyBadgeProps {
  urgency: BillUrgency
  countdown?: string
}

const CONFIG: Record<BillUrgency, {
  label: string
  icon: React.ComponentType<{ size?: number }>
  color: string
  borderColor: string
}> = {
  'swing-vote': {
    label: 'Swing Vote',
    icon: Flame,
    color: '#f04747',
    borderColor: '#3a1414',
  },
  'highly-contested': {
    label: 'Highly Contested',
    icon: AlertTriangle,
    color: '#f5a623',
    borderColor: '#3a2e10',
  },
  'closing-soon': {
    label: 'Closing Soon',
    icon: Clock,
    color: '#f5a623',
    borderColor: '#3a2e10',
  },
  'just-moved': {
    label: 'Just Moved',
    icon: Zap,
    color: '#2ec266',
    borderColor: '#0e3020',
  },
}

const PULSE_URGENCIES: BillUrgency[] = ['closing-soon', 'swing-vote']

export function BillUrgencyBadge({ urgency, countdown }: BillUrgencyBadgeProps) {
  const { label, icon: Icon, color, borderColor } = CONFIG[urgency]
  const displayLabel = urgency === 'closing-soon' && countdown ? countdown : label
  const showPulse = PULSE_URGENCIES.includes(urgency)
  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
      style={{ color, borderColor }}
    >
      {showPulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      <Icon size={8} />
      {displayLabel}
    </span>
  )
}
