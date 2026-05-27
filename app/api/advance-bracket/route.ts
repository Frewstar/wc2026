import { NextResponse } from 'next/server'
import { runAdvanceWinners } from '@/lib/tournament-sync'

export async function POST() {
  try {
    const applied = await runAdvanceWinners()
    return NextResponse.json({ applied })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Advance failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
