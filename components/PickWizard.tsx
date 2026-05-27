'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { pickField, picksFromEntry, getTeamsInRound, type RoundDef } from '@/lib/rounds'
import { getTeamGroup } from '@/lib/wc-groups'
import { parseDeadlines, isRoundLocked } from '@/lib/round-deadlines'
import { LoadingState } from '@/components/ui'
import { IconArrowLeft } from '@/components/icons'
import { TeamFlag, TeamMatchup } from '@/components/TeamFlag'
import { TeamGroupPicker } from '@/components/TeamGroupPicker'
import { KnockoutTeamPicker } from '@/components/KnockoutTeamPicker'
import { RoundCountdown } from '@/components/RoundCountdown'

type Fixture = { round: number; home_team: string; away_team: string }
type SettingsShape = { entries_open?: boolean; knockout_entries_open?: boolean; round_deadlines?: string | null }

function ScoreStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-10 h-10 rounded-xl bg-surface border border-theme text-ink-muted hover:bg-surface-hover hover:text-ink flex items-center justify-center text-xl transition-all active:scale-95"
      >
        −
      </button>
      <span className="font-display text-3xl font-bold w-10 text-center text-ink">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        className="w-10 h-10 rounded-xl bg-surface border border-theme text-ink-muted hover:bg-surface-hover hover:text-ink flex items-center justify-center text-xl transition-all active:scale-95"
      >
        +
      </button>
    </div>
  )
}

type PickWizardProps = {
  name: string
  isEdit: boolean
  phase: 'group' | 'knockout'
  rounds: RoundDef[]
  apiMethod: 'POST' | 'PUT'
  submitLabel: string
  backHref: string
}

