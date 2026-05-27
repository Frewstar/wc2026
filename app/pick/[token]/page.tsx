'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  calcPoints,
  isPickRevealed,
  type Entry,
  type Result,
  type Settings,
} from '@/lib/scoring'
import { ROUNDS, GROUP_ROUNDS, KNOCKOUT_ROUNDS, pickField, type RoundDef } from '@/lib/rounds'
import { parseDeadlines, isRoundLocked, formatCountdown, msUntilDeadline } from '@/lib/round-deadlines'
import { getTeamGroup } from '@/lib/wc-groups'
import { PageHeader, LoadingState } from '@/components/ui'
import { IconLock, IconTrophy } from '@/components/icons'
import { TeamFlag, TeamMatchup } from '@/components/TeamFlag'

type Participant = {
  id: string
  name: string
  email: string
  token: string
  status: 'pending' | 'paid'
  created_at: string
  paid_at: string | null
}

type Fixture = { round: number; home_team: string; away_team: string }

// ─── Status display helpers ───────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  correct: 'status-correct',
  win: 'status-win',
  draw: 'status-draw',
  lost: 'status-lost',
  pending: 'status-pending',
  no_pick: 'status-pending',
}

const STATUS_LABEL: Record<string, string> = {
  correct: '3 pts',
  win: '1 pt',
  draw: '0 pts',
  lost: '0 pts',
  pending: 'Pending',
  no_pick: '—',
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(targetMs: number): string {
  const [label, setLabel] = useState(() => formatCountdown(targetMs - Date.now()))
  useEffect(() => {
    const tick = () => setLabel(formatCountdown(targetMs - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetMs])
  return label
}

// ─── Fixture card ─────────────────────────────────────────────────────────────

function FixtureCard({
  fixture,
  selected,
  usedTeams,
  onSelect,
}: {
  fixture: Fixture
  selected: string
  usedTeams: Set<string>
  onSelect: (team: string) => void
}) {
  const { home_team, away_team } = fixture

  function TeamBtn({ team }: { team: string }) {
    const isTBD = !team || team === 'TBD'
    const isSelected = selected === team
    const isUsed = !isTBD && usedTeams.has(team)

    if (isTBD) {
      return (
        <div className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-theme/30 bg-surface/30 opacity-40 select-none">
          <div className="w-6 h-6 rounded-full bg-surface-raised border border-theme flex items-center justify-center text-[10px] text-ink-faint">?</div>
          <span className="text-[11px] text-ink-faint">TBD</span>
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={() => !isUsed && onSelect(isSelected ? '' : team)}
        disabled={isUsed}
        className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
          isSelected
            ? 'bg-pitch-gradient border-pitch text-white shadow-glow'
            : isUsed
              ? 'bg-surface/30 border-theme/20 opacity-35 cursor-not-allowed'
              : 'bg-surface border-theme text-ink hover:bg-surface-hover hover:border-pitch/40 active:scale-[0.97]'
        }`}
      >
        <TeamFlag team={team} size={26} />
        <span className={`text-[11px] font-medium text-center leading-tight ${isSelected ? 'text-white' : isUsed ? 'text-ink-faint' : 'text-ink'}`}>
          {team}
        </span>
        {isUsed && (
          <span className="text-[9px] text-ink-faint leading-none">used</span>
        )}
      </button>
    )
  }

  return (
    <div className="flex items-stretch gap-2">
      <TeamBtn team={home_team} />
      <div className="flex items-center justify-center shrink-0">
        <span className="text-[10px] font-semibold text-ink-faint">vs</span>
      </div>
      <TeamBtn team={away_team} />
    </div>
  )
}

// ─── Goals stepper ────────────────────────────────────────────────────────────

function GoalStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        className="w-9 h-9 rounded-xl bg-surface border border-theme text-ink-muted hover:bg-surface-hover hover:text-ink active:scale-95 transition-all font-bold text-lg flex items-center justify-center"
      >
        +
      </button>
      <span className="font-display font-bold text-3xl text-ink w-9 text-center tabular-nums leading-none py-1">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-9 h-9 rounded-xl bg-surface border border-theme text-ink-muted hover:bg-surface-hover hover:text-ink active:scale-95 transition-all font-bold text-lg flex items-center justify-center"
      >
        −
      </button>
    </div>
  )
}

// ─── Pick form component ──────────────────────────────────────────────────────

function PickForm({
  round,
  entry,
  fixtures,
  settings,
  onSuccess,
  participantName,
}: {
  round: RoundDef
  entry: Entry | null
  fixtures: Fixture[]
  settings: Settings | null
  onSuccess: (updated: Entry) => void
  participantName: string
}) {
  const isGroupRound = round.num <= 3
  const isKnockoutRound = round.num >= 4
  const isR1 = round.num === 1
  const deadlines = parseDeadlines(settings?.round_deadlines)
  const deadlineMs = msUntilDeadline(deadlines, round.num)

  // Already-picked teams in same phase (excluding this round)
  const phaseRounds = isGroupRound ? [1, 2, 3] : [4, 5, 6, 7, 8]
  const usedTeams = new Set(
    phaseRounds
      .filter(r => r !== round.num)
      .map(r => entry?.[pickField(r, 'team') as keyof Entry] as string | null)
      .filter(Boolean) as string[]
  )

  // Pre-fill if editing
  const existingTeam = (entry?.[pickField(round.num, 'team') as keyof Entry] as string | null) ?? ''
  const existingMyGoals = (entry?.[pickField(round.num, 'my_goals') as keyof Entry] as number) ?? 1
  const existingOppGoals = (entry?.[pickField(round.num, 'opp_goals') as keyof Entry] as number) ?? 0
  const [team, setTeam] = useState(existingTeam)
  const [myGoals, setMyGoals] = useState(existingMyGoals)
  const [oppGoals, setOppGoals] = useState(existingOppGoals)
  const [goldenGoal, setGoldenGoal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isEditing = Boolean(existingTeam)
  const showGoldenGoal = isR1 && entry?.golden_goal == null
  const countdown = useCountdown(Date.now() + deadlineMs)

  // Fixtures for this round
  const roundFixtures = fixtures.filter(fx => fx.round === round.num)

  // Find the opponent for the selected team
  const selectedFixture = team
    ? roundFixtures.find(fx => fx.home_team === team || fx.away_team === team)
    : null
  const opponent = selectedFixture
    ? (selectedFixture.home_team === team ? selectedFixture.away_team : selectedFixture.home_team)
    : null

  // Group fixtures by WC group (A–L) for group rounds
  type GroupedFixtures = { group: string; fixtures: Fixture[] }
  const groupedFixtures: GroupedFixtures[] = []
  if (isGroupRound && roundFixtures.length > 0) {
    const map = new Map<string, Fixture[]>()
    for (const fx of roundFixtures) {
      const grp = getTeamGroup(fx.home_team) ?? getTeamGroup(fx.away_team) ?? '?'
      if (!map.has(grp)) map.set(grp, [])
      map.get(grp)!.push(fx)
    }
    for (const grp of [...map.keys()].sort()) {
      groupedFixtures.push({ group: grp, fixtures: map.get(grp)! })
    }
  }

  const handleSubmit = async () => {
    if (!team) { setError('Please select a team'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/entries/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: participantName,
          round: round.num,
          team,
          my_goals: myGoals,
          opp_goals: oppGoals,
          ...(showGoldenGoal && goldenGoal !== '' ? { golden_goal: parseInt(goldenGoal) || 0 } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error saving pick'); return }
      onSuccess(data.entry)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Deadline banner */}
      {deadlineMs < Infinity && deadlineMs > 0 && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 text-xs text-amber-300">
          <span>⏱</span>
          <span>Deadline in <strong>{countdown}</strong></span>
        </div>
      )}

      {/* Fixture picker */}
      <div>
        <label className="section-label mb-3 block">Pick your team</label>

        {roundFixtures.length === 0 ? (
          <p className="text-sm text-amber-400">Fixtures not yet set for this round — check back soon.</p>
        ) : isGroupRound ? (
          /* Group rounds: fixtures grouped A → L */
          <div className="space-y-5">
            {groupedFixtures.map(({ group, fixtures: gfx }) => (
              <div key={group}>
                <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-pitch-muted text-pitch-light text-[10px] font-bold">{group}</span>
                  Group {group}
                </p>
                <div className="space-y-2">
                  {gfx.map((fx, i) => (
                    <FixtureCard
                      key={i}
                      fixture={fx}
                      selected={team}
                      usedTeams={usedTeams}
                      onSelect={setTeam}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Knockout rounds: plain fixture list */
          <div className="space-y-2">
            {roundFixtures.map((fx, i) => (
              <FixtureCard
                key={i}
                fixture={fx}
                selected={team}
                usedTeams={usedTeams}
                onSelect={setTeam}
              />
            ))}
          </div>
        )}
      </div>

      {/* Score prediction — appears once a team is selected */}
      {team && (
        <div className="rounded-2xl border border-pitch/30 bg-surface p-4">
          <p className="section-label mb-4 text-center block">Predicted score</p>
          <div className="flex items-center justify-center gap-4">
            {/* My team */}
            <div className="flex flex-col items-center gap-1 min-w-[60px]">
              <TeamFlag team={team} size={32} />
              <span className="text-[11px] font-medium text-ink text-center leading-tight max-w-[64px]">{team}</span>
            </div>

            <GoalStepper value={myGoals} onChange={setMyGoals} />

            <span className="text-ink-faint font-bold text-xl">–</span>

            <GoalStepper value={oppGoals} onChange={setOppGoals} />

            {/* Opponent */}
            <div className="flex flex-col items-center gap-1 min-w-[60px]">
              {opponent && opponent !== 'TBD' ? (
                <>
                  <TeamFlag team={opponent} size={32} />
                  <span className="text-[11px] font-medium text-ink-muted text-center leading-tight max-w-[64px]">{opponent}</span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-surface-raised border border-theme flex items-center justify-center text-xs text-ink-faint">?</div>
                  <span className="text-[11px] text-ink-faint">TBD</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Golden goal — Round 1 first submission only */}
      {showGoldenGoal && (
        <div className="glass-card p-4 border border-gold/20">
          <label className="section-label mb-1 block">⚽ Golden Goal — tiebreaker</label>
          <p className="text-xs text-ink-muted mb-3 leading-relaxed">
            How many total goals will be scored in the entire tournament?
            2022 had <strong className="text-ink">172 goals</strong> across 64 matches.
            2026 has 104 matches — expect more.
            <br /><span className="text-ink-faint">Locked in once Round 1 is submitted.</span>
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={500}
              placeholder="e.g. 200"
              value={goldenGoal}
              onChange={e => setGoldenGoal(e.target.value)}
              className="w-28 input-field-sm text-center text-lg font-bold"
            />
            <span className="text-xs text-ink-faint">total tournament goals</span>
          </div>
        </div>
      )}

      {/* Joker status — view only, assigned by admin */}
      {isKnockoutRound && entry?.joker_used && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 text-xs text-amber-300">
          <span>🃏</span>
          <span>
            {entry.joker_round === round.num
              ? 'Joker assigned to this round — points will be doubled!'
              : `Joker assigned to ${ROUNDS.find(r => r.num === entry.joker_round)?.label ?? `Round ${entry.joker_round}`}`
            }
          </span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !team}
        className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {submitting ? 'Saving…' : isEditing ? 'Update Pick' : 'Submit Pick'}
      </button>
    </div>
  )
}

// ─── Round history row ────────────────────────────────────────────────────────

function RoundRow({
  round,
  entry,
  fixtures,
  settings,
  results,
  currentRound,
}: {
  round: RoundDef
  entry: Entry | null
  fixtures: Fixture[]
  settings: Settings | null
  results: Result[]
  currentRound: number | null
}) {
  const team = entry?.[pickField(round.num, 'team') as keyof Entry] as string | null
  const myG = (entry?.[pickField(round.num, 'my_goals') as keyof Entry] as number) ?? 0
  const oppG = (entry?.[pickField(round.num, 'opp_goals') as keyof Entry] as number) ?? 0
  const { rounds: breakdowns } = entry ? calcPoints(entry, results) : { rounds: {} as Record<number, import('@/lib/scoring').RoundBreakdown> }
  const bd = breakdowns[round.num]
  const show = isPickRevealed(settings, round.num)
  const isJoker = entry?.joker_round === round.num
  const deadlines = parseDeadlines(settings?.round_deadlines)
  const locked = isRoundLocked(deadlines, round.num)
  const isCurrentRound = round.num === currentRound
  const opponent = team
    ? fixtures.find(fx => fx.round === round.num && (fx.home_team === team || fx.away_team === team))
    : null

  // Skip rounds not yet reached
  if (!team && !isCurrentRound && round.num > (currentRound ?? 0)) return null

  return (
    <div className="flex items-center justify-between py-3 border-t border-theme">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="section-label">{round.label}</span>
          {isJoker && (
            <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-semibold">
              🃏 Joker
            </span>
          )}
          {!team && !isCurrentRound && locked && (
            <span className="text-[10px] text-ink-faint flex items-center gap-0.5">
              <IconLock className="w-2.5 h-2.5" /> Missed
            </span>
          )}
        </div>
        {team ? (
          <>
            <div className="font-semibold text-ink">
              {opponent ? (
                <TeamMatchup
                  team={team}
                  opponent={opponent.home_team === team ? opponent.away_team : opponent.home_team}
                />
              ) : (
                <span className="flex items-center gap-1.5">
                  <TeamFlag team={team} size={16} />
                  {team}
                </span>
              )}
            </div>
            <div className="text-xs text-ink-faint mt-0.5">Predicted: {myG}–{oppG}</div>
          </>
        ) : (
          <span className="text-sm text-ink-faint">—</span>
        )}
      </div>

      <div className="shrink-0 text-right pl-3">
        {show && team && bd && bd.status !== 'no_pick' && bd.status !== 'pending' ? (
          <div>
            <span className={`${STATUS_STYLE[bd.status]} px-2.5 py-1 rounded-full text-xs`}>
              {isJoker ? `${bd.pts} pts 🃏` : STATUS_LABEL[bd.status]}
            </span>
            {isJoker && bd.basePts > 0 && (
              <div className="text-[10px] text-amber-400/60 mt-0.5">{bd.basePts}×2</div>
            )}
          </div>
        ) : show && team && bd?.status === 'pending' ? (
          <span className="text-xs text-ink-faint">Pending</span>
        ) : !show && team ? (
          <IconLock className="w-3.5 h-3.5 text-ink-faint" />
        ) : null}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PickPage() {
  const { token } = useParams<{ token: string }>()
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [entry, setEntry] = useState<Entry | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [pickSuccess, setPickSuccess] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  const loadData = useCallback(async () => {
    if (!token) return
    const [p, r, s, f] = await Promise.all([
      fetch(`/api/participants?token=${encodeURIComponent(token)}`).then(x => x.json()),
      fetch('/api/results').then(x => x.json()),
      fetch('/api/settings').then(x => x.json()),
      fetch('/api/fixtures').then(x => x.json()),
    ])
    if (p.error || !p.participant) { setNotFound(true); setLoading(false); return }
    setParticipant(p.participant)
    setResults(r.results || [])
    setSettings(s.settings)
    setFixtures(f.fixtures || [])
    if (p.participant.status === 'paid') {
      const e = await fetch(`/api/entries?name=${encodeURIComponent(p.participant.name)}`).then(x => x.json())
      setEntry(e.entry || null)
    }
    setLoading(false)
  }, [token])

  useEffect(() => { loadData() }, [loadData])

  // Persist token so "My Picks" button works from other pages
  useEffect(() => {
    if (token) {
      try { localStorage.setItem('my_picks_token', token) } catch {}
    }
  }, [token])

  const handlePickSuccess = (updated: Entry) => {
    setEntry(updated)
    setPickSuccess(true)
    setShowEditForm(false)
    setTimeout(() => setPickSuccess(false), 4000)
  }

  if (loading) return <LoadingState label="Loading your picks" />

  if (notFound) {
    return (
      <div className="space-y-5">
        <PageHeader title="Link not found" />
        <div className="glass-card p-8 text-center">
          <p className="text-4xl mb-4">🔗</p>
          <h2 className="font-display font-bold text-lg text-ink mb-2">Invalid link</h2>
          <p className="text-sm text-ink-muted">This link is invalid or has expired. Check your email for the correct link.</p>
          <Link href="/" className="btn-secondary mt-5 block text-center text-sm">← Go home</Link>
        </div>
      </div>
    )
  }

  if (!participant) return null

  if (participant.status === 'pending') {
    return (
      <div className="space-y-5">
        <PageHeader title="Payment pending" />
        <div className="glass-card p-8 text-center">
          <p className="text-4xl mb-4">⏳</p>
          <h2 className="font-display font-bold text-lg text-ink mb-2">Hi {participant.name}!</h2>
          <p className="text-sm text-ink-muted mb-2">Your payment hasn&apos;t been confirmed yet.</p>
          <p className="text-sm text-ink-muted">Once confirmed, you&apos;ll receive your picks link by email.</p>
          <Link href="/" className="btn-secondary mt-5 block text-center text-sm">← Go home</Link>
        </div>
      </div>
    )
  }

  // ── Paid participant — show full dashboard ──
  const currentRound = settings?.current_round ?? null
  const currentRoundDef = currentRound ? ROUNDS.find(r => r.num === currentRound) ?? null : null
  const deadlines = parseDeadlines(settings?.round_deadlines)
  const isCurrentLocked = currentRound ? isRoundLocked(deadlines, currentRound) : true
  const hasPickedCurrentRound = currentRound
    ? Boolean(entry?.[pickField(currentRound, 'team') as keyof Entry])
    : false
  const { total } = entry ? calcPoints(entry, results) : { total: 0 }

  const jokerUsed = entry?.joker_used ?? false
  const jokerRound = entry?.joker_round ?? null

  // Show pick form when: round is open, not locked, and (haven't picked yet OR editing)
  const showPickForm = Boolean(
    currentRoundDef &&
    !isCurrentLocked &&
    (!hasPickedCurrentRound || showEditForm)
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title={participant.name}
        subtitle="Your picks dashboard"
        actions={
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-pitch-light hover:text-pitch transition-colors"
          >
            <IconTrophy className="w-3.5 h-3.5" />
            Leaderboard
          </Link>
        }
      />

      {/* Score summary */}
      <div className="glass-card p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-gold-dim rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex items-end justify-between">
          <div>
            <p className="section-label mb-1">Total score</p>
            <div className="font-display text-5xl font-bold text-gold tracking-tight">{total}</div>
            <p className="text-xs text-ink-muted mt-1">points</p>
          </div>
          <div className="text-right space-y-2">
            {/* Only show joker status during knockout stage or once joker has been played */}
            {((currentRound ?? 0) >= 4 || jokerUsed) && (
              <div className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
                jokerUsed
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-white/5 text-ink-muted border-theme'
              }`}>
                {jokerUsed
                  ? `🃏 Joker played — ${ROUNDS.find(r => r.num === jokerRound)?.label ?? `Round ${jokerRound}`}`
                  : '🃏 Joker available'
                }
              </div>
            )}
            {(entry?.golden_goal != null || (currentRound === 1 && !hasPickedCurrentRound)) && (
              <div className="text-xs text-ink-faint">
                {entry?.golden_goal != null
                  ? `⚽ ${entry.golden_goal} goals (GG)`
                  : '⚽ GG — set on R1'
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success toast */}
      {pickSuccess && (
        <div className="alert-success font-semibold">✅ Pick saved!</div>
      )}

      {/* Current round — pick form or status */}
      {currentRoundDef && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">{currentRoundDef.label}</p>
            {isCurrentLocked ? (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <IconLock className="w-3 h-3" /> Locked
              </span>
            ) : (
              <span className="text-xs text-emerald-400 font-medium">● Open</span>
            )}
          </div>

          {showPickForm ? (
            <PickForm
              round={currentRoundDef}
              entry={entry}
              fixtures={fixtures}
              settings={settings}
              onSuccess={handlePickSuccess}
              participantName={participant.name}
            />
          ) : hasPickedCurrentRound ? (
            <div>
              {/* Show current pick with edit option */}
              {(() => {
                const team = entry![pickField(currentRound!, 'team') as keyof Entry] as string
                const myG = entry![pickField(currentRound!, 'my_goals') as keyof Entry] as number
                const oppG = entry![pickField(currentRound!, 'opp_goals') as keyof Entry] as number
                const isJoker = entry!.joker_round === currentRound
                const opp = fixtures.find(
                  fx => fx.round === currentRound && (fx.home_team === team || fx.away_team === team)
                )
                const oppTeam = opp ? (opp.home_team === team ? opp.away_team : opp.home_team) : null
                return (
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-ink mb-1">
                          {oppTeam
                            ? <TeamMatchup team={team} opponent={oppTeam} />
                            : <span className="flex items-center gap-1.5"><TeamFlag team={team} size={18} />{team}</span>
                          }
                        </div>
                        <p className="text-sm text-ink-muted">Predicted: {myG}–{oppG}</p>
                        {isJoker && (
                          <p className="text-xs text-amber-400 mt-0.5">🃏 Joker played — points doubled</p>
                        )}
                      </div>
                      {!isCurrentLocked && (
                        <button
                          onClick={() => setShowEditForm(true)}
                          className="btn-secondary text-xs px-3 py-1.5 shrink-0"
                        >
                          Edit pick
                        </button>
                      )}
                    </div>
                    {isCurrentLocked && (
                      <p className="text-xs text-ink-faint mt-3 flex items-center gap-1.5">
                        <IconLock className="w-3 h-3" /> Round locked — waiting for results
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          ) : isCurrentLocked ? (
            <p className="text-sm text-red-400">
              This round is locked — deadline has passed without a pick. 0 points.
            </p>
          ) : (
            <p className="text-sm text-ink-muted">Something went wrong loading the pick form.</p>
          )}
        </div>
      )}

      {!currentRoundDef && (
        <div className="glass-card p-5 text-center">
          <p className="text-2xl mb-2">🕐</p>
          <p className="text-sm font-semibold text-ink mb-1">No round currently open</p>
          <p className="text-xs text-ink-muted">Check back when the next round opens.</p>
        </div>
      )}

      {/* Round history */}
      <div className="glass-card p-5">
        <p className="section-label mb-1">Group stage</p>
        {GROUP_ROUNDS.map(r => (
          <RoundRow
            key={r.num}
            round={r}
            entry={entry}
            fixtures={fixtures}
            settings={settings}
            results={results}
            currentRound={currentRound}
          />
        ))}
        <p className="section-label mt-4 mb-1">Knockout</p>
        {KNOCKOUT_ROUNDS.map(r => (
          <RoundRow
            key={r.num}
            round={r}
            entry={entry}
            fixtures={fixtures}
            settings={settings}
            results={results}
            currentRound={currentRound}
          />
        ))}
      </div>

      {/* Bookmark reminder */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-faint">Bookmark this page</p>
          <p className="text-xs text-ink-muted mt-0.5">This is your personal link — use it every round</p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('Copied!')).catch(() => {})}
          className="btn-secondary text-xs px-3 py-1.5 shrink-0"
        >
          Copy link
        </button>
      </div>
    </div>
  )
}
