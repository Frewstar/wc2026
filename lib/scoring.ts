import { ROUNDS, pickField } from './rounds'

export const TEAMS = [
  'Algeria', 'Argentina', 'Australia', 'Austria', 'Belgium',
  'Bosnia & Herzegovina', 'Brazil', 'Canada', 'Cape Verde',
  'Colombia', 'Croatia', 'Curaçao', 'Czechia', 'DR Congo',
  'Ecuador', 'Egypt', 'England', 'France', 'Germany', 'Ghana',
  'Haiti', 'Iran', 'Iraq', 'Ivory Coast', 'Japan', 'Jordan',
  'Mexico', 'Morocco', 'Netherlands', 'New Zealand',
  'Norway', 'Panama', 'Paraguay', 'Portugal', 'Qatar',
  'Saudi Arabia', 'Scotland', 'Senegal', 'South Africa', 'South Korea', 'Spain',
  'Sweden', 'Switzerland', 'Tunisia', 'Türkiye', 'Uruguay',
  'USA', 'Uzbekistan',
]

export type Entry = {
  id: string
  name: string
  round1_team: string | null
  round1_my_goals: number
  round1_opp_goals: number
  round2_team: string | null
  round2_my_goals: number
  round2_opp_goals: number
  round3_team: string | null
  round3_my_goals: number
  round3_opp_goals: number
  round4_team: string | null
  round4_my_goals: number
  round4_opp_goals: number
  round5_team: string | null
  round5_my_goals: number
  round5_opp_goals: number
  round6_team: string | null
  round6_my_goals: number
  round6_opp_goals: number
  round7_team: string | null
  round7_my_goals: number
  round7_opp_goals: number
  round8_team: string | null
  round8_my_goals: number
  round8_opp_goals: number
  golden_goal: number | null
  joker_round: number | null   // which round they played joker (null = unused)
  joker_used: boolean          // true once joker has been played
  paid: boolean
  created_at: string
}

export type Fixture = {
  id: string
  round: number
  home_team: string
  away_team: string
  api_fixture_id?: number | null
  match_slot?: number | null
  source?: 'manual' | 'api' | 'computed' | string | null
  kickoff?: string | null
}

export type Result = {
  id: string
  round: number
  home_team: string
  away_team: string
  home_goals: number
  away_goals: number
  winner_team?: string | null
}

export type Settings = {
  id: number
  admin_pass: string
  entries_open: boolean
  knockout_entries_open: boolean
  show_picks_r1: boolean
  show_picks_r2: boolean
  show_picks_r3: boolean
  show_picks_r4: boolean
  show_picks_r5: boolean
  show_picks_r6: boolean
  show_picks_r7: boolean
  show_picks_r8: boolean
  auto_advance_bracket?: boolean
  round_deadlines?: string | null
  whatsapp_group_url?: string | null
  whatsapp_invite_text?: string | null
  actual_golden_goal?: number | null
  current_round?: number | null   // admin sets to 1-8 to open that round for picks
}

export type RoundBreakdown = {
  pts: number         // final points after joker multiplier
  basePts: number     // points before joker multiplier (1 or 3 for good picks, 0 otherwise)
  status: 'no_pick' | 'pending' | 'win' | 'correct' | 'draw' | 'lost'
  team?: string
  joker: boolean      // true if joker was played this round
}

export type CalcPointsResult = {
  total: number
  rounds: Record<number, RoundBreakdown>
  r1: RoundBreakdown
  r2: RoundBreakdown
  r3: RoundBreakdown
  r4: RoundBreakdown
  r5: RoundBreakdown
  r6: RoundBreakdown
  r7: RoundBreakdown
  r8: RoundBreakdown
}

/** Score a single round. Returns base (pre-joker) points. joker flag is always false here — applied by calcPoints. */
export function scoreRound(
  team: string | null,
  myG: number,
  oppG: number,
  round: number,
  results: Result[]
): RoundBreakdown {
  if (!team) return { pts: 0, basePts: 0, status: 'no_pick', joker: false }

  const result = results.find(
    r => r.round === round && (r.home_team === team || r.away_team === team)
  )
  if (!result) return { pts: 0, basePts: 0, status: 'pending', team, joker: false }

  const isHome = result.home_team === team
  const teamGoals = isHome ? result.home_goals : result.away_goals
  const oppGoals = isHome ? result.away_goals : result.home_goals
  const isDraw = teamGoals === oppGoals
  const won = teamGoals > oppGoals

  if (isDraw) return { pts: 0, basePts: 0, status: 'draw', team, joker: false }
  if (!won) return { pts: 0, basePts: 0, status: 'lost', team, joker: false }
  if (myG === teamGoals && oppG === oppGoals) return { pts: 3, basePts: 3, status: 'correct', team, joker: false }
  return { pts: 1, basePts: 1, status: 'win', team, joker: false }
}

