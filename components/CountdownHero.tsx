'use client'
import { useEffect, useState } from 'react'
import { parseDeadlines } from '@/lib/round-deadlines'
import { ROUNDS, pickField } from '@/lib/rounds'
import type { Settings, Entry } from '@/lib/scoring'

type Props = {
  settings: Settings | null
  entry?: Entry | null   // pass to show "submitted" state on pick page
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function CountdownHero({ settings, entry }: Props) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const currentRound = settings?.current_round ?? null
  const roundDef     = ROUNDS.find(r => r.num === currentRound)
  const deadlines    = parseDeadlines(settings?.round_deadlines)
  const deadline     = currentRound ? (deadlines[String(currentRound)] ?? null) : null
  const msLeft       = deadline ? Math.max(0, new Date(deadline).getTime() - Date.now()) : null

  const hasPicked = currentRound && entry
    ? Boolean(entry[pickField(currentRound, 'team') as keyof Entry])
    : false

  // ── No round open ────────────────────────────────────────────────────────
  if (!currentRound || !roundDef) {
    return (
      <div className="rounded-2xl bg-surface border border-theme px-5 py-4 text-center">
        <p className="text-sm text-ink-faint">⏳ Next round opens soon — check back later</p>
      </div>
    )
  }

  // ── Already picked ───────────────────────────────────────────────────────
  if (hasPicked) {
    const team = entry?.[pickField(currentRound, 'team') as keyof Entry] as string | undefined
    return (
      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-5 py-4 text-center">
        <p className="text-sm font-semibold text-emerald-400">
          ✅ {roundDef.label} pick submitted — good luck!
        </p>
        {team && <p className="text-xs text-emerald-300/60 mt-0.5">Backed: {team}</p>}
      </div>
    )
  }

  // ── Deadline passed / no deadline set ────────────────────────────────────
  if (msLeft === null || msLeft === 0) {
    return (
      <div className="rounded-2xl bg-red-500/10 border border-red-500/30 px-5 py-4 text-center">
        <p className="text-sm font-semibold text-red-400">
          🔒 {roundDef.label} picks are closed
        </p>
      </div>
    )
  }

  // ── Live countdown ───────────────────────────────────────────────────────
  const totalSec = Math.floor(msLeft / 1000)
  const days  = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins  = Math.floor((totalSec % 3600) / 60)
  const secs  = totalSec % 60

  const isUrgent  = msLeft < 3_600_000     // < 1 hr
  const isWarning = msLeft < 86_400_000    // < 24 hrs

  const wrapCls = isUrgent
    ? 'bg-red-500/15 border-red-500/40 animate-countdown-urgent'
    : isWarning
    ? 'bg-amber-500/15 border-amber-500/40 animate-pulse'
    : 'bg-pitch-muted/40 border-pitch/30'

  const accentCls = isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-pitch-light'
  const boxCls    = isUrgent
    ? 'bg-red-500/10 border-2 border-red-500/30 text-red-300'
    : isWarning
    ? 'bg-amber-500/10 border-2 border-amber-500/30 text-amber-200'
    : 'bg-pitch-muted/50 border-2 border-pitch/20 text-pitch-light'

  const units = [
    { val: days,  label: 'DAYS' },
    { val: hours, label: 'HRS'  },
    { val: mins,  label: 'MINS' },
    { val: secs,  label: 'SECS' },
  ]

  return (
    <div className={`rounded-2xl border px-4 py-4 ${wrapCls}`}>
      <p className={`text-[11px] font-bold uppercase tracking-widest text-center mb-3 ${accentCls}`}>
        {isUrgent ? '⚠️ CLOSING SOON — ' : ''}
        {roundDef.label.toUpperCase()} PICKS CLOSE IN
      </p>
      <div className="flex items-end justify-center gap-1.5">
        {units.map(({ val, label }, i) => (
          <div key={label} className="flex items-end">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-[58px] h-[58px] sm:w-16 sm:h-16 rounded-xl flex items-center justify-center font-display font-bold text-2xl sm:text-3xl tabular-nums ${boxCls}`}>
                {pad(val)}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${accentCls}`}>
                {label}
              </span>
            </div>
            {i < 3 && (
              <span className={`text-xl font-bold mb-5 mx-0.5 leading-none ${accentCls}`}>:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
