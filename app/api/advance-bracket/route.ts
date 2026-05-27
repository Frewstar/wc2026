import { NextRequest, NextResponse } from 'next/server'
import { runAdvanceWinners } from '@/lib/tournament-sync'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  try {
    const applied = await runAdvanceWinners()
    return NextResponse.json({ applied })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Advance failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
