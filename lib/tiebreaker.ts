import type { Entry } from './scoring'

export type Tiebreakers = {
  goldenGoalDiff: number | null  // |prediction - actual|, null until tournament ends or no prediction
  submittedAt: string            // created_at — last-resort tiebreak
}

export function computeTiebreakers(
  entry: Entry,
  actualGoals: number | null
): Tiebreakers {
  const goldenGoalDiff =
    actualGoals != null && entry.golden_goal != null
      ? Math.abs(entry.golden_goal - actualGoals)
      : null

  return {
    goldenGoalDiff,
    submittedAt: entry.created_at,
  }
}

/** Compare two tiebreaker objects. Returns negative if a wins, positive if b wins. */
export function compareByTiebreakers(a: Tiebreakers, b: Tiebreakers): number {
  if (a.goldenGoalDiff !== null && b.goldenGoalDiff !== null) {
    if (a.goldenGoalDiff !== b.goldenGoalDiff) return a.goldenGoalDiff - b.goldenGoalDiff
  } else if (a.goldenGoalDiff !== null) {
    return -1  // a has prediction, b doesn't → a wins
  } else if (b.goldenGoalDiff !== null) {
    return 1   // b has prediction, a doesn't → b wins
  }
  return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
}

export function tiebreakerLabel(
  entry: Entry,
  actualGoals: number | null
): string {
  if (entry.golden_goal == null) return 'No GG prediction'
  if (actualGoals == null) return `⚽ ${entry.golden_goal} goals`
  const diff = Math.abs(entry.golden_goal - actualGoals)
  return `⚽ ${entry.golden_goal} (±${diff} from actual)`
}
