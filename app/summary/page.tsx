'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { calcPoints, isPickRevealed, type Entry, type Result, type Settings } from '@/lib/scoring'
import { ROUNDS, pickField } from '@/lib/rounds'
import { PageHeader, LoadingState, EmptyState, SegmentedControl } from '@/components/ui'
import { IconLock } from '@/components/icons'
import { TeamLabel } from '@/components/TeamFlag'

type RoundRow = {
  name: string
  team: string
  predicted: string
  actual: string
  pts: number
}

export default function SummaryPage() {
  const [round, setRound] = useState(1)
  const [entries, setEntries] = useState<Entry[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/entries').then(r => r.json()),
      fetch('/api/results').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([e, r, s]) => {
      setEntries(e.entries || [])
      setResults(r.results || [])
      setSettings(s.settings)
      setLoading(false)
    })
  }, [])

  const getRoundRows = (r: number): RoundRow[] => {
    return entries
      .map(e => {
        const team = e[pickField(r, 'team') as keyof Entry] as string | null
        if (!team) return null
        const myG = e[pickField(r, 'my_goals') as keyof Entry] as number
        const oppG = e[pickField(r, 'opp_goals') as keyof Entry] as number
        const { rounds } = calcPoints(e, results)
        const bd = rounds[r]
        const result = results.find(x => x.round === r && (x.home_team === team || x.away_team === team))
        const actual = result != null ? `${result.home_goals}–${result.away_goals}` : 'TBC'
        return { name: e.name, team, predicted: `${myG}–${oppG}`, actual, pts: bd.pts }
      })
      .filter((x): x is RoundRow => x !== null)
      .sort((a, b) => b.pts - a.pts)
  }

  if (loading) return <LoadingState label="Loading summary" />

  const revealed = isPickRevealed(settings, round)
  const rows = getRoundRows(round)
  const roundDef = ROUNDS.find(r => r.num === round)

  const PTS_STYLE: Record<number, string> = {
    3: 'text-emerald-400',
    1: 'text-sky-400',
    0: 'text-ink-faint',
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Round Summary"
        actions={
          <Link href="/leaderboard" className="text-xs font-semibold text-pitch-light hover:text-pitch transition-colors">
            Leaderboard
          </Link>
        }
      />

      <SegmentedControl
        options={ROUNDS.map(r => ({ value: r.num, label: r.short }))}
        value={round}
        onChange={setRound}
      />

      {roundDef && (
        <p className="text-xs text-ink-muted text-center">{roundDef.label}</p>
      )}

      {!revealed ? (
        <div className="alert-warning flex items-center justify-center gap-2 text-center">
          <IconLock className="w-4 h-4 shrink-0" />
          {roundDef?.label} picks haven&apos;t been revealed yet
        </div>
      ) : rows.length === 0 ? (
        <EmptyState message={`No picks for ${roundDef?.label ?? `Round ${round}`}`} />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table text-xs">
            <thead>
              <tr>
                <th className="w-8 pl-4">#</th>
                <th>Name</th>
                <th>Team</th>
                <th className="text-center">Pred.</th>
                <th className="text-center">Actual</th>
                <th className="text-right pr-4">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.name} className={i < 3 && row.pts > 0 ? 'bg-gold-dim/20' : ''}>
                  <td className="pl-4 text-ink-faint">{i + 1}</td>
                  <td className="font-medium">{row.name}</td>
                  <td className="text-ink-muted"><TeamLabel team={row.team} flagSize={16} /></td>
                  <td className="text-center text-ink-muted">{row.predicted}</td>
                  <td className="text-center font-semibold">
                    {row.actual === 'TBC'
                      ? <span className="text-ink-faint font-normal">TBC</span>
                      : row.actual}
                  </td>
                  <td className={`text-right pr-4 font-display font-bold ${PTS_STYLE[row.pts] ?? 'text-ink-faint'}`}>
                    {row.pts > 0 ? `+${row.pts}` : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
