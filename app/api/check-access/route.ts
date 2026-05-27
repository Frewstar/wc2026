import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseDeadlines, isRoundLocked } from '@/lib/round-deadlines'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')?.trim()
  if (!name) return NextResponse.json({ allowed: false, reason: 'entries_closed' })

  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('entries_open, round_deadlines')
    .single()

  // Check if this name already has an entry
  const { data: existing } = await supabaseAdmin
    .from('entries')
    .select('id, paid')
    .ilike('name', name)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ allowed: true, existing: true, paid: existing.paid })
  }

  // R1 deadline locks all new entries
  const deadlines = parseDeadlines(settings?.round_deadlines)
  if (isRoundLocked(deadlines, 1)) {
    return NextResponse.json({ allowed: false, reason: 'deadline_passed' })
  }

  // Manual entries_open toggle
  if (!settings?.entries_open) {
    return NextResponse.json({ allowed: false, reason: 'entries_closed' })
  }

  return NextResponse.json({ allowed: true, existing: false, paid: false })
}
