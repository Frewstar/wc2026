/**
 * All 72 WC2026 group stage fixtures.
 * Source: API-Football live data (exact team names after TEAM_MAP, times converted BST → UTC).
 * The API sync will overwrite kickoff with confirmed times when available.
 */
export type SeedFixture = {
  round: number
  home_team: string
  away_team: string
  kickoff: string
}

export const WC2026_GROUP_FIXTURES: SeedFixture[] = [
  // ── ROUND 1 (Matchday 1 · June 11–18) ─────────────────────────────────
  // Group A
  { round: 1, home_team: 'Mexico',           away_team: 'South Africa',       kickoff: '2026-06-11T19:00:00Z' },
  { round: 1, home_team: 'South Korea',      away_team: 'Czechia',            kickoff: '2026-06-12T02:00:00Z' },
  // Group B
  { round: 1, home_team: 'Canada',           away_team: 'Bosnia & Herzegovina', kickoff: '2026-06-12T19:00:00Z' },
  { round: 1, home_team: 'Qatar',            away_team: 'Switzerland',        kickoff: '2026-06-13T19:00:00Z' },
  // Group C
  { round: 1, home_team: 'Brazil',           away_team: 'Morocco',            kickoff: '2026-06-13T22:00:00Z' },
  { round: 1, home_team: 'Haiti',            away_team: 'Scotland',           kickoff: '2026-06-14T01:00:00Z' },
  // Group D
  { round: 1, home_team: 'USA',              away_team: 'Paraguay',           kickoff: '2026-06-13T01:00:00Z' },
  { round: 1, home_team: 'Australia',        away_team: 'Türkiye',            kickoff: '2026-06-14T04:00:00Z' },
  // Group E
  { round: 1, home_team: 'Germany',          away_team: 'Curaçao',            kickoff: '2026-06-14T17:00:00Z' },
  { round: 1, home_team: 'Ivory Coast',      away_team: 'Ecuador',            kickoff: '2026-06-14T23:00:00Z' },
  // Group F
  { round: 1, home_team: 'Netherlands',      away_team: 'Japan',              kickoff: '2026-06-14T20:00:00Z' },
  { round: 1, home_team: 'Sweden',           away_team: 'Tunisia',            kickoff: '2026-06-15T02:00:00Z' },
  // Group G  (8pm BST Jun 15 = 19:00 UTC)
  { round: 1, home_team: 'Belgium',          away_team: 'Egypt',              kickoff: '2026-06-15T19:00:00Z' },
  { round: 1, home_team: 'Iran',             away_team: 'New Zealand',        kickoff: '2026-06-16T01:00:00Z' },
  // Group H
  { round: 1, home_team: 'Spain',            away_team: 'Cape Verde',         kickoff: '2026-06-15T16:00:00Z' },
  { round: 1, home_team: 'Saudi Arabia',     away_team: 'Uruguay',            kickoff: '2026-06-15T22:00:00Z' },
  // Group I
  { round: 1, home_team: 'France',           away_team: 'Senegal',            kickoff: '2026-06-16T19:00:00Z' },
  { round: 1, home_team: 'Iraq',             away_team: 'Norway',             kickoff: '2026-06-16T22:00:00Z' },
  // Group J
  { round: 1, home_team: 'Argentina',        away_team: 'Algeria',            kickoff: '2026-06-17T01:00:00Z' },
  { round: 1, home_team: 'Austria',          away_team: 'Jordan',             kickoff: '2026-06-17T04:00:00Z' },
  // Group K
  { round: 1, home_team: 'Portugal',         away_team: 'DR Congo',           kickoff: '2026-06-17T17:00:00Z' },
  { round: 1, home_team: 'Uzbekistan',       away_team: 'Colombia',           kickoff: '2026-06-18T02:00:00Z' },
  // Group L
  { round: 1, home_team: 'England',          away_team: 'Croatia',            kickoff: '2026-06-17T20:00:00Z' },
  { round: 1, home_team: 'Ghana',            away_team: 'Panama',             kickoff: '2026-06-17T23:00:00Z' },

  // ── ROUND 2 (Matchday 2 · June 18–24) ─────────────────────────────────
  // Group A
  { round: 2, home_team: 'Czechia',          away_team: 'South Africa',       kickoff: '2026-06-18T16:00:00Z' },
  { round: 2, home_team: 'Mexico',           away_team: 'South Korea',        kickoff: '2026-06-19T01:00:00Z' },
  // Group B
  { round: 2, home_team: 'Switzerland',      away_team: 'Bosnia & Herzegovina', kickoff: '2026-06-18T19:00:00Z' },
  { round: 2, home_team: 'Canada',           away_team: 'Qatar',              kickoff: '2026-06-18T22:00:00Z' },
  // Group C
  { round: 2, home_team: 'Scotland',         away_team: 'Morocco',            kickoff: '2026-06-19T22:00:00Z' },
  { round: 2, home_team: 'Brazil',           away_team: 'Haiti',              kickoff: '2026-06-20T00:30:00Z' },
  // Group D  (USA vs Australia 8pm BST Jun 19 = 19:00 UTC; Turkey vs Paraguay 4am BST Jun 20 = 03:00 UTC)
  { round: 2, home_team: 'USA',              away_team: 'Australia',          kickoff: '2026-06-19T19:00:00Z' },
  { round: 2, home_team: 'Türkiye',          away_team: 'Paraguay',           kickoff: '2026-06-20T03:00:00Z' },
  // Group E
  { round: 2, home_team: 'Germany',          away_team: 'Ivory Coast',        kickoff: '2026-06-20T20:00:00Z' },
  { round: 2, home_team: 'Ecuador',          away_team: 'Curaçao',            kickoff: '2026-06-21T00:00:00Z' },
  // Group F
  { round: 2, home_team: 'Netherlands',      away_team: 'Sweden',             kickoff: '2026-06-20T17:00:00Z' },
  { round: 2, home_team: 'Tunisia',          away_team: 'Japan',              kickoff: '2026-06-21T04:00:00Z' },
  // Group G
  { round: 2, home_team: 'Belgium',          away_team: 'Iran',               kickoff: '2026-06-21T19:00:00Z' },
  { round: 2, home_team: 'New Zealand',      away_team: 'Egypt',              kickoff: '2026-06-22T01:00:00Z' },
  // Group H
  { round: 2, home_team: 'Spain',            away_team: 'Saudi Arabia',       kickoff: '2026-06-21T16:00:00Z' },
  { round: 2, home_team: 'Uruguay',          away_team: 'Cape Verde',         kickoff: '2026-06-21T22:00:00Z' },
  // Group I
  { round: 2, home_team: 'France',           away_team: 'Iraq',               kickoff: '2026-06-22T21:00:00Z' },
  { round: 2, home_team: 'Norway',           away_team: 'Senegal',            kickoff: '2026-06-23T00:00:00Z' },
  // Group J
  { round: 2, home_team: 'Argentina',        away_team: 'Austria',            kickoff: '2026-06-22T17:00:00Z' },
  { round: 2, home_team: 'Jordan',           away_team: 'Algeria',            kickoff: '2026-06-23T03:00:00Z' },
  // Group K
  { round: 2, home_team: 'Portugal',         away_team: 'Uzbekistan',         kickoff: '2026-06-23T17:00:00Z' },
  { round: 2, home_team: 'Colombia',         away_team: 'DR Congo',           kickoff: '2026-06-24T02:00:00Z' },
  // Group L
  { round: 2, home_team: 'England',          away_team: 'Ghana',              kickoff: '2026-06-23T20:00:00Z' },
  { round: 2, home_team: 'Panama',           away_team: 'Croatia',            kickoff: '2026-06-23T23:00:00Z' },

  // ── ROUND 3 (Matchday 3 · June 24–28, simultaneous per group) ─────────
  // Group A
  { round: 3, home_team: 'Czechia',          away_team: 'Mexico',             kickoff: '2026-06-25T01:00:00Z' },
  { round: 3, home_team: 'South Africa',     away_team: 'South Korea',        kickoff: '2026-06-25T01:00:00Z' },
  // Group B
  { round: 3, home_team: 'Switzerland',      away_team: 'Canada',             kickoff: '2026-06-24T19:00:00Z' },
  { round: 3, home_team: 'Bosnia & Herzegovina', away_team: 'Qatar',          kickoff: '2026-06-24T19:00:00Z' },
  // Group C
  { round: 3, home_team: 'Scotland',         away_team: 'Brazil',             kickoff: '2026-06-24T22:00:00Z' },
  { round: 3, home_team: 'Morocco',          away_team: 'Haiti',              kickoff: '2026-06-24T22:00:00Z' },
  // Group D
  { round: 3, home_team: 'Türkiye',          away_team: 'USA',                kickoff: '2026-06-26T02:00:00Z' },
  { round: 3, home_team: 'Paraguay',         away_team: 'Australia',          kickoff: '2026-06-26T02:00:00Z' },
  // Group E
  { round: 3, home_team: 'Curaçao',          away_team: 'Ivory Coast',        kickoff: '2026-06-25T20:00:00Z' },
  { round: 3, home_team: 'Ecuador',          away_team: 'Germany',            kickoff: '2026-06-25T20:00:00Z' },
  // Group F
  { round: 3, home_team: 'Japan',            away_team: 'Sweden',             kickoff: '2026-06-25T23:00:00Z' },
  { round: 3, home_team: 'Tunisia',          away_team: 'Netherlands',        kickoff: '2026-06-25T23:00:00Z' },
  // Group G
  { round: 3, home_team: 'Egypt',            away_team: 'Iran',               kickoff: '2026-06-27T03:00:00Z' },
  { round: 3, home_team: 'New Zealand',      away_team: 'Belgium',            kickoff: '2026-06-27T03:00:00Z' },
  // Group H
  { round: 3, home_team: 'Cape Verde',       away_team: 'Saudi Arabia',       kickoff: '2026-06-27T00:00:00Z' },
  { round: 3, home_team: 'Uruguay',          away_team: 'Spain',              kickoff: '2026-06-27T00:00:00Z' },
  // Group I
  { round: 3, home_team: 'Norway',           away_team: 'France',             kickoff: '2026-06-26T19:00:00Z' },
  { round: 3, home_team: 'Senegal',          away_team: 'Iraq',               kickoff: '2026-06-26T19:00:00Z' },
  // Group J
  { round: 3, home_team: 'Algeria',          away_team: 'Austria',            kickoff: '2026-06-28T02:00:00Z' },
  { round: 3, home_team: 'Jordan',           away_team: 'Argentina',          kickoff: '2026-06-28T02:00:00Z' },
  // Group K
  { round: 3, home_team: 'Colombia',         away_team: 'Portugal',           kickoff: '2026-06-27T23:30:00Z' },
  { round: 3, home_team: 'DR Congo',         away_team: 'Uzbekistan',         kickoff: '2026-06-27T23:30:00Z' },
  // Group L
  { round: 3, home_team: 'Panama',           away_team: 'England',            kickoff: '2026-06-27T21:00:00Z' },
  { round: 3, home_team: 'Croatia',          away_team: 'Ghana',              kickoff: '2026-06-27T21:00:00Z' },
]
