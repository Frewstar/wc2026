'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { calcPoints, isPickRevealed, type Entry, type Result, type Settings } from '@/lib/scoring'
import { ROUNDS, pickField } from '@/lib/rounds'
import { PageHeader, LoadingState, EmptyState, SegmentedControl } from '@/components/ui'
import { IconLock } from '@/components/icons'
import { TeamFlag } from '@/components/TeamFlag'

type RoundRow = {
  name: string
  team: string
  predicted: string
  actual: string
  pts: number
  joker: boolean
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
        return { name: e.name, team, predicted: `${myG}–${oppG}`, actual, pts: bd.pts, joker: bd.joker ?? false }
      })
      .filter((x): x is RoundRow => x !== null)
      .sort((a, b) => b.pts - a.pts)
  }

  if (loading) return <LoadingState label="Loading summary" />

  const revealed = isPickRevealed(settings, round)
  const rows = getRoundRows(round)
  const roundDef = ROUNDS.find(r => r.num === round)

  const ptsBadge = (pts: number, joker: boolean) => {
    const base = pts === 3
      ? 'bg-emerald-400/15 text-emerald-400'
      : pts === 1
      ? 'bg-sky-400/15 text-sky-400'
      : 'bg-white/[0.05] text-ink-faint'
    const label = pts > 0 ? `+${joker ? pts / 2 : pts}${joker ? '🃏' : ''}` : '0'
    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 tabular-nums ${base}`}>
        {label}
      </span>
    )
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
        <div className="glass-card divide-y divide-white/[0.04] overflow-hidden">
          {rows.map((row, i) => (
            <div
              key={row.name}
              className={`flex items-center gap-2 sm:gap-3 px-4 py-3 ${i < 3 && row.pts > 0 ? 'bg-gold-dim/15' : ''}`}
            >
              {/* Rank */}
              <span className="text-xs text-ink-faint w-4 shrink-0 text-right tabular-nums">{i + 1}</span>

              {/* Name */}
              <span className="font-semibold text-sm flex-1 min-w-0 truncate">{row.name}</span>

              {/* Team flag + name */}
              <span className="inline-flex items-center gap-1.5 shrink-0 max-w-[90px] sm:max-w-[120px]">
                <TeamFlag team={row.team} size={16} className="shrink-0" />
                <span className="text-xs text-ink-muted truncate hidden xs:inline sm:inline">{row.team}</span>
              </span>

              {/* Predicted | Actual */}
              <span className="text-xs text-ink-muted shrink-0 tabular-nums whitespace-nowrap">
                <span className="text-ink">{row.predicted}</span>
                <span className="text-ink-faint mx-1">|</span>
                {row.actual === 'TBC'
                  ? <span className="text-ink-faint">TBC</span>
                  : <span className="font-semibold text-ink">{row.actual}</span>
                }
              </span>

              {/* Points badge */}
              {ptsBadge(row.pts, row.joker)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