export function PickWizard({ name, isEdit, phase, rounds, apiMethod, submitLabel, backHref }: PickWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [picks, setPicks] = useState<Record<string, string | number>>({})
  const [search, setSearch] = useState('')
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deadlines, setDeadlines] = useState<Record<string, string>>({})
  const [goldenGoal, setGoldenGoal] = useState<number | ''>('')

  // Group phase has an extra Golden Goal step before review
  const goldenGoalStep = phase === 'group' ? rounds.length : -1
  const reviewStep = phase === 'group' ? rounds.length + 1 : rounds.length

  useEffect(() => {
    Promise.all([
      fetch('/api/fixtures').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([f, s]) => {
      setFixtures(f.fixtures || [])
      const settings = (s.settings ?? {}) as SettingsShape
      setDeadlines(parseDeadlines(settings.round_deadlines))
    })
  }, [])

  useEffect(() => {
    if (!name) return
    fetch(`/api/entries?name=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(d => {
        if (d.entry) {
          setPicks(picksFromEntry(d.entry))
          if (d.entry.golden_goal != null) setGoldenGoal(d.entry.golden_goal)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [name])

  if (loading) return <LoadingState label="Loading picks" />

  const round = rounds[step]
  const roundNum = round?.num
  const teamKey = round ? pickField(roundNum, 'team') : ''
  const myKey = round ? pickField(roundNum, 'my_goals') : ''
  const oppKey = round ? pickField(roundNum, 'opp_goals') : ''
  const currentTeam = (picks[teamKey] as string) || ''

  const usedTeams = [1, 2, 3, 4, 5, 6, 7, 8]
    .filter(n => n !== roundNum)
    .map(n => picks[pickField(n, 'team')] as string)
    .filter(Boolean)

  const getOpp = (rNum: number, team: string) => {
    const f = fixtures.find(fx => fx.round === rNum && (fx.home_team === team || fx.away_team === team))
    return f ? (f.home_team === team ? f.away_team : f.home_team) : null
  }

  const adj = (field: string, delta: number) => {
    setPicks(p => ({ ...p, [field]: Math.max(0, Math.min(20, (p[field] as number) + delta)) }))
  }

  const currentRoundLocked = round ? isRoundLocked(deadlines, roundNum) : false

  const nextStep = () => {
    if (!currentTeam) { setError('Pick a team first'); return }
    setError('')
    setSearch('')
    setStep(s => s + 1)
  }

  const submit = async () => {
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/entries', {
      method: apiMethod,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ...picks, phase, golden_goal: goldenGoal !== '' ? goldenGoal : null }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setSubmitting(false)
      return
    }
    router.push(`/picks?name=${encodeURIComponent(name)}`)
  }

  if (step === goldenGoalStep && phase === 'group') {
    return (
      <div className="space-y-5">
        {isEdit && <div className="alert-info">Editing your group stage picks</div>}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setStep(s => s - 1)} className="btn-ghost">
            <IconArrowLeft />
            Back
          </button>
          <div className="flex-1">
            <div className="section-label mb-2">Picking for — {name}</div>
            <div className="flex gap-1.5">
              {Array.from({ length: rounds.length + 1 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i < step ? 'bg-pitch-light' : i === step ? 'bg-gold' : 'bg-ink-faint/20'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-xs text-ink-faint font-medium">{step + 1}/{rounds.length + 1}</div>
        </div>

        <div className="glass-card p-6 text-center space-y-5">
          <div>
            <p className="font-display font-bold text-xl text-ink">Golden Goal</p>
            <p className="text-sm text-ink-muted mt-2 leading-relaxed">
              How many goals will be scored in total across the whole tournament?
            </p>
            <p className="text-xs text-ink-faint mt-1">
              Used as the final tiebreaker if scores are level at the end. Closest prediction wins.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setGoldenGoal(g => typeof g === 'number' ? Math.max(0, g - 1) : 0)}
              className="w-12 h-12 rounded-xl bg-surface border border-theme text-ink-muted hover:bg-surface-hover text-2xl flex items-center justify-center transition-all active:scale-95"
            >−</button>
            <input
              type="number"
              min={0}
              max={500}
              value={goldenGoal}
              onChange={e => setGoldenGoal(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              className="w-24 text-center font-display text-4xl font-bold text-ink bg-transparent border-b-2 border-pitch/40 focus:border-pitch-light outline-none py-2"
              placeholder="—"
            />
            <button
              type="button"
              onClick={() => setGoldenGoal(g => typeof g === 'number' ? g + 1 : 1)}
              className="w-12 h-12 rounded-xl bg-surface border border-theme text-ink-muted hover:bg-surface-hover text-2xl flex items-center justify-center transition-all active:scale-95"
            >+</button>
          </div>
          {goldenGoal !== '' && (
            <p className="text-sm text-pitch-light font-medium">Your prediction: {goldenGoal} goals</p>
          )}
          <p className="text-xs text-ink-faint">WC 2022 had 172 goals. WC 2018 had 169. With 48 teams this time, expect more.</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="button" onClick={() => { setError(''); setStep(s => s + 1) }} className="btn-primary">
          {goldenGoal !== '' ? 'Review Picks' : 'Skip & Review'}
        </button>
      </div>
    )
  }

  if (step === reviewStep) {
    return (
      <div className="space-y-5">
        {isEdit && <div className="alert-info">Editing your {phase === 'group' ? 'group stage' : 'knockout'} picks</div>}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setStep(reviewStep - 1)} className="btn-ghost">
            <IconArrowLeft />
            Back
          </button>
          <h2 className="font-display font-bold text-lg">Review — {name}</h2>
        </div>
        <div className="glass-card p-5 space-y-1">
          {rounds.map(r => {
            const t = picks[pickField(r.num, 'team')] as string
            const my = picks[pickField(r.num, 'my_goals')] as number
            const opp = picks[pickField(r.num, 'opp_goals')] as number
            const opponent = t ? getOpp(r.num, t) : null
            const group = t ? getTeamGroup(t) : null
            return (
              <div key={r.num} className="flex items-center justify-between py-3 border-b border-theme last:border-0">
                <div>
                  <div className="section-label mb-1">{r.label}</div>
                  {t ? <TeamMatchup team={t} opponent={opponent} className="font-semibold" /> : <span className="text-ink-faint">—</span>}
                  {group && phase === 'group' && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint mt-0.5 inline-block">
                      Group {group}
                    </span>
                  )}
                  {t && <div className="text-sm text-ink-muted mt-1">{my}–{opp}</div>}
                </div>
                <button type="button" onClick={() => setStep(rounds.findIndex(x => x.num === r.num))} className="text-xs text-pitch-light hover:text-pitch transition-colors font-medium">
                  Edit
                </button>
              </div>
            )
          })}
        </div>
        {phase === 'group' && (
          <div className="glass-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-faint uppercase tracking-wide font-semibold">Golden Goal</p>
              <p className="text-ink font-display font-bold text-xl mt-0.5">
                {goldenGoal !== '' ? `${goldenGoal} goals` : <span className="text-ink-faint text-sm">Not set</span>}
              </p>
            </div>
            <button type="button" onClick={() => setStep(goldenGoalStep)} className="text-xs text-pitch-light hover:text-pitch transition-colors font-medium">
              Edit
            </button>
          </div>
        )}
        <div className="alert-warning">Double-check everything before saving. Everyone stays in — no one is knocked out of the competition.</div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="button" onClick={submit} disabled={submitting} className="btn-primary">
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    )
  }

  const opponent = currentTeam ? getOpp(roundNum, currentTeam) : null
  const knockoutTeams = phase === 'knockout' ? getTeamsInRound(fixtures, roundNum) : []

  return (
    <div className="space-y-5">
      {isEdit && <div className="alert-info">Editing your {phase === 'group' ? 'group stage' : 'knockout'} picks</div>}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => step > 0 ? setStep(s => s - 1) : router.push(backHref)} className="btn-ghost">
          <IconArrowLeft />
          Back
        </button>
        <div className="flex-1">
          <div className="section-label mb-2">Picking for — {name}</div>
          <div className="flex gap-1.5">
            {Array.from({ length: reviewStep }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-pitch-light' : i === step ? 'bg-gold' : 'bg-ink-faint/20'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="text-xs text-ink-faint font-medium">{step + 1}/{reviewStep}</div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="font-display font-bold text-base">{round.label}</h2>
          <RoundCountdown deadlines={deadlines} roundNum={roundNum} />
        </div>
        {phase === 'knockout' && (
          <p className="text-xs text-ink-muted mb-4">Pick from teams playing in this round</p>
        )}
        {phase === 'group' && (
          <input
            type="text"
            placeholder="Search teams or groups..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field-sm mb-3"
          />
        )}
        <div className="max-h-72 overflow-y-auto rounded-xl border border-theme">
          {phase === 'group' ? (
            <TeamGroupPicker
              search={search}
              selectedTeam={currentTeam}
              usedTeams={usedTeams}
              onSelect={team => setPicks(p => ({ ...p, [teamKey]: team }))}
            />
          ) : (
            <KnockoutTeamPicker
              teams={knockoutTeams}
              selectedTeam={currentTeam}
              usedTeams={usedTeams}
              onSelect={team => setPicks(p => ({ ...p, [teamKey]: team }))}
            />
          )}
        </div>

        {currentTeam && (
          <div className="mt-5 pt-5 border-t border-theme">
            <p className="text-sm font-semibold mb-4 text-ink">
              Predict the score
              {opponent && (
                <span className="font-normal text-ink-muted block mt-2">
                  <TeamMatchup team={currentTeam} opponent={opponent} />
                </span>
              )}
            </p>
            <div className="flex items-center gap-6 justify-center">
              <div className="text-center">
                <div className="section-label mb-3">{currentTeam}</div>
                <ScoreStepper
                  value={picks[myKey] as number}
                  onChange={v => adj(myKey, v - (picks[myKey] as number))}
                />
              </div>
              <div className="font-display text-2xl text-ink-faint pb-1">–</div>
              <div className="text-center">
                <div className="section-label mb-3">{opponent || 'Opponent'}</div>
                <ScoreStepper
                  value={picks[oppKey] as number}
                  onChange={v => adj(oppKey, v - (picks[oppKey] as number))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {currentRoundLocked && (
        <p className="text-amber-400 text-xs text-center">
          This round is locked — you can still update picks for open rounds
        </p>
      )}
      <button type="button" onClick={nextStep} disabled={!currentTeam} className="btn-primary">
        {currentRoundLocked ? 'Skip (locked)' : step < rounds.length - 1 ? 'Next Round' : 'Review Picks'}
      </button>
    </div>
  )
}
