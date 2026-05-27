import { NextRequest, NextResponse } from 'next/server'
import { syncFromApi } from '@/lib/tournament-sync'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { computeDeadlinesFromFixtures, mergeDeadlines, parseDeadlines } from '@/lib/round-deadlines'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  const apiKey = process.env.API_SPORTS_KEY
  if (!apiKey) return NextResponse.json({ error: 'API_SPORTS_KEY not set' }, { status: 500 })

  const url = new URL(req.url)
  const advance = url.searchParams.get('advance') !== 'false'

  try {
    const report = await syncFromApi(apiKey, advance)

    // After syncing, recompute deadlines from all fixtures (including newly populated knockouts)
    const { data: allFixtures } = await supabaseAdmin
      .from('fixtures')
      .select('round, kickoff')
    if (allFixtures && allFixtures.length > 0) {
      const computed = computeDeadlinesFromFixtures(allFixtures)
      const { data: settings } = await supabaseAdmin.from('settings').select('round_deadlines').single()
      const existing = parseDeadlines(settings?.round_deadlines)
      const merged = mergeDeadlines(existing, computed)
      await supabaseAdmin.from('settings').update({ round_deadlines: JSON.stringify(merged) }).eq('id', 1)
    }

    return NextResponse.json({ synced: report.resultsSynced, ...report })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Sync failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
