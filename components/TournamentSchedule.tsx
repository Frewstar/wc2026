'use client'

import { useEffect, useMemo, useState } from 'react'
import { TeamFlag } from './TeamFlag'
import { SegmentedControl, LoadingState } from './ui'
import { ROUNDS, getRound } from '@/lib/rounds'
import type { Fixture, Result } from '@/lib/scoring'
import { PLACEHOLDER } from '@/lib/bracket'
import { formatUKTime, formatUKKickoff } from '@/lib/uk-time'

function TeamCell({ team }: { team: string }) {
  if (!team || team === PLACEHOLDER) {
    return <span className="text-ink-faint italic">TBD</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <TeamFlag team={team} size={18} />
      <span className="truncate">{team}</span>
    </span>
  )
}

export function TournamentSchedule() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [round, setRound] = useState(1)
  const [loading, setLoading] = useState(true)

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

  const roundFixtures = useMemo(
    () =>
      fixtures
        .filter(f => f.round === round)
        .sort((a, b) => (a.match_slot ?? 999) - (b.match_slot ?? 999)),
    [fixtures, round]
  )

  const resultMap = useMemo(() => {
    const m = new Map<string, Result>()
    for (const r of results) {
      m.set(`${r.round}-${r.home_team}-${r.away_team}`, r)
    }
    return m
  }, [results])

  if (loading) return <LoadingState label="Loading schedule" />

  const roundDef = getRound(round)

  return (
    <div className="space-y-3">
      <SegmentedControl
        options={ROUNDS.map(r => ({ value: r.num, label: r.short }))}
        value={round}
        onChange={setRound}
      />

      <p className="text-xs text-ink-faint text-center">{roundDef?.label} · {roundFixtures.length} matches</p>

      {roundFixtures.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm text-ink-muted">
          No fixtures for this round yet
        </div>
      ) : (
        <div className="glass-card divide-y divide-theme">
          {roundFixtures.map(f => {
            const res = resultMap.get(`${f.round}-${f.home_team}-${f.away_team}`)
            const kickoffStr = f.kickoff ? formatUKTime(f.kickoff) : null
            const kickoffFull = f.kickoff ? formatUKKickoff(f.kickoff) : null
            return (
              <div key={f.id} className="px-4 py-3">
                {kickoffFull && !res && (
                  <p className="text-[10px] text-ink-faint mb-1.5">{kickoffFull}</p>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0 text-sm font-medium">
                    <TeamCell team={f.home_team} />
                  </div>
                  <div className="shrink-0 text-center min-w-[56px]">
                    {res ? (
                      <span className="font-display font-bold text-ink">
                        {res.home_goals}–{res.away_goals}
                      </span>
                    ) : kickoffStr ? (
                      <span className="text-[11px] font-semibold text-pitch-light">{kickoffStr}</span>
                    ) : (
                      <span className="text-ink-faint text-xs">vs</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-sm font-medium text-right flex justify-end">
                    <TeamCell team={f.away_team} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
