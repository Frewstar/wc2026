import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * POST /api/admin/clear-demo
 * Wipes all demo data so you can start fresh with real players.
 * Deletes: all entries, all participants, all results, all knockout fixtures (R4+).
 * Resets: current_round → null, clears R4-R8 deadlines.
 * Keeps: group fixtures (R1-R3) and their deadlines — those are real match data.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  const body = await req.json().catch(() => ({}))
  if (body.confirm !== 'CLEAR_DEMO') {
    return NextResponse.json(
      { error: 'Send { "confirm": "CLEAR_DEMO" } to proceed' },
      { status: 400 }
    )
  }

  const results: Record<string, string> = {}

  // 1. Delete all entries
  const { error: eErr, count: eCount } = await supabaseAdmin
    .from('entries')
    .delete({ count: 'exact' })
    .gte('id', 0)   // match-all (entries have numeric id)
  results.entries = eErr ? `error: ${eErr.message}` : `deleted ${eCount ?? '?'}`

  // 2. Delete all participants
  const { error: pErr, count: pCount } = await supabaseAdmin
    .from('participants')
    .delete({ count: 'exact' })
    .gte('id', 0)
  results.participants = pErr ? `error: ${pErr.message}` : `deleted ${pCount ?? '?'}`

  // 3. Delete all results
  const { error: rErr, count: rCount } = await supabaseAdmin
    .from('results')
    .delete({ count: 'exact' })
    .gte('id', 0)
  results.results = rErr ? `error: ${rErr.message}` : `deleted ${rCount ?? '?'}`

  // 4. Delete knockout fixtures (R4 and above)
  const { error: fErr, count: fCount } = await supabaseAdmin
    .from('fixtures')
    .delete({ count: 'exact' })
    .gte('round', 4)
  results.knockout_fixtures = fErr ? `error: ${fErr.message}` : `deleted ${fCount ?? '?'}`

  // 5. Reset settings: clear current_round, clear R4-R8 deadlines, close entries
  const { data: settingsRow } = await supabaseAdmin
    .from('settings')
    .select('round_deadlines')
    .single()

  let cleanedDeadlines: Record<string, string> = {}
  if (settingsRow?.round_deadlines) {
    try {
      const all = JSON.parse(settingsRow.round_deadlines) as Record<string, string>
      // Keep only R1-R3
      for (const [k, v] of Object.entries(all)) {
        if (Number(k) <= 3) cleanedDeadlines[k] = v
      }
    } catch { /* keep empty */ }
  }

  const { error: sErr } = await supabaseAdmin
    .from('settings')
    .update({
      current_round: null,
      entries_open: false,
      round_deadlines: JSON.stringify(cleanedDeadlines),
    })
    .eq('id', 1)
  results.settings = sErr ? `error: ${sErr.message}` : 'reset'

  return NextResponse.json({ cleared: results })
}
