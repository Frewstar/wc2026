import { TEAMS } from './scoring'

/** Official FIFA World Cup 2026 final draw (Dec 2025) */
export const WC_GROUPS: Record<string, readonly string[]> = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  B: ['Canada', 'Switzerland', 'Qatar', 'Bosnia & Herzegovina'],
  C: ['Brazil', 'Morocco', 'Scotland', 'Haiti'],
  D: ['USA', 'Paraguay', 'Australia', 'Türkiye'],
  E: ['Germany', 'Ecuador', 'Ivory Coast', 'Curaçao'],
  F: ['Netherlands', 'Japan', 'Tunisia', 'Sweden'],
  G: ['Belgium', 'Iran', 'Egypt', 'New Zealand'],
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde'],
  I: ['France', 'Senegal', 'Norway', 'Iraq'],
  J: ['Argentina', 'Austria', 'Algeria', 'Jordan'],
  K: ['Portugal', 'Colombia', 'Uzbekistan', 'DR Congo'],
  L: ['England', 'Croatia', 'Panama', 'Ghana'],
}

export const GROUP_LETTERS = Object.keys(WC_GROUPS) as (keyof typeof WC_GROUPS)[]

const TEAM_TO_GROUP: Record<string, string> = Object.fromEntries(
  GROUP_LETTERS.flatMap(letter =>
    WC_GROUPS[letter].map(team => [team, letter])
  )
)

// Sanity check at module load — every known team should belong to a group
for (const team of TEAMS) {
  if (!TEAM_TO_GROUP[team]) {
    console.warn(`[wc-groups] Team missing from group map: ${team}`)
  }
}

export function getTeamGroup(team: string): string | null {
  return TEAM_TO_GROUP[team] ?? null
}

export type GroupedTeams = {
  group: string
  teams: string[]
}

/** Returns teams grouped A–L, optionally filtered by search query */
export function getTeamsGroupedByGroup(search = ''): GroupedTeams[] {
  const q = search.trim().toLowerCase()

  return GROUP_LETTERS.map(group => ({
    group,
    teams: WC_GROUPS[group].filter(team =>
      TEAMS.includes(team) && (!q || team.toLowerCase().includes(q))
    ),
  })).filter(g => g.teams.length > 0)
}
