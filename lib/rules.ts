export const SCORING_RULES = [
  {
    points: 3,
    title: 'Correct prediction',
    description: 'You get 3 points if your picked team wins and you predict the exact final score.',
    example: 'You pick Scotland to win 2–1 and the final score is 2–1.',
    highlight: 'correct' as const,
  },
  {
    points: 1,
    title: 'Correct team',
    description: 'You get 1 point if your picked team wins, but you do not predict the exact score.',
    example: 'You pick Scotland to win 2–1 and Scotland win 1–0.',
    highlight: 'win' as const,
  },
  {
    points: 0,
    title: 'Draw',
    description: 'You get 0 points if your picked team\'s match ends in a draw.',
    example: 'You pick Scotland and the match finishes 1–1.',
    highlight: 'draw' as const,
  },
  {
    points: 0,
    title: 'Loss',
    description: 'You get 0 points if your picked team loses.',
    example: 'You pick Scotland and they lose the match.',
    highlight: 'lost' as const,
  },
]

export const GAME_RULES = [
  {
    step: '01',
    title: 'Group stage',
    body: 'Pick one team for each of Round 1, Round 2, and Round 3 of the group stage. You cannot pick the same team twice within the group stage.',
  },
  {
    step: '02',
    title: 'Knockout stage',
    body: 'After the group stage, pick one team for each knockout round: Last 32, Last 16, Quarter-finals, Semi-finals, and the Final. You cannot repeat a team you have already picked in the knockout stage.',
  },
  {
    step: '03',
    title: 'Predict the score',
    body: 'For every round, predict the full-time score for your picked team\'s match. Your team must be named first.',
  },
  {
    step: '04',
    title: 'Everyone stays in',
    body: 'No one is knocked out of the competition — everyone picks every round and points keep accumulating all the way to the Final.',
  },
  {
    step: '05',
    title: 'Joker 🃏',
    body: 'Each player gets one Joker to use in the knockout stage (Round 4–8). When your Joker is played, your points for that round are doubled — 1 pt becomes 2, 3 pts becomes 6. The Joker is assigned by the admin before the round kicks off. You\'ll receive an email when yours is activated.',
  },
  {
    step: '06',
    title: 'Golden Goal ⚽',
    body: 'Before Round 1 kicks off, predict the total number of goals scored across the entire tournament. This prediction is used as the tiebreaker if two or more players finish level on points — whoever is closest wins.',
  },
]

export const TIEBREAKER_RULES = [
  {
    rank: 1,
    label: 'Golden Goal ⚽',
    detail: 'Whoever\'s total goals prediction is closest to the actual tournament total wins the tie. Submitted before Round 1 and locked in — cannot be changed.',
  },
  {
    rank: 2,
    label: 'Earliest entry',
    detail: 'If Golden Goal predictions are identical, the player who submitted their Round 1 pick first wins.',
  },
]

export const MAX_POINTS = 27 // 7 rounds × 3pts + 1 Joker round × 6pts
