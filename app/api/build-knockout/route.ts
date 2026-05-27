import { NextRequest, NextResponse } from 'next/server'
import { buildKnockoutFromStandings } from '@/lib/tournament-sync'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  try {
    const result = await buildKnockoutFromStandings()
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Build failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
