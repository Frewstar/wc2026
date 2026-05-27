/**
 * All tournament times displayed to users are in UK time (Europe/London).
 * The WC runs June 11 – July 19 2026, entirely within BST (UTC+1).
 * Using the IANA timezone ensures automatic DST handling.
 */

const UK_TZ = 'Europe/London'

/** "19 Jun, 19:00 BST" */
export function formatUKKickoff(iso: string): string {
  const d = new Date(iso)
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ,
    day: 'numeric',
    month: 'short',
  }).format(d)
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  const abbr = getUKAbbr(d)
  return `${date}, ${time} ${abbr}`
}

/** "19:00 BST" — short form for inline display */
export function formatUKTime(iso: string): string {
  const d = new Date(iso)
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return `${time} ${getUKAbbr(d)}`
}

/** "Thu 19 Jun · 19:00 BST" — full fixture label */
export function formatUKFixtureTime(iso: string): string {
  const d = new Date(iso)
  const full = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return `${full} ${getUKAbbr(d)}`
}

/** "2026-06-19T19:00" in UK time — for datetime-local input defaultValue */
export function toUKInputValue(iso: string): string {
  if (!iso) return ''
  // sv-SE locale produces "YYYY-MM-DD HH:mm:ss" — perfect for datetime-local
  return new Date(iso)
    .toLocaleString('sv-SE', {
      timeZone: UK_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(' ', 'T')
    .slice(0, 16)
}

/** Parse a datetime-local value entered in the UK timezone → UTC ISO string */
export function fromUKInputValue(value: string): string {
  if (!value) return ''
  // value is "YYYY-MM-DDTHH:mm" representing UK local time.
  // We approximate UTC by subtracting the UK offset at that moment.
  // Simple: the browser handles this if its timezone is UK. For safety we compute explicitly.
  const approxUtc = new Date(value + ':00Z') // treat as UTC first
  const utcMs = approxUtc.getTime()

  // Get what UK time "looks like" for that UTC moment
  const ukStr = new Date(utcMs).toLocaleString('sv-SE', { timeZone: UK_TZ }).replace(' ', 'T').slice(0, 16)

  // The difference between input and ukStr gives the offset to subtract
  const diff = new Date(value + ':00').getTime() - new Date(ukStr + ':00').getTime()
  return new Date(utcMs - diff).toISOString()
}

function getUKAbbr(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ,
    timeZoneName: 'short',
  }).formatToParts(d)
  return parts.find(p => p.type === 'timeZoneName')?.value ?? 'BST'
}
