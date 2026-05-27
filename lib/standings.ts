import { WC_GROUPS, GROUP_LETTERS } from './wc-groups'
import type { Result } from './scoring'

export type TeamStanding = {
  team: string
  group: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
  rank: number
}

export type GroupStandings = {
  group: string
  teams: TeamStanding[]
}

function emptyStanding(team: string, group: string): TeamStanding {
  return { team, group, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0, rank: 0 }
}

/** FIFA group tiebreak: points, GD, GF, head-to-head (simplified — H2H among tied teams) */
function rankGroupTeams(teams: TeamStanding[], groupResults: Result[]): TeamStanding[] {
  const sorted = [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    // Head-to-head among tied teams (2-team tie only for simplicity)
    if (a.pts === b.pts) {
      const h2h = groupResults.filter(
        r =>
          (r.home_team === a.team && r.away_team === b.team) ||
          (r.home_team === b.team && r.away_team === a.team)
      )
      if (h2h.length === 1) {
        const m = h2h[0]
        const aHome = m.home_team === a.team
        const aGoals = aHome ? m.home_goals : m.away_goals
        const bGoals = aHome ? m.away_goals : m.home_goals
        if (aGoals !== bGoals) return bGoals - aGoals
      }
    }
    return a.team.localeCompare(b.team)
  })
  return sorted.map((t, i) => ({ ...t, rank: i + 1 }))
}

export function computeGroupStandings(results: Result[]): GroupStandings[] {
  const groupResults = results.filter(r => r.round >= 1 && r.round <= 3)

  return GROUP_LETTERS.map(group => {
    const teams = WC_GROUPS[group].map(team => emptyStanding(team, group))

    for (const r of groupResults) {
      const home = teams.find(t => t.team === r.home_team)
      const away = teams.find(t => t.team === r.away_team)
      if (!home || !away || home.group !== group) continue

      home.played++
      away.played++
      home.gf += r.home_goals
      home.ga += r.away_goals
      away.gf += r.away_goals
      away.ga += r.home_goals

      if (r.home_goals > r.away_goals) {
        home.won++
        home.pts += 3
        away.lost++
      } else if (r.home_goals < r.away_goals) {
        away.won++
        away.pts += 3
        home.lost++
      } else {
        home.drawn++
        away.drawn++
        home.pts++
        away.pts++
      }
    }

    for (const t of teams) {
      t.gd = t.gf - t.ga
    }

    const ranked = rankGroupTeams(teams, groupResults.filter(r => {
      const homeInGroup = WC_GROUPS[group].includes(r.home_team)
      const awayInGroup = WC_GROUPS[group].includes(r.away_team)
      return homeInGroup && awayInGroup
    }))

    return { group, teams: ranked }
  })
}

export function getThirdPlaceRankings(standings: GroupStandings[]): TeamStanding[] {
  const thirds = standings
    .map(g => g.teams.find(t => t.rank === 3))
    .filter((t): t is TeamStanding => Boolean(t))

  return [...thirds].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.team.localeCompare(b.team)
  })
}

export function getTeamAtPosition(standings: GroupStandings[], group: string, pos: 1 | 2 | 3): string | null {
  const g = standings.find(s => s.group === group)
  return g?.teams.find(t => t.rank === pos)?.team ?? null
}
