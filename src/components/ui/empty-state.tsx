import { type LucideIcon, FileQuestion, TrendingUp, LogIn, Ban, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EmptyStateVariant =
  | 'no-data'
  | 'no-forecasts'
  | 'signed-out'
  | 'unavailable'
  | 'load-error'

interface VariantPreset {
  icon: LucideIcon
  title: string
  description: string
}

const VARIANT_PRESETS: Record<EmptyStateVariant, VariantPreset> = {
  'no-data': {
    icon: FileQuestion,
    title: 'No verified data available',
    description: 'We don’t have sourced information for this yet.',
  },
  'no-forecasts': {
    icon: TrendingUp,
    title: 'No active forecasts',
    description: 'Check back once a new forecast opens.',
  },
  'signed-out': {
    icon: LogIn,
    title: 'Sign in to continue',
    description: 'This is only available to signed-in accounts.',
  },
  unavailable: {
    icon: Ban,
    title: 'Not available right now',
    description: 'This feature isn’t enabled yet.',
  },
  'load-error': {
    icon: AlertTriangle,
    title: 'Couldn’t load this',
    description: 'Something went wrong retrieving this data. Try again.',
  },
}

interface EmptyStateProps {
  variant?: EmptyStateVariant
  icon?: LucideIcon
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

/**
 * Canonical, truthful empty state. Pass a `variant` for one of the standard
 * cases (no-data, no-forecasts, signed-out, unavailable, load-error), or
 * override icon/title/description directly for a bespoke message — never
 * fall back to fabricated placeholder content.
 */
export function EmptyState({ variant, icon, title, description, action, className }: EmptyStateProps) {
  const preset = variant ? VARIANT_PRESETS[variant] : undefined
  const Icon = icon ?? preset?.icon
  const resolvedTitle = title ?? preset?.title ?? 'No verified data available'
  const resolvedDescription = description ?? preset?.description

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-border bg-muted/40">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{resolvedTitle}</p>
        {resolvedDescription && <p className="text-xs text-muted-foreground">{resolvedDescription}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
