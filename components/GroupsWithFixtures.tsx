'use client'

import { useEffect, useMemo, useState } from 'react'
import { TeamFlag } from './TeamFlag'
import { LoadingState } from './ui'
import { WC_GROUPS, GROUP_LETTERS, getTeamGroup } from '@/lib/wc-groups'
import { computeGroupStandings } from '@/lib/standings'
import { formatUKKickoff } from '@/lib/uk-time'
import type { Fixture, Result } from '@/lib/scoring'

type Props = {
  /** If true, show only the fixture/result part (no standings) */
  fixturesOnly?: boolean
  /** Highlight a specific team */
  highlightTeam?: string
}

function Badge({ children, variant }: { children: React.ReactNode; variant: 'win' | 'draw' | 'loss' | 'pending' }) {
  const cls = {
    win: 'bg-emerald-500/20 text-emerald-400',
    draw: 'bg-sky-500/15 text-sky-400',
    loss: 'bg-red-500/15 text-red-400',
    pending: 'bg-pitch-muted text-pitch-light',
  }[variant]
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cls}`}>{children}</span>
}

function ScoreDisplay({
  result,
  kickoff,
  homeTeam,
}: {
  result?: Result
  kickoff?: string | null
  homeTeam: string
}) {
  if (result) {
    const variant =
      result.home_goals > result.away_goals ? 'win'
      : result.home_goals < result.away_goals ? 'loss'
      : 'draw'
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-display font-bold text-ink text-sm tabular-nums">
          {result.home_goals}–{result.away_goals}
        </span>
        <Badge variant={variant}>
          {variant === 'win' ? 'W' : variant === 'draw' ? 'D' : 'L'}
        </Badge>
      </div>
    )
  }
  if (kickoff) {
    const now = Date.now()
    const ko = new Date(kickoff).getTime()
    if (ko <= now) {
      return <span className="text-[11px] font-semibold text-amber-400">Live</span>
    }
    return (
      <span className="text-[11px] font-semibold text-pitch-light text-center leading-tight">
        {formatUKKickoff(kickoff)}
      </span>
    )
  }
  return <span className="text-ink-faint text-xs">vs</span>
}

export function GroupsWithFixtures({ fixturesOnly = false, highlightTeam }: Props) {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(GROUP_LETTERS))

  const load = () => {
    Promise.all([
      fetch('/api/fixtures').then(r => r.json()),
      fetch('/api/results').then(r => r.json()),
    ]).then(([f, r]) => {
      setFixtures(f.fixtures ?? [])
      setResults(r.results ?? [])
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  const standings = useMemo(() => computeGroupStandings(results), [results])

  const resultMap = useMemo(() => {
    const m = new Map<string, Result>()
    for (const r of results) {
      m.set(`${r.round}-${r.home_team}-${r.away_team}`, r)
    }
    return m
  }, [results])

  const fixturesByGroup = useMemo(() => {
    const map: Record<string, Fixture[]> = {}
    for (const letter of GROUP_LETTERS) map[letter] = []

    for (const f of fixtures) {
      // Only group stage rounds
      const round = Number(f.round)
      if (round < 1 || round > 3) continue
      // Assign to group using either team name (resilient against name mismatches)
      const group = getTeamGroup(f.home_team) ?? getTeamGroup(f.away_team)
      if (group && map[group]) map[group].push(f)
    }

    for (const letter of GROUP_LETTERS) {
      map[letter].sort((a, b) => {
        const ra = Number(a.round), rb = Number(b.round)
        if (ra !== rb) return ra - rb
        if (a.kickoff && b.kickoff) return a.kickoff.localeCompare(b.kickoff)
        return (a.match_slot ?? 99) - (b.match_slot ?? 99)
      })
    }
    return map
  }, [fixtures])

  const toggle = (letter: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(letter)) next.delete(letter)
      else next.add(letter)
      return next
    })
  }

  if (loading) return <LoadingState label="Loading fixtures" />

  return (
    <div className="space-y-3">
      {GROUP_LETTERS.map(letter => {
        const groupFixtures = fixturesByGroup[letter]
        const groupStandings = standings.find(s => s.group === letter)
        const isOpen = openGroups.has(letter)
        const teams = WC_GROUPS[letter]

        // Count played games
        const played = groupFixtures.filter(f =>
          resultMap.has(`${f.round}-${f.home_team}-${f.away_team}`)
        ).length

        return (
          <div key={letter} className="glass-card overflow-hidden">
            {/* Group header – tap to collapse */}
            <button
              onClick={() => toggle(letter)}
              className="w-full flex items-center justify-between px-4 py-3 bg-pitch-muted/40 border-b border-theme hover:bg-pitch-muted/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-pitch-light text-sm">Group {letter}</span>
                <div className="flex gap-1">
                  {teams.map(t => <TeamFlag key={t} team={t} size={16} />)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {played > 0 && (
                  <span className="text-[10px] text-ink-faint">{played}/6 played</span>
                )}
                <svg
                  className={`w-3.5 h-3.5 text-ink-faint transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <>
                {/* Standings (compact) */}
                {!fixturesOnly && groupStandings && (
                  <table className="w-full text-xs border-b border-theme">
                    <thead>
                      <tr className="text-ink-faint border-b border-theme/50">
                        <th className="text-left py-1.5 pl-3 font-medium">Team</th>
                        <th className="w-6 text-center font-medium">P</th>
                        <th className="w-6 text-center font-medium">W</th>
                        <th className="w-6 text-center font-medium">D</th>
                        <th className="w-6 text-center font-medium">L</th>
                        <th className="w-8 text-center font-medium">GD</th>
                        <th className="w-8 text-center font-semibold text-pitch-light">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupStandings.teams.map((t, i) => (
                        <tr
                          key={t.team}
                          className={[
                            'border-b border-theme/30 last:border-0',
                            i < 2 ? 'bg-pitch-muted/20' : '',
                            highlightTeam === t.team ? 'bg-pitch/15' : '',
                          ].join(' ')}
                        >
                          <td className="py-1.5 pl-3">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="text-ink-faint w-3 text-center text-[10px]">{i + 1}</span>
                              <TeamFlag team={t.team} size={14} />
                              <span className={`truncate font-medium max-w-[90px] ${highlightTeam === t.team ? 'text-pitch-light' : 'text-ink'}`}>
                                {t.team}
                              </span>
                            </span>
                          </td>
                          <td className="text-center text-ink-muted">{t.played}</td>
                          <td className="text-center text-ink-muted">{t.won}</td>
                          <td className="text-center text-ink-muted">{t.drawn}</td>
                          <td className="text-center text-ink-muted">{t.lost}</td>
                          <td className="text-center text-ink-muted">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                          <td className="text-center font-display font-bold text-ink">{t.pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Fixtures */}
                {groupFixtures.length === 0 ? (
                  <p className="text-center text-xs text-ink-muted py-4 italic">No fixtures loaded yet</p>
                ) : (
                  <div className="divide-y divide-theme/30">
                      {[1, 2, 3].map(md => {
                      const mdFixtures = groupFixtures.filter(f => Number(f.round) === md)
                      if (mdFixtures.length === 0) return null
                      return (
                        <div key={md}>
                          <div className="px-3 py-1.5 bg-surface/30">
                            <span className="text-[10px] text-ink-faint uppercase tracking-wide font-semibold">
                              Matchday {md}
                            </span>
                          </div>
                          {mdFixtures.map(f => {
                            const res = resultMap.get(`${f.round}-${f.home_team}-${f.away_team}`)
                            const homeHighlight = highlightTeam === f.home_team
                            const awayHighlight = highlightTeam === f.away_team
                            return (
                              <div key={f.id} className="flex items-center gap-2 px-3 py-2.5">
                                <div className={`flex-1 min-w-0 flex items-center gap-1.5 justify-end ${homeHighlight ? 'font-bold text-pitch-light' : ''}`}>
                                  <span className="text-xs truncate text-right">{f.home_team}</span>
                                  <TeamFlag team={f.home_team} size={16} />
                                </div>
                                <div className="shrink-0 w-20 text-center">
                                  <ScoreDisplay result={res} kickoff={f.kickoff} homeTeam={f.home_team} />
                                </div>
                                <div className={`flex-1 min-w-0 flex items-center gap-1.5 ${awayHighlight ? 'font-bold text-pitch-light' : ''}`}>
                                  <TeamFlag team={f.away_team} size={16} />
                                  <span className="text-xs truncate">{f.away_team}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
