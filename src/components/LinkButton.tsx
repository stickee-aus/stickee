'use client'

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { VariantProps } from 'class-variance-authority'

type ButtonVariantProps = VariantProps<typeof buttonVariants>

interface LinkButtonProps extends ButtonVariantProps {
  href: string
  children: React.ReactNode
  className?: string
  external?: boolean
}

export function LinkButton({ href, children, className, variant, size, external }: LinkButtonProps) {
  const cls = cn(buttonVariants({ variant, size }), className)

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  )
}
