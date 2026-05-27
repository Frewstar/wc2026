export type RoundPhase = 'group' | 'knockout'

export type RoundDef = {
  num: number
  key: string
  label: string
  short: string
  phase: RoundPhase
}

export const ROUNDS: RoundDef[] = [
  { num: 1, key: 'round1', label: 'Round 1', short: 'R1', phase: 'group' },
  { num: 2, key: 'round2', label: 'Round 2', short: 'R2', phase: 'group' },
  { num: 3, key: 'round3', label: 'Round 3', short: 'R3', phase: 'group' },
  { num: 4, key: 'round4', label: 'Last 32', short: '32', phase: 'knockout' },
  { num: 5, key: 'round5', label: 'Last 16', short: '16', phase: 'knockout' },
  { num: 6, key: 'round6', label: 'Quarter-finals', short: 'QF', phase: 'knockout' },
  { num: 7, key: 'round7', label: 'Semi-finals', short: 'SF', phase: 'knockout' },
  { num: 8, key: 'round8', label: 'Final', short: 'F', phase: 'knockout' },
]

export const GROUP_ROUNDS = ROUNDS.filter(r => r.phase === 'group')
export const KNOCKOUT_ROUNDS = ROUNDS.filter(r => r.phase === 'knockout')

export const ROUND_NUMBERS = ROUNDS.map(r => r.num)

export function getRound(num: number): RoundDef | undefined {
  return ROUNDS.find(r => r.num === num)
}

export function pickField(roundNum: number, field: 'team' | 'my_goals' | 'opp_goals'): string {
  const suffix = field === 'team' ? 'team' : field === 'my_goals' ? 'my_goals' : 'opp_goals'
  return `round${roundNum}_${suffix}`
}

export function emptyPicks(): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const r of ROUNDS) {
    out[pickField(r.num, 'team')] = ''
    out[pickField(r.num, 'my_goals')] = 0
    out[pickField(r.num, 'opp_goals')] = 0
  }
  return out
}

export function picksFromEntry(entry: Record<string, unknown>): Record<string, string | number> {
  const out = emptyPicks()
  for (const r of ROUNDS) {
    out[pickField(r.num, 'team')] = (entry[pickField(r.num, 'team')] as string) || ''
    out[pickField(r.num, 'my_goals')] = (entry[pickField(r.num, 'my_goals')] as number) ?? 0
    out[pickField(r.num, 'opp_goals')] = (entry[pickField(r.num, 'opp_goals')] as number) ?? 0
  }
  return out
}

export function getTeamsInRound(fixtures: { round: number; home_team: string; away_team: string }[], roundNum: number): string[] {
  const teams = new Set<string>()
  for (const f of fixtures.filter(fx => fx.round === roundNum)) {
    if (f.home_team && f.home_team !== 'TBD') teams.add(f.home_team)
    if (f.away_team && f.away_team !== 'TBD') teams.add(f.away_team)
  }
  return [...teams].sort()
}

export function hasGroupPicks(entry: Record<string, unknown>): boolean {
  return GROUP_ROUNDS.every(r => Boolean(entry[pickField(r.num, 'team')]))
}

export function hasKnockoutPicks(entry: Record<string, unknown>): boolean {
  return KNOCKOUT_ROUNDS.every(r => Boolean(entry[pickField(r.num, 'team')]))
}

export function missingKnockoutRounds(entry: Record<string, unknown>): number[] {
  return KNOCKOUT_ROUNDS.filter(r => !entry[pickField(r.num, 'team')]).map(r => r.num)
}
