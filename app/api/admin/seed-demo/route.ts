import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * Five ghost players with pre-filled group stage picks (R1–R3).
 * All use @demo.wc2026 emails so clear-demo can wipe them cleanly.
 * One extra "You (Demo)" entry is created for the tester to use.
 */
const DEMO_GHOSTS = [
  {
    name: 'Callum (Demo)',
    email: 'callum@demo.wc2026',
    picks: {
      round1_team: 'England',   round1_my_goals: 2, round1_opp_goals: 0,
      round2_team: 'England',   round2_my_goals: 3, round2_opp_goals: 1,
      round3_team: 'England',   round3_my_goals: 1, round3_opp_goals: 0,
      golden_goal: 148,
    },
  },
  {
    name: 'Stevie (Demo)',
    email: 'stevie@demo.wc2026',
    picks: {
      round1_team: 'France',    round1_my_goals: 2, round1_opp_goals: 1,
      round2_team: 'France',    round2_my_goals: 1, round2_opp_goals: 0,
      round3_team: 'France',    round3_my_goals: 2, round3_opp_goals: 0,
      golden_goal: 155,
    },
  },
  {
    name: 'Robbo (Demo)',
    email: 'robbo@demo.wc2026',
    picks: {
      round1_team: 'Brazil',    round1_my_goals: 3, round1_opp_goals: 0,
      round2_team: 'Brazil',    round2_my_goals: 2, round2_opp_goals: 1,
      round3_team: 'Brazil',    round3_my_goals: 2, round3_opp_goals: 2,
      golden_goal: 162,
    },
  },
  {
    name: 'Deano (Demo)',
    email: 'deano@demo.wc2026',
    picks: {
      round1_team: 'Germany',   round1_my_goals: 4, round1_opp_goals: 0,
      round2_team: 'Germany',   round2_my_goals: 2, round2_opp_goals: 0,
      round3_team: 'Germany',   round3_my_goals: 1, round3_opp_goals: 1,
      golden_goal: 170,
    },
  },
  {
    name: 'Graeme (Demo)',
    email: 'graeme@demo.wc2026',
    picks: {
      round1_team: 'Spain',     round1_my_goals: 2, round1_opp_goals: 0,
      round2_team: 'Spain',     round2_my_goals: 1, round2_opp_goals: 0,
      round3_team: 'Spain',     round3_my_goals: 2, round3_opp_goals: 1,
      golden_goal: 144,
    },
  },
]

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  const created: string[] = []
  const skipped: string[] = []

  // ── Ghost players ───────────────────────────────────────────────────────────
  for (const ghost of DEMO_GHOSTS) {
    // Skip if already exists
    const { data: existing } = await supabaseAdmin
      .from('participants')
      .select('id')
      .ilike('email', ghost.email)
      .maybeSingle()

    if (existing) { skipped.push(ghost.name); continue }

    const token = crypto.randomUUID()
    const now = new Date().toISOString()

    const { error: pErr } = await supabaseAdmin.from('participants').insert({
      name: ghost.name,
      email: ghost.email,
      token,
      status: 'paid',
      paid_at: now,
    })
    if (pErr) { skipped.push(`${ghost.name} (participant err: ${pErr.message})`); continue }

    const { error: eErr } = await supabaseAdmin.from('entries').insert({
      name: ghost.name,
      paid: true,
      ...ghost.picks,
    })
    if (eErr) { skipped.push(`${ghost.name} (entry err: ${eErr.message})`); continue }

    created.push(ghost.name)
  }

  // ── Tester player (the person running the test) ─────────────────────────────
  let testerToken: string | null = null
  const testerEmail = 'you@demo.wc2026'
  const testerName = 'You (Demo)'

  const { data: existingTester } = await supabaseAdmin
    .from('participants')
    .select('token')
    .ilike('email', testerEmail)
    .maybeSingle()

  if (existingTester) {
    testerToken = existingTester.token
    skipped.push(testerName)
  } else {
    testerToken = crypto.randomUUID()
    const { error: tErr } = await supabaseAdmin.from('participants').insert({
      name: testerName,
      email: testerEmail,
      token: testerToken,
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    if (tErr) {
      testerToken = null
      skipped.push(`${testerName} (err: ${tErr.message})`)
    } else {
      created.push(testerName)
    }
  }

  // ── Set current round to 1 if not already set ───────────────────────────────
  await supabaseAdmin
    .from('settings')
    .update({ current_round: 1 })
    .eq('id', 1)
    .is('current_round', null)

  return NextResponse.json({
    created,
    skipped: skipped.length > 0 ? skipped : undefined,
    tester_pick_url: testerToken
      ? `/pick/${testerToken}`
      : null,
  })
}
