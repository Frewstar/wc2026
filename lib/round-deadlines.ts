/** Helpers for per-round pick deadlines (derived from earliest API kick-off per round) */

export type RoundDeadlines = Record<string, string> // roundNum (string) → ISO datetime

export function parseDeadlines(raw: string | null | undefined): RoundDeadlines {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

export function isRoundLocked(deadlines: RoundDeadlines, roundNum: number): boolean {
  const d = deadlines[String(roundNum)]
  if (!d) return false
  return Date.now() >= new Date(d).getTime()
}

export function getDeadline(deadlines: RoundDeadlines, roundNum: number): Date | null {
  const d = deadlines[String(roundNum)]
  return d ? new Date(d) : null
}

export function msUntilDeadline(deadlines: RoundDeadlines, roundNum: number): number {
  const d = getDeadline(deadlines, roundNum)
  if (!d) return Infinity
  return d.getTime() - Date.now()
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'locked'
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

/** Merge new earliest kick-offs into existing deadlines, only moving them earlier */
export function mergeDeadlines(
  existing: RoundDeadlines,
  incoming: RoundDeadlines
): RoundDeadlines {
  const merged = { ...existing }
  for (const [round, iso] of Object.entries(incoming)) {
    if (!merged[round] || iso < merged[round]) {
      merged[round] = iso
    }
  }
  return merged
}
