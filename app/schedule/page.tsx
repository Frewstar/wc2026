'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/ui'
import { GroupsWithFixtures } from '@/components/GroupsWithFixtures'
import { TOURNAMENT } from '@/lib/schedule-links'
import { TeamFlag } from '@/components/TeamFlag'
import { GROUP_ROUNDS, KNOCKOUT_ROUNDS } from '@/lib/rounds'

export default function SchedulePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Tournament Schedule"
        subtitle={`${TOURNAMENT.dates} · ${TOURNAMENT.teams} teams · ${TOURNAMENT.groups} groups`}
        actions={
          <Link href="/scores" className="text-xs font-semibold text-pitch-light hover:text-pitch transition-colors">
            Live scores
          </Link>
        }
      />

      <div className="glass-card p-5">
        <p className="section-label mb-3">Host nations</p>
        <div className="flex justify-center gap-6">
          {TOURNAMENT.hosts.map(nation => (
            <div key={nation} className="flex flex-col items-center gap-1.5">
              <TeamFlag team={nation} size={32} />
              <span className="text-xs text-ink-muted font-medium">{nation}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="section-label">Groups, standings &amp; fixtures</p>
        <GroupsWithFixtures />
      </div>

      <div className="glass-card p-5 space-y-4">
        <p className="section-label">How this maps to your picks</p>
        <div>
          <p className="text-sm font-semibold text-ink mb-2">Group stage</p>
          <ul className="space-y-1.5">
            {GROUP_ROUNDS.map(r => (
              <li key={r.num} className="text-sm text-ink-muted flex gap-2">
                <span className="text-pitch-light font-display font-bold text-xs w-6">{r.short}</span>
                {r.label} — pick any team playing that matchday
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink mb-2">Knockout stage</p>
          <ul className="space-y-1.5">
            {KNOCKOUT_ROUNDS.map(r => (
              <li key={r.num} className="text-sm text-ink-muted flex gap-2">
                <span className="text-pitch-light font-display font-bold text-xs w-6">{r.short}</span>
                {r.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Link href="/" className="btn-secondary w-full text-center text-sm py-2.5 block">
        Home
      </Link>
    </div>
  )
}
