'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { calcPoints, isPickRevealed, type Entry, type Result, type Settings } from '@/lib/scoring'
import { ROUNDS, GROUP_ROUNDS, KNOCKOUT_ROUNDS, pickField, missingKnockoutRounds } from '@/lib/rounds'
import { PageHeader, LoadingState, EmptyState } from '@/components/ui'
import { IconEdit, IconLock } from '@/components/icons'
import { TeamMatchup } from '@/components/TeamFlag'

type Fixture = { round: number; home_team: string; away_team: string }

const STATUS_STYLE: Record<string, string> = {
  correct: 'status-correct',
  win: 'status-win',
  draw: 'status-draw',
  lost: 'status-lost',
  pending: 'status-pending',
  no_pick: 'status-pending',
}

const STATUS_LABEL: Record<string, string> = {
  correct: '+3 pts',
  win: '+1 pt',
  draw: '0 pts · draw',
  lost: '0 pts',
  pending: 'Pending',
  no_pick: '—',
}

function RoundSection({
  title,
  roundDefs,
  entry,
  fixtures,
  settings,
  results,
}: {
  title: string
  roundDefs: typeof ROUNDS
  entry: Entry
  fixtures: Fixture[]
  settings: Settings | null
  results: Result[]
}) {
  const { rounds: breakdowns } = calcPoints(entry, results)

  const getOpp = (round: number, team: string) => {
    const f = fixtures.find(fx => fx.round === round && (fx.home_team === team || fx.away_team === team))
    return f ? (f.home_team === team ? f.away_team : f.home_team) : null
  }

  return (
    <div className="space-y-1">
      <p className="section-label px-1 pt-2">{title}</p>
      {roundDefs.map(r => {
        const team = entry[pickField(r.num, 'team') as keyof Entry] as string | null
        const my = entry[pickField(r.num, 'my_goals') as keyof Entry] as number
        const opp = entry[pickField(r.num, 'opp_goals') as keyof Entry] as number
        const bd = breakdowns[r.num]
        const show = isPickRevealed(settings, r.num)
        const opponent = team ? getOpp(r.num, team) : null

        return (
          <div key={r.num} className="flex items-center justify-between py-3 border-t border-theme">
            <div>
              <div className="section-label mb-1">{r.label}</div>
              <div className="font-semibold text-ink">
                {team ? <TeamMatchup team={team} opponent={opponent} /> : '—'}
              </div>
              {team && <div className="text-sm text-ink-muted">Predicted: {my}–{opp}</div>}
            </div>
            {show && team && (
              <span className={`${STATUS_STYLE[bd.status]} px-3 py-1 rounded-full`}>
                {STATUS_LABEL[bd.status]}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MyPicks() {
  const searchParams = useSearchParams()
  const name = searchParams.get('name') || ''
  const [entry, setEntry] = useState<Entry | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/entries?name=${encodeURIComponent(name)}`).then(r => r.json()),
      fetch('/api/results').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
      fetch('/api/fixtures').then(r => r.json()),
    ]).then(([e, r, s, f]) => {
      setEntry(e.entry)
      setResults(r.results || [])
      setSettings(s.settings)
      setFixtures(f.fixtures || [])
      setLoading(false)
    })
  }, [name])

  if (loading) return <LoadingState label="Loading your picks" />
  if (!entry) return (
    <div className="space-y-4">
      <PageHeader />
      <EmptyState message={`No entry found for "${name}"`} />
      <Link href="/" className="btn-secondary block text-center">Go back home</Link>
    </div>
  )

  const { total } = calcPoints(entry, results)
  const needsKnockout = missingKnockoutRounds(entry).length > 0
  const anyHidden = ROUNDS.some(r => !isPickRevealed(settings, r.num))

  return (
    <div className="space-y-5">
      <PageHeader
        title={entry.name}
        subtitle={`Entered ${new Date(entry.created_at).toLocaleDateString('en-GB')}`}
        actions={
          <Link href="/leaderboard" className="text-xs font-semibold text-pitch-light hover:text-pitch transition-colors">
            Leaderboard
          </Link>
        }
      />

      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-dim rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative mb-4">
          <p className="section-label mb-1">Total score</p>
          <div className="font-display text-5xl font-bold text-gold tracking-tight">{total}</div>
          <p className="text-xs text-ink-muted mt-1">points · all rounds count</p>
        </div>

        <RoundSection title="Group stage" roundDefs={GROUP_ROUNDS} entry={entry} fixtures={fixtures} settings={settings} results={results} />
        <RoundSection title="Knockout" roundDefs={KNOCKOUT_ROUNDS} entry={entry} fixtures={fixtures} settings={settings} results={results} />
      </div>

      {settings?.entries_open && (
        <Link
          href={`/enter?name=${encodeURIComponent(name)}&edit=true`}
          className="btn-secondary flex items-center justify-center gap-2 text-sm"
        >
          <IconEdit className="w-4 h-4" />
          Edit Group Picks
        </Link>
      )}

      {settings?.knockout_entries_open && needsKnockout && (
        <Link
          href={`/enter?name=${encodeURIComponent(name)}&phase=knockout${needsKnockout && entry.round4_team ? '&edit=true' : ''}`}
          className="btn-primary flex items-center justify-center gap-2 text-sm"
        >
          <IconEdit className="w-4 h-4" />
          {needsKnockout && !entry.round4_team ? 'Submit Knockout Picks' : 'Edit Knockout Picks'}
        </Link>
      )}

      {anyHidden && (
        <p className="text-xs text-ink-faint text-center flex items-center justify-center gap-1.5">
          <IconLock className="w-3 h-3" />
          Some round results will be revealed closer to kick-off
        </p>
      )}
    </div>
  )
}

export default function PicksPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MyPicks />
    </Suspense>
  )
}
