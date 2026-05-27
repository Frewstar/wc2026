import type { Fixture, Result } from './scoring'
import {
  getTeamAtPosition,
  getThirdPlaceRankings,
  computeGroupStandings,
  type GroupStandings,
  type TeamStanding,
} from './standings'

export const PLACEHOLDER = 'TBD'

export type WinnerFeed = {
  fromRound: number
  fromSlot: number
  toRound: number
  toSlot: number
  position: 'home' | 'away'
}

/** Standard knockout bracket: pairs of winners feed into next round */
export const WINNER_FEEDS: WinnerFeed[] = (() => {
  const feeds: WinnerFeed[] = []
  for (let i = 0; i < 8; i++) {
    feeds.push({ fromRound: 4, fromSlot: i * 2 + 1, toRound: 5, toSlot: i + 1, position: 'home' })
    feeds.push({ fromRound: 4, fromSlot: i * 2 + 2, toRound: 5, toSlot: i + 1, position: 'away' })
  }
  for (let i = 0; i < 4; i++) {
    feeds.push({ fromRound: 5, fromSlot: i * 2 + 1, toRound: 6, toSlot: i + 1, position: 'home' })
    feeds.push({ fromRound: 5, fromSlot: i * 2 + 2, toRound: 6, toSlot: i + 1, position: 'away' })
  }
  for (let i = 0; i < 2; i++) {
    feeds.push({ fromRound: 6, fromSlot: i * 2 + 1, toRound: 7, toSlot: i + 1, position: 'home' })
    feeds.push({ fromRound: 6, fromSlot: i * 2 + 2, toRound: 7, toSlot: i + 1, position: 'away' })
  }
  feeds.push({ fromRound: 7, fromSlot: 1, toRound: 8, toSlot: 1, position: 'home' })
  feeds.push({ fromRound: 7, fromSlot: 2, toRound: 8, toSlot: 1, position: 'away' })
  return feeds
})()

/** FIFA 2026 Round of 32 template (wallchart.io bracket) — slots 1–16 */
export type R32Slot = {
  slot: number
  home: string | { type: 'position'; group: string; pos: 1 | 2 }
  away: string | { type: 'position'; group: string; pos: 1 | 2 } | { type: 'third'; groups: string[] }
}

export const R32_TEMPLATE: R32Slot[] = [
  { slot: 1, home: { type: 'position', group: 'A', pos: 2 }, away: { type: 'position', group: 'B', pos: 2 } },
  { slot: 2, home: { type: 'position', group: 'E', pos: 1 }, away: { type: 'third', groups: ['A', 'B', 'C', 'D', 'F'] } },
  { slot: 3, home: { type: 'position', group: 'F', pos: 1 }, away: { type: 'position', group: 'C', pos: 2 } },
  { slot: 4, home: { type: 'position', group: 'C', pos: 1 }, away: { type: 'position', group: 'F', pos: 2 } },
  { slot: 5, home: { type: 'position', group: 'I', pos: 1 }, away: { type: 'third', groups: ['C', 'D', 'F', 'G', 'H'] } },
  { slot: 6, home: { type: 'position', group: 'A', pos: 1 }, away: { type: 'third', groups: ['C', 'E', 'F', 'H', 'I'] } },
  { slot: 7, home: { type: 'position', group: 'E', pos: 2 }, away: { type: 'position', group: 'I', pos: 2 } },
  { slot: 8, home: { type: 'position', group: 'G', pos: 1 }, away: { type: 'third', groups: ['A', 'E', 'H', 'I', 'J'] } },
  { slot: 9, home: { type: 'position', group: 'D', pos: 1 }, away: { type: 'third', groups: ['B', 'E', 'F', 'I', 'J'] } },
  { slot: 10, home: { type: 'position', group: 'L', pos: 1 }, away: { type: 'third', groups: ['E', 'H', 'I', 'J', 'K'] } },
  { slot: 11, home: { type: 'position', group: 'K', pos: 2 }, away: { type: 'position', group: 'L', pos: 2 } },
  { slot: 12, home: { type: 'position', group: 'B', pos: 1 }, away: { type: 'third', groups: ['E', 'F', 'G', 'I', 'J'] } },
  { slot: 13, home: { type: 'position', group: 'H', pos: 1 }, away: { type: 'position', group: 'J', pos: 2 } },
  { slot: 14, home: { type: 'position', group: 'D', pos: 2 }, away: { type: 'position', group: 'G', pos: 2 } },
  { slot: 15, home: { type: 'position', group: 'J', pos: 1 }, away: { type: 'position', group: 'H', pos: 2 } },
  { slot: 16, home: { type: 'position', group: 'K', pos: 1 }, away: { type: 'third', groups: ['D', 'E', 'I', 'J', 'L'] } },
]

