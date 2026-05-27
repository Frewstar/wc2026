import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/admin/set-joker
 * Admin-only: assign or remove a joker for a participant's entry.
 *
 * Body: { entry_id, joker_round }
 *  - joker_round: 4–8 to assign, null to remove
 */
export async function POST(req: NextRequest) {
  const { entry_id, joker_round } = await req.json()

  if (!entry_id) {
    return NextResponse.json({ error: 'entry_id required' }, { status: 400 })
  }

  // Joker is only valid in knockout rounds (4–8) or null to remove
  if (joker_round !== null && joker_round !== undefined) {
    const r = Number(joker_round)
    if (r < 4 || r > 8) {
      return NextResponse.json(
        { error: 'Joker can only be assigned to knockout rounds (R4–R8)' },
        { status: 400 }
      )
    }
  }

  const { data, error } = await supabaseAdmin
    .from('entries')
    .update({
      joker_round: joker_round ?? null,
      joker_used: joker_round != null,
    })
    .eq('id', entry_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}
