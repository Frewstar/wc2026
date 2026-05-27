'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui'
import { GroupsWithFixtures } from '@/components/GroupsWithFixtures'
import { TeamFlag } from '@/components/TeamFlag'
import { mapTeam, parseApiRound } from '@/lib/api-football'
import { formatUKKickoff } from '@/lib/uk-time'

// ─── Types ────────────────────────────────────────────────────────────────────

type LiveFixture = {
  id: number
  round: number
  homeTeam: string
  awayTeam: string
  homeGoals: number | null
  awayGoals: number | null
  status: string       // NS, 1H, HT, 2H, ET, BT, P, FT, AET, PEN, SUSP, INT, PST, CANC, ABD, AWD, WO, LIVE
  kickoff: string
}

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'])
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO'])
const INTERVALS = { live: 15 * 60 * 1000, idle: 60 * 60 * 1000 }

function parseFixtures(raw: unknown): LiveFixture[] {
  const items: unknown[] = (raw as Record<string, unknown[]>)?.response ?? []
  const out: LiveFixture[] = []
  for (const item of items) {
    const r = item as Record<string, unknown>
    const fixture = r.fixture as Record<string, unknown>
    const status = ((fixture?.status as Record<string, string>)?.short) ?? 'NS'
    const teams = r.teams as Record<string, Record<string, unknown>>
    const goals = r.goals as Record<string, number | null> | undefined
    const league = r.league as Record<string, unknown>
    const roundNum = parseApiRound((league?.round as string) ?? '')
    if (!roundNum) continue
    out.push({
      id: fixture.id as number,
      round: roundNum,
      homeTeam: mapTeam((teams?.home?.name as string) ?? ''),
      awayTeam: mapTeam((teams?.away?.name as string) ?? ''),
      homeGoals: goals?.home ?? null,
      awayGoals: goals?.away ?? null,
      status,
      kickoff: (fixture.date as string) ?? '',
    })
  }
  return out.sort((a, b) => a.kickoff.localeCompare(b.kickoff))
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (LIVE_STATUSES.has(status)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 animate-pulse">
        ● LIVE
      </span>
    )
  }
  if (FINISHED_STATUSES.has(status)) {
    return <span className="text-[10px] font-bold text-ink-faint">FT</span>
  }
  return null
}

// ─── Live feed component ──────────────────────────────────────────────────────

function LiveFeed() {
  const [fixtures, setFixtures] = useState<LiveFixture[]>([])
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [source, setSource] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/cached-scores')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setFixtures(parseFixtures(json.data))
      setFetchedAt(json.fetched_at ?? null)
      setSource(json.source ?? '')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load scores')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Auto-refresh: 15 min if any LIVE match, 60 min otherwise
  useEffect(() => {
    if (loading) return
    const hasLive = fixtures.some(f => LIVE_STATUSES.has(f.status))
    const interval = hasLive ? INTERVALS.live : INTERVALS.idle
    const id = setInterval(load, interval)
    return () => clearInterval(id)
  }, [loading, fixtures, load])

  if (loading) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-ink-faint">Loading scores…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card p-4">
        <p className="text-sm text-red-400">⚠️ {error}</p>
        <button onClick={load} className="text-xs text-pitch-light mt-2 hover:text-pitch transition-colors">
          Retry
        </button>
      </div>
    )
  }

  // Filter to interesting fixtures: live + finished today + upcoming today/recent
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const relevant = fixtures.filter(f => {
    if (LIVE_STATUSES.has(f.status)) return true
    const fixtureDate = f.kickoff.slice(0, 10)
    return fixtureDate === todayStr
  })

  // Also show the next upcoming fixtures if none today
  const upcoming = fixtures
    .filter(f => f.status === 'NS' && f.kickoff > now.toISOString())
    .slice(0, 8)

  const toShow = relevant.length > 0 ? relevant : upcoming

  if (toShow.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-ink-muted">No matches today</p>
        {upcoming.length > 0 && (
          <p className="text-xs text-ink-faint mt-1">
            Next up: {formatUKKickoff(upcoming[0].kickoff)}
          </p>
        )}
      </div>
    )
  }

  const hasLive = toShow.some(f => LIVE_STATUSES.has(f.status))
  const refreshMins = hasLive ? 15 : 60

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-ink-faint">
          {fetchedAt ? `Updated ${new Date(fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
          {source === 'cache' ? ' · cached' : source === 'api' ? ' · live' : ''}
        </span>
        <span className="text-[10px] text-ink-faint">
          Refreshes every {refreshMins} min
        </span>
      </div>
      <div className="glass-card divide-y divide-white/[0.04] overflow-hidden">
        {toShow.map(f => {
          const isLive = LIVE_STATUSES.has(f.status)
          const isDone = FINISHED_STATUSES.has(f.status)
          const hasScore = f.homeGoals !== null && f.awayGoals !== null
          return (
            <div key={f.id} className={`flex items-center gap-2 px-4 py-3 ${isLive ? 'bg-red-500/5' : ''}`}>
              {/* Home */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5 justify-end">
                <span className={`text-xs truncate text-right font-medium ${isLive ? 'text-ink' : 'text-ink-muted'}`}>
                  {f.homeTeam}
                </span>
                <TeamFlag team={f.homeTeam} size={18} className="shrink-0" />
              </div>

              {/* Score / kick-off */}
              <div className="shrink-0 w-24 text-center space-y-0.5">
                {hasScore ? (
                  <p className={`font-display font-bold tabular-nums ${isLive ? 'text-base text-ink' : 'text-sm text-ink-muted'}`}>
                    {f.homeGoals} – {f.awayGoals}
                  </p>
                ) : (
                  <p className="text-xs text-pitch-light font-semibold">
                    {formatUKKickoff(f.kickoff)}
                  </p>
                )}
                <StatusBadge status={f.status} />
                {isDone && !isLive && (
                  <p className="text-[9px] text-ink-faint uppercase tracking-wide">Full time</p>
                )}
              </div>

              {/* Away */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <TeamFlag team={f.awayTeam} size={18} className="shrink-0" />
                <span className={`text-xs truncate font-medium ${isLive ? 'text-ink' : 'text-ink-muted'}`}>
                  {f.awayTeam}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScoresPage() {
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
        <p className="section-label">Today&apos;s matches</p>
        <LiveFeed />
      </div>

      <div className="space-y-3">
        <p className="section-label">Groups, standings &amp; results</p>
        <GroupsWithFixtures />
      </div>
    </div>
  )
}
