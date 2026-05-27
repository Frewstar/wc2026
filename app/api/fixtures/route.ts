import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('fixtures')
    .select('*')
    .order('round')
    .order('match_slot', { nullsFirst: false })
    .order('home_team')
  return NextResponse.json({ fixtures: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  const { round, home_team, away_team, match_slot } = await req.json()
  const { data, error } = await supabaseAdmin
    .from('fixtures')
    .insert({ round, home_team, away_team, match_slot: match_slot ?? null, source: 'manual' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fixture: data })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  const { id, home_team, away_team, match_slot } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const patch: Record<string, unknown> = { source: 'manual' }
  if (home_team !== undefined) patch.home_team = home_team
  if (away_team !== undefined) patch.away_team = away_team
  if (match_slot !== undefined) patch.match_slot = match_slot

  const { data, error } = await supabaseAdmin
    .from('fixtures')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fixture: data })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  await supabaseAdmin.from('fixtures').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
