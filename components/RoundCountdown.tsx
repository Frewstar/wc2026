'use client'

import { useEffect, useState } from 'react'
import { formatCountdown, isRoundLocked, type RoundDeadlines } from '@/lib/round-deadlines'
import { formatUKTime } from '@/lib/uk-time'

type RoundCountdownProps = {
  deadlines: RoundDeadlines
  roundNum: number
  label?: string
  className?: string
}

export function RoundCountdown({ deadlines, roundNum, label, className = '' }: RoundCountdownProps) {
  const deadlineStr = deadlines[String(roundNum)]
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!deadlineStr) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [deadlineStr])

  if (!deadlineStr) return null

  const ms = new Date(deadlineStr).getTime() - now
  const locked = ms <= 0
  const urgent = ms > 0 && ms < 3600_000 // under 1 hour

  const lockAtUK = formatUKTime(deadlineStr)

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${locked ? 'text-red-400' : urgent ? 'text-amber-400' : 'text-ink-faint'} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${locked ? 'bg-red-400' : urgent ? 'bg-amber-400 animate-pulse' : 'bg-ink-faint/40'}`} />
      {locked
        ? `${label ?? 'Picks'} locked (${lockAtUK})`
        : `Locks ${lockAtUK} · ${formatCountdown(ms)}`
      }
    </div>
  )
}

export function useRoundLocked(deadlines: RoundDeadlines, roundNum: number): boolean {
  const [locked, setLocked] = useState(() => isRoundLocked(deadlines, roundNum))

  useEffect(() => {
    setLocked(isRoundLocked(deadlines, roundNum))
    const deadlineStr = deadlines[String(roundNum)]
    if (!deadlineStr) return
    const ms = new Date(deadlineStr).getTime() - Date.now()
    if (ms <= 0) return
    const id = setTimeout(() => setLocked(true), ms)
    return () => clearTimeout(id)
  }, [deadlines, roundNum])

  return locked
}
