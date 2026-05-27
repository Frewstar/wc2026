import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { runAdvanceWinners } from '@/lib/tournament-sync'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { data } = await supabaseAdmin.from('results').select('*').order('round')
  return NextResponse.json({ results: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  const { round, home_team, away_team, home_goals, away_goals, winner_team, auto_advance } =
    await req.json()

  const { data, error } = await supabaseAdmin
    .from('results')
    .upsert(
      { round, home_team, away_team, home_goals, away_goals, winner_team: winner_team ?? null },
      { onConflict: 'round,home_team,away_team' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let advancesApplied = 0
  const shouldAdvance = auto_advance !== false && round >= 4
  if (shouldAdvance) {
    const { data: settings } = await supabaseAdmin.from('settings').select('auto_advance_bracket').eq('id', 1).single()
    if (settings?.auto_advance_bracket !== false) {
      advancesApplied = await runAdvanceWinners()
    }
  }

  return NextResponse.json({ result: data, advancesApplied })
}
