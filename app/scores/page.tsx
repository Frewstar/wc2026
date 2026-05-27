'use client'

import Script from 'next/script'
import Link from 'next/link'
import { PageHeader } from '@/components/ui'
import { useTheme } from '@/components/ThemeProvider'
import { GroupsWithFixtures } from '@/components/GroupsWithFixtures'

export default function ScoresPage() {
  const { theme } = useTheme()
  const widgetTheme = theme === 'light' ? 'light' : 'dark'
  const apiKey = process.env.NEXT_PUBLIC_API_SPORTS_KEY ?? ''

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Scores & Standings"
        actions={
          <Link
            href="/schedule"
            className="text-xs font-semibold text-pitch-light hover:text-pitch transition-colors"
          >
            Full schedule
          </Link>
        }
      />

      <div className="space-y-3">
        <p className="section-label">Groups, standings &amp; results</p>
        <GroupsWithFixtures />
      </div>

      {apiKey && (
        <>
          <div className="space-y-3">
            <p className="section-label">API-Football live feed</p>
            <div className="glass-card p-1 overflow-hidden">
              <div
                key={`games-${widgetTheme}`}
                id="wg-api-football-games"
                data-host="v3.football.api-sports.io"
                data-key={apiKey}
                data-league="1"
                data-season="2026"
                data-theme={widgetTheme}
                data-refresh="30"
                className="w-full"
              />
            </div>
          </div>

          <Script
            src="https://widgets.api-sports.io/2.0.3/widgets.js"
            strategy="afterInteractive"
          />
        </>
      )}
    </div>
  )
}
