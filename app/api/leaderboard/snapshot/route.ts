import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-auth'
import { calcPoints, compareEntries, type Entry, type Result, type Settings } from '@/lib/scoring'

/**
 * GET  /api/leaderboard/snapshot  — latest snapshot for the current round
 * POST /api/leaderboard/snapshot  — save current standings (admin only)
 */

export async function GET() {
  // Fetch current round from settings
  const { data: settingsRow } = await supabaseAdmin
    .from('settings')
    .select('current_round')
    .eq('id', 1)
    .single()

  const round = settingsRow?.current_round ?? null
  if (!round) {
    return NextResponse.json({ snapshot: null })
  }

  // Get the most recent snapshot for this round
  const { data: rows } = await supabaseAdmin
    .from('leaderboard_snapshots')
    .select('participant_name, position, points, snapshot_at')
    .eq('round', round)
    .order('snapshot_at', { ascending: false })
    .limit(200)

  if (!rows || rows.length === 0) {
    return NextResponse.json({ snapshot: null, round })
  }

  // Group by snapshot_at — take the latest batch
  const latestTs = rows[0].snapshot_at
  const snapshot: Record<string, { position: number; points: number }> = {}
  for (const row of rows) {
    if (row.snapshot_at !== latestTs) break
    snapshot[row.participant_name] = { position: row.position, points: row.points }
  }

  return NextResponse.json({ snapshot, round, snapshot_at: latestTs })
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  // Load current data
  const [{ data: entriesData }, { data: resultsData }, { data: settingsData }] = await Promise.all([
    supabaseAdmin.from('entries').select('*'),
    supabaseAdmin.from('results').select('*'),
    supabaseAdmin.from('settings').select('*').eq('id', 1).single(),
  ])

  const entries: Entry[] = entriesData ?? []
  const results: Result[] = resultsData ?? []
  const settings: Settings | null = settingsData ?? null
  const round = settings?.current_round ?? null

  if (!round) {
    return NextResponse.json({ error: 'No round currently open' }, { status: 400 })
  }

  const actualGoals = settings?.actual_golden_goal ?? null

  // Compute current rankings (paid entries only after tournament starts — simple: use all entries)
  const ranked = entries
    .map(e => ({ e, ...calcPoints(e, results) }))
    .sort((a, b) =>
      compareEntries({ entry: a.e, total: a.total }, { entry: b.e, total: b.total }, actualGoals)
    )

  // Insert snapshot rows
  const snapshotAt = new Date().toISOString()
  const rows = ranked.map(({ e, total }, idx) => ({
    round,
    participant_name: e.name,
    position: idx + 1,
    points: total,
    snapshot_at: snapshotAt,
  }))

  const { error } = await supabaseAdmin.from('leaderboard_snapshots').insert(rows)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ saved: rows.length, round, snapshot_at: snapshotAt })
}
