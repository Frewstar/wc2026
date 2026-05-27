import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { pickField } from '@/lib/rounds'
import { parseDeadlines, isRoundLocked } from '@/lib/round-deadlines'

/**
 * POST /api/entries/pick
 * Submits or edits a single-round pick for a named participant.
 *
 * Body: { name, round, team, my_goals, opp_goals, joker?, golden_goal? }
 *
 * Validation:
 *  - round must equal settings.current_round
 *  - round deadline must not have passed
 *  - participant must be paid
 *  - no duplicate team within the same phase (G:1-3, K:4-8)
 *  - joker can only be played once, not after deadline
 *  - golden_goal only accepted on R1 first submission
 */
export async function POST(req: NextRequest) {
  const { name, round, team, my_goals, opp_goals, joker, golden_goal } = await req.json()

  if (!name || !round || !team) {
    return NextResponse.json({ error: 'name, round, and team are required' }, { status: 400 })
  }

  const roundNum = Number(round)

  // Fetch settings
  const { data: settings } = await supabaseAdmin.from('settings').select('*').single()
  if (!settings) return NextResponse.json({ error: 'Settings not found' }, { status: 500 })

  // Validate current_round gate
  if (settings.current_round !== roundNum) {
    return NextResponse.json(
      { error: `Round ${roundNum} is not currently open` },
      { status: 403 }
    )
  }

  // Check deadline
  const deadlines = parseDeadlines(settings.round_deadlines)
  if (isRoundLocked(deadlines, roundNum)) {
    return NextResponse.json(
      { error: 'This round is locked — the deadline has passed' },
      { status: 403 }
    )
  }

  // Check participant is paid
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('id, name, status')
    .ilike('name', name)
    .maybeSingle()

  if (!participant || participant.status !== 'paid') {
    return NextResponse.json({ error: 'Not authorised — payment not confirmed' }, { status: 403 })
  }

  // Fetch existing entry (may not exist yet)
  const { data: existing } = await supabaseAdmin
    .from('entries')
    .select('*')
    .ilike('name', name)
    .maybeSingle()

  // No-repeat validation within phase
  const isGroupRound = roundNum <= 3
  const phaseRounds = isGroupRound ? [1, 2, 3] : [4, 5, 6, 7, 8]
  if (existing) {
    for (const r of phaseRounds.filter(r => r !== roundNum)) {
      const picked = existing[pickField(r, 'team')]
      if (picked && picked === team) {
        return NextResponse.json(
          { error: `You already picked ${team} in Round ${r} — each team can only be picked once per phase` },
          { status: 400 }
        )
      }
    }
  }

  // Joker is only valid in knockout rounds (R4-R8)
  const effectiveJoker = joker && roundNum >= 4

  // Joker validation
  if (effectiveJoker) {
    if (existing?.joker_used) {
      return NextResponse.json({ error: 'You have already used your joker' }, { status: 400 })
    }
  }

  const teamField = pickField(roundNum, 'team')
  const myGoalsField = pickField(roundNum, 'my_goals')
  const oppGoalsField = pickField(roundNum, 'opp_goals')

  let data, error

  if (!existing) {
    // First ever pick — create entry
    const insertPayload: Record<string, unknown> = {
      name: participant.name,
      [teamField]: team,
      [myGoalsField]: my_goals ?? 0,
      [oppGoalsField]: opp_goals ?? 0,
      joker_round: effectiveJoker ? roundNum : null,
      joker_used: Boolean(effectiveJoker),
      golden_goal: roundNum === 1 && golden_goal != null ? Number(golden_goal) : null,
      paid: true,
    }
    ;({ data, error } = await supabaseAdmin
      .from('entries')
      .insert(insertPayload)
      .select()
      .single())
  } else {
    // Update existing entry for this round
    const updatePayload: Record<string, unknown> = {
      [teamField]: team,
      [myGoalsField]: my_goals ?? 0,
      [oppGoalsField]: opp_goals ?? 0,
    }
    // Apply joker (only if not already used, and not trying to override an existing joker on this round)
    if (effectiveJoker && !existing.joker_used) {
      updatePayload.joker_round = roundNum
      updatePayload.joker_used = true
    } else if (!effectiveJoker && existing.joker_round === roundNum && !isRoundLocked(deadlines, roundNum)) {
      // User un-declared joker before deadline — allow it
      updatePayload.joker_round = null
      updatePayload.joker_used = false
    }
    // Golden goal only settable on R1 first time (immutable once set)
    if (roundNum === 1 && golden_goal != null && existing.golden_goal == null) {
      updatePayload.golden_goal = Number(golden_goal)
    }
    ;({ data, error } = await supabaseAdmin
      .from('entries')
      .update(updatePayload)
      .eq('id', existing.id)
      .select()
      .single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}
