import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const WIDTHS = {
  narrow: 'max-w-2xl',
  default: 'max-w-5xl',
  wide: 'max-w-6xl',
} as const

export interface PageShellProps extends ComponentProps<'div'> {
  width?: keyof typeof WIDTHS
}

/**
 * Canonical page container: width, background, gutters, vertical rhythm.
 * Every top-level page should wrap its content in this rather than a
 * one-off max-width/mx-auto combination.
 */
export function PageShell({ className, width = 'default', children, ...props }: PageShellProps) {
  return (
    <div className="min-h-full bg-background">
      <div className={cn('mx-auto w-full px-5 py-10 md:px-8', WIDTHS[width], className)} {...props}>
        {children}
      </div>
    </div>
  )
}
