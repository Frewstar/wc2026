'use client'

import { useEffect, useState } from 'react'
import { TeamFlag } from './TeamFlag'
import { computeGroupStandings, type GroupStandings } from '@/lib/standings'
import type { Result } from '@/lib/scoring'
import { LoadingState } from './ui'

export function GroupStandingsTable() {
  const [standings, setStandings] = useState<GroupStandings[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/results')
      .then(r => r.json())
      .then(d => {
        setStandings(computeGroupStandings((d.results ?? []) as Result[]))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState label="Loading standings" />

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {standings.map(({ group, teams }) => (
        <div key={group} className="glass-card overflow-hidden">
          <div className="px-3 py-2 bg-pitch-muted/50 border-b border-theme">
            <span className="font-display font-bold text-sm text-pitch-light">Group {group}</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-faint border-b border-theme">
                <th className="text-left py-1.5 pl-2 font-medium">Team</th>
                <th className="w-6 text-center font-medium">P</th>
                <th className="w-6 text-center font-medium">GD</th>
                <th className="w-8 text-center font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t, i) => (
                <tr
                  key={t.team}
                  className={`border-b border-theme/50 last:border-0 ${i < 2 ? 'bg-pitch-muted/20' : ''}`}
                >
                  <td className="py-1.5 pl-2">
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <TeamFlag team={t.team} size={16} />
                      <span className="truncate font-medium text-ink">{t.team}</span>
                    </span>
                  </td>
                  <td className="text-center text-ink-muted">{t.played}</td>
                  <td className="text-center text-ink-muted">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                  <td className="text-center font-display font-bold text-ink">{t.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