/** Maximum total points this entry can still reach (earned + up to 6 per unresolved pick, considering joker) */
export function maxPossiblePoints(entry: Entry, results: Result[]): number {
  let max = 0
  // Track whether joker can still be applied to a pending round
  let jokerCanApplyToPending = !entry.joker_used

  for (const r of ROUNDS) {
    const team = entry[pickField(r.num, 'team') as keyof Entry] as string | null
    if (!team) continue

    const result = results.find(
      res => res.round === r.num && (res.home_team === team || res.away_team === team)
    )
    const isJoker = entry.joker_round === r.num

    if (!result) {
      // Pending round: max 6 if joker on this round, else 3 (or 6 if joker unused)
      if (isJoker) {
        max += 6
      } else if (jokerCanApplyToPending) {
        max += 6  // optimistically apply unused joker to this round
        jokerCanApplyToPending = false
      } else {
        max += 3
      }
    } else {
      // Resolved round: use actual points (already includes joker multiplier from calcPoints)
      max += calcPoints(entry, results).rounds[r.num].pts
    }
  }
  return max
}

export function calcPoints(entry: Entry, results: Result[]): CalcPointsResult {
  const rounds: Record<number, RoundBreakdown> = {}
  let total = 0

  for (const r of ROUNDS) {
    const team = entry[pickField(r.num, 'team') as keyof Entry] as string | null
    const myG = entry[pickField(r.num, 'my_goals') as keyof Entry] as number
    const oppG = entry[pickField(r.num, 'opp_goals') as keyof Entry] as number
    const bd = scoreRound(team, myG ?? 0, oppG ?? 0, r.num, results)
    const isJoker = entry.joker_round === r.num
    // Joker doubles points if any were earned (×2 win/correct; ×2 of 0 = 0 for draw/loss)
    const finalPts = isJoker ? bd.pts * 2 : bd.pts
    rounds[r.num] = { ...bd, pts: finalPts, basePts: bd.pts, joker: isJoker }
    total += finalPts
  }

  return {
    total,
    rounds,
    r1: rounds[1],
    r2: rounds[2],
    r3: rounds[3],
    r4: rounds[4],
    r5: rounds[5],
    r6: rounds[6],
    r7: rounds[7],
    r8: rounds[8],
  }
}

export function isPickRevealed(settings: Settings | null, roundNum: number): boolean {
  if (!settings) return false
  const key = `show_picks_r${roundNum}` as keyof Settings
  return Boolean(settings[key] ?? false)
}

export function isKnockoutOpen(settings: Settings | null): boolean {
  return Boolean(settings?.knockout_entries_open)
}

export function entryPickPayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {}
  for (const r of ROUNDS) {
    payload[pickField(r.num, 'team')] = body[pickField(r.num, 'team')] || null
    payload[pickField(r.num, 'my_goals')] = body[pickField(r.num, 'my_goals')] ?? 0
    payload[pickField(r.num, 'opp_goals')] = body[pickField(r.num, 'opp_goals')] ?? 0
  }
  return payload
}

/**
 * Compare two scored entries for leaderboard ranking.
 * Primary: total points descending.
 * Tiebreaker: closest golden_goal prediction to actual (lower diff wins).
 *   - If actual not yet set: golden_goal is ignored.
 *   - A null prediction loses to any prediction when actual is set.
 * Last resort: earlier entry timestamp wins.
 */
export function compareEntries(
  a: { entry: Entry; total: number },
  b: { entry: Entry; total: number },
  actualGoals: number | null
): number {
  if (b.total !== a.total) return b.total - a.total
  if (actualGoals != null) {
    const aDiff = a.entry.golden_goal != null
      ? Math.abs(a.entry.golden_goal - actualGoals)
      : Infinity
    const bDiff = b.entry.golden_goal != null
      ? Math.abs(b.entry.golden_goal - actualGoals)
      : Infinity
    if (aDiff !== bDiff) return aDiff - bDiff
  }
  return new Date(a.entry.created_at).getTime() - new Date(b.entry.created_at).getTime()
}
