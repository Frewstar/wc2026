import { NextResponse } from 'next/server'
import { buildKnockoutFromStandings } from '@/lib/tournament-sync'

export async function POST() {
  try {
    const result = await buildKnockoutFromStandings()
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Build failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
