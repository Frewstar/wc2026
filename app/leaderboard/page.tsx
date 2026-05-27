'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { calcPoints, maxPossiblePoints, isPickRevealed, compareEntries, type Entry, type Result, type Settings } from '@/lib/scoring'
import { parseDeadlines, isRoundLocked } from '@/lib/round-deadlines'
import { computeTiebreakers, tiebreakerLabel } from '@/lib/tiebreaker'
import { ROUNDS } from '@/lib/rounds'
import { SHARE_MESSAGE } from '@/lib/app-config'
import { PageHeader, LoadingState, EmptyState } from '@/components/ui'
import { TeamPickBadge } from '@/components/TeamPickBadge'
import { IconShare, IconLock, IconMedal, IconChart, IconScoreboard, IconTrendUp, IconTrendDown } from '@/components/icons'
import { pickField } from '@/lib/rounds'

type Player = { id: string; name: string }

type RankSnapshot = { rank: number; total: number }
type RankAnimation = { rankDelta: number; pointsDelta: number }

const POLL_MS = 25_000

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState<Record<string, RankAnimation>>({})
  const [showEnterAnim, setShowEnterAnim] = useState(true)

  const prevRanks = useRef<Record<string, RankSnapshot>>({})
  const isFirstLoad = useRef(true)

  const applyRankChanges = useCallback((ranked: Array<{ e: Entry; total: number }>) => {
    const changes: Record<string, RankAnimation> = {}
    ranked.forEach(({ e, total }, idx) => {
      const rank = idx + 1
      const prev = prevRanks.current[e.id]
      if (prev && !isFirstLoad.current) {
        const rankDelta = prev.rank - rank
        const pointsDelta = total - prev.total
        if (rankDelta !== 0 || pointsDelta !== 0) {
          changes[e.id] = { rankDelta, pointsDelta }
        }
      }
      prevRanks.current[e.id] = { rank, total }
    })
    if (Object.keys(changes).length > 0) {
      setAnimating(prev => ({ ...prev, ...changes }))
      setTimeout(() => {
        setAnimating(prev => {
          const next = { ...prev }
          for (const id of Object.keys(changes)) delete next[id]
          return next
        })
      }, 1600)
    }
    isFirstLoad.current = false
  }, [])

  const fetchData = useCallback(async (isInitial = false) => {
    const [e, r, s, p] = await Promise.all([
      fetch('/api/entries').then(res => res.json()),
      fetch('/api/results').then(res => res.json()),
      fetch('/api/settings').then(res => res.json()),
      fetch('/api/players').then(res => res.json()),
    ])
    const newEntries: Entry[] = e.entries || []
    const newResults: Result[] = r.results || []
    setEntries(newEntries)
    setResults(newResults)
    setSettings(s.settings)
    setPlayers(p.players || [])

    const actualGoals = s.settings?.actual_golden_goal ?? null
    const ranked = newEntries
      .map(entry => ({ e: entry, ...calcPoints(entry, newResults) }))
      .sort((a, b) => compareEntries({ entry: a.e, total: a.total }, { entry: b.e, total: b.total }, actualGoals))

    applyRankChanges(ranked)
    if (isInitial) {
      setLoading(false)
      setTimeout(() => setShowEnterAnim(false), ranked.length * 60 + 600)
    }
  }, [applyRankChanges])

  useEffect(() => {
    fetchData(true)
    const interval = setInterval(() => fetchData(false), POLL_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) return <LoadingState label="Loading leaderboard" />

  const showPicks = ROUNDS.map(r => isPickRevealed(settings, r.num))
  const actualGoals = settings?.actual_golden_goal ?? null
  const showGoldenGoal = isPickRevealed(settings, 1)  // reveal GG after R1 picks shown

  const deadlines = parseDeadlines(settings?.round_deadlines)
  const tournamentStarted = isRoundLocked(deadlines, 1)
  const competitionEntries = tournamentStarted ? entries.filter(e => e.paid) : entries
  const unpaidCount = tournamentStarted ? entries.filter(e => !e.paid).length : 0

  const ranked = competitionEntries
    .map(e => ({
      e,
      ...calcPoints(e, results),
      maxPts: maxPossiblePoints(e, results),
      tb: computeTiebreakers(e, actualGoals),
    }))
    .sort((a, b) => compareEntries({ entry: a.e, total: a.total }, { entry: b.e, total: b.total }, actualGoals))

  const leaderTotal = ranked[0]?.total ?? 0

  // Two entries are genuinely tied if compareEntries returns 0
  const areTied = (idxA: number, idxB: number): boolean => {
    const a = ranked[idxA]
    const b = ranked[idxB]
    if (!a || !b) return false
    return compareEntries({ entry: a.e, total: a.total }, { entry: b.e, total: b.total }, actualGoals) === 0
  }

  const entryNames = new Set(entries.map(e => e.name.toLowerCase()))
  const stillToPick = players.filter(p => !entryNames.has(p.name.toLowerCase()))
  const pickedCount = tournamentStarted
    ? `${competitionEntries.length} players`
    : players.length > 0
      ? `${entries.length} / ${players.length} entered`
      : `${entries.length} entries`

  const shareWhatsApp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(SHARE_MESSAGE + '\n' + window.location.origin)}`)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leaderboard"
        subtitle={`${pickedCount} · updates every ${POLL_MS / 1000}s`}
        actions={
          <button
            onClick={shareWhatsApp}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-pitch-muted text-pitch-light rounded-lg px-3 py-1.5 hover:bg-pitch/25 transition-colors"
          >
            <IconShare className="w-3.5 h-3.5" />
            Share
          </button>
        }
      />

      <div className="flex items-center gap-4 text-sm">
        <Link href="/summary" className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink transition-colors">
          <IconChart className="w-3.5 h-3.5" />
          Summary
        </Link>
        <Link href="/scores" className="inline-flex items-center gap-1.5 text-pitch-light hover:text-pitch transition-colors">
          <IconScoreboard className="w-3.5 h-3.5" />
          Scores
        </Link>
      </div>

      {showPicks.some(s => !s) && (
        <div className="alert-warning flex items-center gap-2">
          <IconLock className="w-4 h-4 shrink-0" />
          Picks are hidden until 1 hour before each round&apos;s kick-off
        </div>
      )}

      {unpaidCount > 0 && (
        <div className="alert-info text-xs">
          {unpaidCount} {unpaidCount === 1 ? 'entry was' : 'entries were'} not confirmed as paid before kick-off and {unpaidCount === 1 ? 'has' : 'have'} been excluded.
        </div>
      )}

      {ranked.length === 0 ? (
        <EmptyState message="No entries yet — be the first!" />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="data-table min-w-[640px]">
            <thead>
              <tr>
                <th className="w-12 pl-4 sticky left-0 bg-surface-raised">#</th>
                <th className="sticky left-12 bg-surface-raised min-w-[130px]">Name</th>
                {ROUNDS.map(r => (
                  <th key={r.num} className="text-center px-1 whitespace-nowrap">{r.short}</th>
                ))}
                <th className="text-right pr-5">Pts</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ e, total, maxPts, rounds: bds }, idx) => {
                const tiedWithPrev = idx > 0 ? areTied(idx, idx - 1) : false
                const tiedWithNext = idx < ranked.length - 1 ? areTied(idx, idx + 1) : false
                const inTiedGroup = tiedWithPrev || tiedWithNext
                const isTop3 = idx < 3
                const anim = animating[e.id]
                const rowAnim = anim
                  ? anim.rankDelta > 0 ? 'leaderboard-row-up' : anim.rankDelta < 0 ? 'leaderboard-row-down' : ''
                  : showEnterAnim ? 'leaderboard-row-enter' : ''

                return (
                  <tr
                    key={e.id}
                    className={`transition-colors ${isTop3 ? 'bg-gold-dim/30' : ''} ${rowAnim}`}
                    style={showEnterAnim ? { animationDelay: `${idx * 60}ms` } : undefined}
                  >
                    {/* Rank */}
                    <td className="pl-4 sticky left-0 bg-inherit">
                      <div className="flex items-center gap-1">
                        {isTop3 ? (
                          <IconMedal rank={(idx + 1) as 1 | 2 | 3} />
                        ) : (
                          <span className="text-ink-faint text-xs font-medium w-4">
                            {inTiedGroup && !tiedWithPrev ? 'T' : inTiedGroup ? '' : idx + 1}
                          </span>
                        )}
                        {anim && anim.rankDelta > 0 && <IconTrendUp className="w-3 h-3 text-pitch-light animate-fade-in" />}
                        {anim && anim.rankDelta < 0 && <IconTrendDown className="w-3 h-3 text-red-400 animate-fade-in" />}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="font-medium sticky left-12 bg-inherit max-w-[130px]">
                      <Link href={`/picks?name=${encodeURIComponent(e.name)}`} className="hover:text-pitch-light transition-colors truncate block">
                        {e.name}
                      </Link>
                      {/* Joker — shown only once knockout stage is active */}
                      {e.joker_round != null && (settings?.current_round ?? 0) >= 4 && (
                        <div className="text-[10px] text-amber-400/70 font-normal leading-tight">
                          🃏 R{e.joker_round}
                        </div>
                      )}
                      {/* Tiebreaker detail for tied players */}
                      {inTiedGroup && (
                        <div className="text-[10px] text-amber-400/80 font-normal leading-tight">
                          {tiebreakerLabel(e, actualGoals)}
                        </div>
                      )}
                    </td>

                    {/* Per-round picks */}
                    {ROUNDS.map((r, i) => {
                      const bd = bds[r.num]
                      return (
                        <td key={r.num} className="text-center px-1">
                          {!showPicks[i] ? (
                            <IconLock className="w-3 h-3 text-ink-faint mx-auto" />
                          ) : bd.team ? (
                            <div className="relative inline-block">
                              <TeamPickBadge team={bd.team} status={bd.status} />
                              {bd.joker && (
                                <span className="absolute -top-1.5 -right-1.5 text-[9px] leading-none">🃏</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                      )
                    })}

                    {/* Points */}
                    <td className="text-right pr-5">
                      <span className={`font-display font-bold text-lg text-gold inline-block ${anim?.pointsDelta ? 'points-changed' : ''}`}>
                        {total}
                      </span>
                      {maxPts > total && (
                        <div className="text-[10px] text-ink-faint leading-tight text-right">
                          /{maxPts} max
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {players.length > 0 && (
        <div className="glass-card p-5">
          <p className="section-label mb-3">Still to pick</p>
          {stillToPick.length === 0 ? (
            <p className="text-sm text-pitch-light">Everyone has picked</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stillToPick.map(p => (
                <span key={p.id} className="bg-surface text-ink-muted text-xs px-3 py-1.5 rounded-full border border-theme">
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
