'use client'

import { usePathname } from 'next/navigation'
import { ThemeProvider } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'
import { HeroBanner, CompactHeader } from './HeroBanner'
import { APP_NAME, POWERED_BY } from '@/lib/app-config'

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03] theme-stripe"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, var(--stripe-color) 40px, var(--stripe-color) 41px)',
        }}
      />

      <div className="relative max-w-lg mx-auto px-4 py-6 min-h-screen flex flex-col">
        <div className="flex justify-end mb-2">
          <ThemeToggle />
        </div>

        {isHome ? <HeroBanner /> : <CompactHeader />}

        <main className="flex-1 animate-slide-up">
          {children}
        </main>

        <footer className="mt-12 pt-6 border-t border-theme text-center space-y-1.5">
          <p className="text-[11px] text-ink-faint tracking-wide">
            {APP_NAME}
          </p>
          <p className="text-xs text-ink-muted">
            Built and powered by{' '}
            <span className="text-pitch-light font-semibold">{POWERED_BY}</span>
          </p>
        </footer>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ShellInner>{children}</ShellInner>
    </ThemeProvider>
  )
}
