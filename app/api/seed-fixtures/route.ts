import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { WC2026_GROUP_FIXTURES } from '@/lib/wc2026-fixtures'
import { requireAdmin } from '@/lib/admin-auth'
import { computeDeadlinesFromFixtures, mergeDeadlines, parseDeadlines } from '@/lib/round-deadlines'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  let upserted = 0
  const errors: string[] = []

  for (const fx of WC2026_GROUP_FIXTURES) {
    const { data: byHome } = await supabaseAdmin
      .from('fixtures')
      .select('id, kickoff')
      .eq('round', fx.round)
      .eq('home_team', fx.home_team)
      .eq('away_team', fx.away_team)
      .maybeSingle()

    if (byHome) {
      if (!byHome.kickoff || byHome.kickoff !== fx.kickoff) {
        await supabaseAdmin.from('fixtures').update({ kickoff: fx.kickoff }).eq('id', byHome.id)
      }
      upserted++
      continue
    }

    const { data: byAway } = await supabaseAdmin
      .from('fixtures')
      .select('id, kickoff')
      .eq('round', fx.round)
      .eq('home_team', fx.away_team)
      .eq('away_team', fx.home_team)
      .maybeSingle()

    if (byAway) {
      if (!byAway.kickoff || byAway.kickoff !== fx.kickoff) {
        await supabaseAdmin.from('fixtures').update({ kickoff: fx.kickoff }).eq('id', byAway.id)
      }
      upserted++
      continue
    }

    const { error } = await supabaseAdmin.from('fixtures').insert({
      round: fx.round,
      home_team: fx.home_team,
      away_team: fx.away_team,
      kickoff: fx.kickoff,
      source: 'manual',
    })

    if (error) {
      errors.push(`R${fx.round} ${fx.home_team} vs ${fx.away_team}: ${error.message}`)
    } else {
      upserted++
    }
  }

  // Auto-compute and save R1-R3 deadlines from fixture kick-off times
  const computed = computeDeadlinesFromFixtures(WC2026_GROUP_FIXTURES)
  const { data: settings } = await supabaseAdmin.from('settings').select('round_deadlines').single()
  const existing = parseDeadlines(settings?.round_deadlines)
  const merged = mergeDeadlines(existing, computed)
  await supabaseAdmin.from('settings').update({ round_deadlines: JSON.stringify(merged) }).eq('id', 1)

  return NextResponse.json({
    upserted,
    total: WC2026_GROUP_FIXTURES.length,
    errors: errors.length > 0 ? errors : undefined,
    deadlines_updated: Object.keys(computed).length,
  })
}
