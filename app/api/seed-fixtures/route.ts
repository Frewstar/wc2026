import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { WC2026_GROUP_FIXTURES } from '@/lib/wc2026-fixtures'

export async function POST() {
  let upserted = 0
  let errors: string[] = []

  for (const fx of WC2026_GROUP_FIXTURES) {
    // Try to find existing fixture by round + teams (either direction)
    const { data: byHome } = await supabaseAdmin
      .from('fixtures')
      .select('id, kickoff')
      .eq('round', fx.round)
      .eq('home_team', fx.home_team)
      .eq('away_team', fx.away_team)
      .maybeSingle()

    if (byHome) {
      // Update kickoff if it differs or is missing
      if (!byHome.kickoff || byHome.kickoff !== fx.kickoff) {
        await supabaseAdmin
          .from('fixtures')
          .update({ kickoff: fx.kickoff })
          .eq('id', byHome.id)
      }
      upserted++
      continue
    }

    // Check reversed home/away (in case API stored them differently)
    const { data: byAway } = await supabaseAdmin
      .from('fixtures')
      .select('id, kickoff')
      .eq('round', fx.round)
      .eq('home_team', fx.away_team)
      .eq('away_team', fx.home_team)
      .maybeSingle()

    if (byAway) {
      if (!byAway.kickoff || byAway.kickoff !== fx.kickoff) {
        await supabaseAdmin
          .from('fixtures')
          .update({ kickoff: fx.kickoff })
          .eq('id', byAway.id)
      }
      upserted++
      continue
    }

    // Not found — insert fresh
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

  return NextResponse.json({
    upserted,
    total: WC2026_GROUP_FIXTURES.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