function resolveThirdSlot(
  groups: string[],
  qualifiedThirds: TeamStanding[],
  usedThirds: Set<string>
): string {
  for (const t of qualifiedThirds) {
    if (usedThirds.has(t.team)) continue
    if (groups.includes(t.group)) {
      usedThirds.add(t.team)
      return t.team
    }
  }
  return PLACEHOLDER
}

function resolveSlotTeam(
  spec: R32Slot['home'] | R32Slot['away'],
  standings: GroupStandings[],
  qualifiedThirds: TeamStanding[],
  usedThirds: Set<string>
): string {
  if (typeof spec === 'string') return spec
  if (spec.type === 'position') {
    return getTeamAtPosition(standings, spec.group, spec.pos) ?? PLACEHOLDER
  }
  if (spec.type === 'third') {
    return resolveThirdSlot(spec.groups, qualifiedThirds, usedThirds)
  }
  return PLACEHOLDER
}

export function buildR32FixturesFromStandings(results: Result[]): {
  fixtures: Array<{ round: number; match_slot: number; home_team: string; away_team: string }>
  pendingThirdSlots: number[]
} {
  const standings = computeGroupStandings(results)
  const qualifiedThirds = getThirdPlaceRankings(standings).slice(0, 8)
  const usedThirds = new Set<string>()
  const pendingThirdSlots: number[] = []

  const fixtures = R32_TEMPLATE.map(slot => {
    const home = resolveSlotTeam(slot.home, standings, qualifiedThirds, usedThirds)
    let away = resolveSlotTeam(slot.away, standings, qualifiedThirds, usedThirds)
    if (typeof slot.away === 'object' && slot.away.type === 'third' && away === PLACEHOLDER) {
      pendingThirdSlots.push(slot.slot)
    }
    return { round: 4, match_slot: slot.slot, home_team: home, away_team: away }
  })

  return { fixtures, pendingThirdSlots }
}

export function getMatchWinner(result: Result): string | null {
  if (result.winner_team) return result.winner_team
  if (result.home_goals > result.away_goals) return result.home_team
  if (result.away_goals > result.home_goals) return result.away_team
  return null
}

export type AdvanceUpdate = {
  round: number
  match_slot: number
  home_team?: string
  away_team?: string
}

/** Compute next-round team updates from finished knockout results */
export function computeWinnerAdvances(
  fixtures: Fixture[],
  results: Result[]
): AdvanceUpdate[] {
  const updates: AdvanceUpdate[] = []
  const fixtureByKey = new Map<string, Fixture>()
  for (const f of fixtures) {
    if (f.match_slot != null) {
      fixtureByKey.set(`${f.round}-${f.match_slot}`, f)
    }
  }

  for (const feed of WINNER_FEEDS) {
    const srcFix = fixtureByKey.get(`${feed.fromRound}-${feed.fromSlot}`)
    if (!srcFix) continue

    const result = results.find(
      r =>
        r.round === feed.fromRound &&
        r.home_team === srcFix.home_team &&
        r.away_team === srcFix.away_team
    )
    if (!result) continue

    const winner = getMatchWinner(result)
    if (!winner || winner === PLACEHOLDER) continue

    const update: AdvanceUpdate = {
      round: feed.toRound,
      match_slot: feed.toSlot,
    }
    if (feed.position === 'home') update.home_team = winner
    else update.away_team = winner
    updates.push(update)
  }

  return updates
}

export function isRealTeam(team: string | null | undefined): boolean {
  return Boolean(team && team !== PLACEHOLDER)
}
