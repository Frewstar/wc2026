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
    body: 'Pick one team for each of Round 1, Round 2, and Round 3 of the group stage.',
  },
  {
    step: '02',
    title: 'Knockout stage',
    body: 'After the group stage, pick one team for each knockout round: Last 32, Last 16, Quarter-finals, Semi-finals, and the Final.',
  },
  {
    step: '03',
    title: 'No repeats',
    body: 'You cannot pick the same team twice across all eight rounds.',
  },
  {
    step: '04',
    title: 'Predict the score',
    body: 'For every round, predict the full-time score for your picked team\'s match.',
  },
  {
    step: '05',
    title: 'Everyone stays in',
    body: 'No one is knocked out of the competition — all players vote every round and points keep adding up.',
  },
  {
    step: '06',
    title: 'Running total',
    body: 'Points from all eight rounds accumulate on the leaderboard through to the Final.',
  },
  {
    step: '07',
    title: 'Golden Goal',
    body: 'When entering your group stage picks, predict the total number of goals scored across the entire tournament. This is your final tiebreaker.',
  },
]

export const TIEBREAKER_RULES = [
  { rank: 1, label: 'Most exact scores', detail: 'Count of 3-point picks (correct team and correct score)' },
  { rank: 2, label: 'Most correct wins', detail: 'Count of 1-point picks (correct team, wrong score)' },
  { rank: 3, label: 'Golden Goal', detail: 'Closest prediction of total tournament goals wins. Entered at the start of the competition.' },
  { rank: 4, label: 'Earliest entry', detail: 'If everything else is equal, the player who submitted picks first wins.' },
]

export const MAX_POINTS = 24
