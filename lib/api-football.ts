/** Shared API-Football helpers for sync & widgets */

export const API_HOST = 'https://v3.football.api-sports.io'
export const WC_LEAGUE_ID = 1
export const WC_SEASON = 2026

/**
 * Maps exact API-Football team names → app internal names.
 * Confirmed against the live WC2026 API response.
 */
export const TEAM_MAP: Record<string, string> = {
  'Korea Republic':         'South Korea',
  'Czech Republic':         'Czechia',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'United States':          'USA',
  'Turkey':                 'Türkiye',
  // Fallbacks for older API name variants
  'Bosnia':                 'Bosnia & Herzegovina',
  'Curacao':                'Curaçao',
  'Congo DR':               'DR Congo',
}

export function mapTeam(name: string): string {
  return TEAM_MAP[name] ?? name
}

/** Map API round label → app round number (1–8). Returns null if unsupported. */
export function parseApiRound(roundStr: string): number | null {
  const s = roundStr.trim()
  const group = s.match(/^Group Stage - (\d+)$/i)
  if (group) {
    const n = parseInt(group[1], 10)
    return n >= 1 && n <= 3 ? n : null
  }
  const knockout: Record<string, number> = {
    'Round of 32': 4,
    'Round of 16': 5,
    'Quarter-finals': 6,
    'Quarter-Finals': 6,
    'Semi-finals': 7,
    'Semi-Finals': 7,
    Final: 8,
  }
  return knockout[s] ?? null
}

export type ApiFixtureParsed = {
  apiFixtureId: number
  round: number
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
  winnerTeam: string | null
  status: string
  kickoff: string
  isFinished: boolean
}

export function parseApiFixture(item: Record<string, unknown>): ApiFixtureParsed | null {
  const league = item.league as Record<string, unknown> | undefined
  const roundStr = (league?.round as string) ?? ''
  const round = parseApiRound(roundStr)
  if (!round) return null

  const fixture = item.fixture as Record<string, unknown>
  const status = (fixture?.status as Record<string, string>)?.short ?? ''
  const teams = item.teams as Record<string, Record<string, unknown>>
  const score = item.score as Record<string, Record<string, number | null>> | undefined
  const goals = item.goals as Record<string, number | null> | undefined

  const homeTeam = mapTeam((teams?.home?.name as string) ?? '')
  const awayTeam = mapTeam((teams?.away?.name as string) ?? '')
  if (!homeTeam || !awayTeam) return null

  const ftHome = score?.fulltime?.home ?? goals?.home
  const ftAway = score?.fulltime?.away ?? goals?.away
  const homeGoals = ftHome ?? 0
  const awayGoals = ftAway ?? 0

  let winnerTeam: string | null = null
  if (teams.home?.winner === true) winnerTeam = homeTeam
  else if (teams.away?.winner === true) winnerTeam = awayTeam
  else if (homeGoals > awayGoals) winnerTeam = homeTeam
  else if (awayGoals > homeGoals) winnerTeam = awayTeam

  const finished = ['FT', 'AET', 'PEN'].includes(status)

  return {
    apiFixtureId: fixture.id as number,
    round,
    homeTeam,
    awayTeam,
    homeGoals: homeGoals ?? 0,
    awayGoals: awayGoals ?? 0,
    winnerTeam,
    status,
    kickoff: (fixture.date as string) ?? '',
    isFinished: finished,
  }
}

export async function fetchAllFixtures(apiKey: string): Promise<ApiFixtureParsed[]> {
  const res = await fetch(
    `${API_HOST}/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
    { headers: { 'x-apisports-key': apiKey }, cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`API request failed: ${res.status}`)

  const json = await res.json()
  const items: unknown[] = json.response ?? []
  const parsed: ApiFixtureParsed[] = []

  for (const item of items) {
    const fix = parseApiFixture(item as Record<string, unknown>)
    if (fix) parsed.push(fix)
  }

  return parsed
}

/** Assign match_slot 1..N within each round, ordered by kickoff */
export function assignMatchSlots(fixtures: ApiFixtureParsed[]): Map<number, Map<number, number>> {
  const byRound = new Map<number, ApiFixtureParsed[]>()
  for (const f of fixtures) {
    const list = byRound.get(f.round) ?? []
    list.push(f)
    byRound.set(f.round, list)
  }

  const slotMap = new Map<number, Map<number, number>>()
  for (const [round, list] of byRound) {
    list.sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    const idToSlot = new Map<number, number>()
    list.forEach((f, i) => idToSlot.set(f.apiFixtureId, i + 1))
    slotMap.set(round, idToSlot)
  }
  return slotMap
}
