import { NextRequest, NextResponse } from 'next/server'
import { syncFromApi } from '@/lib/tournament-sync'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  const apiKey = process.env.API_SPORTS_KEY
  if (!apiKey) return NextResponse.json({ error: 'API_SPORTS_KEY not set' }, { status: 500 })

  const url = new URL(req.url)
  const advance = url.searchParams.get('advance') !== 'false'

  try {
    const report = await syncFromApi(apiKey, advance)
    return NextResponse.json({ synced: report.resultsSynced, ...report })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Sync failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
