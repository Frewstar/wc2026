import { NextResponse } from 'next/server'
import { API_HOST, WC_LEAGUE_ID, WC_SEASON } from '@/lib/api-football'

export async function GET() {
  const apiKey = process.env.API_SPORTS_KEY
  if (!apiKey) return NextResponse.json({ error: 'API_SPORTS_KEY not set' }, { status: 500 })

  const res = await fetch(
    `${API_HOST}/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
    { headers: { 'x-apisports-key': apiKey }, cache: 'no-store' }
  )
  if (!res.ok) return NextResponse.json({ error: `API error ${res.status}` }, { status: 502 })

  const json = await res.json()
  const items: unknown[] = json.response ?? []

  const teamSet = new Set<string>()
  const fixtures: { home: string; away: string; round: string }[] = []

  for (const item of items as Record<string, unknown>[]) {
    const league = item.league as Record<string, unknown>
    const teams = item.teams as Record<string, Record<string, unknown>>
    const home = teams?.home?.name as string
    const away = teams?.away?.name as string
    const round = league?.round as string
    if (home) teamSet.add(home)
    if (away) teamSet.add(away)
    if (home && away && round?.includes('Group')) {
      fixtures.push({ home, away, round })
    }
  }

  return NextResponse.json({
    totalFixtures: items.length,
    groupFixtures: fixtures.length,
    teams: [...teamSet].sort(),
    sampleGroupFixtures: fixtures.slice(0, 10),
  })
}
