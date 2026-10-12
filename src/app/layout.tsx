import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Serif } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { BottomNav } from '@/components/BottomNav'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider } from '@/components/ui/toast'
import { CommandPalette } from '@/components/CommandPalette'
import { OnboardingController } from '@/components/OnboardingModal'
import { DailyBonusBanner } from '@/components/DailyBonusBanner'
import { PushPermissionBanner } from '@/components/PushPermissionBanner'
import { CookieBanner } from '@/components/CookieBanner'

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

const ibmPlexSerif = IBM_Plex_Serif({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Stickee — Where decisions stick',
  description: 'Understand Australian politics, track your MPs, and take action on the issues that matter.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${ibmPlexSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ToastProvider>
          <TooltipProvider>
            <Navbar />
            <CommandPalette />
            <DailyBonusBanner />
            <PushPermissionBanner />
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <BottomNav />
            <CookieBanner />
            <OnboardingController />
          </TooltipProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
