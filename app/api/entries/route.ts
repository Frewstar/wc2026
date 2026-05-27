import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { entryPickPayload } from '@/lib/scoring'
import { parseDeadlines, isRoundLocked } from '@/lib/round-deadlines'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')

  if (name) {
    // Individual lookup — always returns full data (player viewing their own picks)
    const { data } = await supabaseAdmin
      .from('entries')
      .select('*')
      .ilike('name', name)
      .maybeSingle()
    return NextResponse.json({ entry: data })
  }

  // All entries: check whether the caller is an admin
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  const { data: settings } = await supabaseAdmin.from('settings').select('*').single()

  const isAdmin = Boolean(
    token && settings?.admin_pass && token === settings.admin_pass
  )

  const { data: entries } = await supabaseAdmin
    .from('entries')
    .select('*')
    .order('created_at')

  if (isAdmin) {
    // Admin sees everything unfiltered
    return NextResponse.json({ entries: entries || [] })
  }

  // Public callers: null-out picks that haven't been revealed yet
  const ROUND_FIELDS = [1, 2, 3, 4, 5, 6, 7, 8]
  const filtered = (entries || []).map(entry => {
    const e = { ...entry } as Record<string, unknown>
    for (const r of ROUND_FIELDS) {
      const showKey = `show_picks_r${r}`
      if (!settings?.[showKey as keyof typeof settings]) {
        e[`round${r}_team`] = null
        e[`round${r}_my_goals`] = null
        e[`round${r}_opp_goals`] = null
      }
    }
    return e
  })

  return NextResponse.json({ entries: filtered })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, phase = 'group' } = body

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (phase === 'knockout') {
    return NextResponse.json({ error: 'Use PUT to add knockout picks to an existing entry' }, { status: 400 })
  }

  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('entries_open, round_deadlines')
    .single()

  // Hard deadline lock — R1 kick-off closes new entries permanently
  const deadlines = parseDeadlines(settings?.round_deadlines)
  if (isRoundLocked(deadlines, 1)) {
    return NextResponse.json({ error: 'Entries are closed — the tournament has started' }, { status: 403 })
  }

  if (!settings?.entries_open) {
    return NextResponse.json({ error: 'Group stage entries are closed' }, { status: 403 })
  }

  // Duplicate name check
  const { data: existing } = await supabaseAdmin.from('entries').select('id').ilike('name', name).maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'That name is already in the competition. Enter the same name to view and edit your picks.' }, { status: 409 })
  }

  // New entries start unpaid — admin marks payment via PATCH
  const payload = {
    name,
    ...entryPickPayload(body),
    golden_goal: body.golden_goal ?? null,
    paid: false,
  }
  const { data, error } = await supabaseAdmin.from('entries').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { name, phase = 'group' } = body

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('entries_open, knockout_entries_open, round_deadlines')
    .single()

  const deadlines = parseDeadlines(settings?.round_deadlines)

  if (phase === 'group') {
    if (isRoundLocked(deadlines, 1)) {
      return NextResponse.json({ error: 'Group picks are locked — the tournament has started' }, { status: 403 })
    }
    if (!settings?.entries_open) {
      return NextResponse.json({ error: 'Group stage entries are closed' }, { status: 403 })
    }
  }

  if (phase === 'knockout') {
    if (!settings?.knockout_entries_open) {
      return NextResponse.json({ error: 'Knockout entries are closed' }, { status: 403 })
    }
  }

  const { data: existing } = await supabaseAdmin.from('entries').select('*').ilike('name', name).single()
  if (!existing) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  const pickPayload = entryPickPayload(body)
  const goldenGoalPatch = phase === 'group' && body.golden_goal != null
    ? { golden_goal: body.golden_goal }
    : {}

  const updatePayload = phase === 'knockout'
    ? { ...existing, ...pickPayload, name: existing.name }
    : { ...pickPayload, ...goldenGoalPatch, name: existing.name }

  const { data, error } = await supabaseAdmin
    .from('entries')
    .update(updatePayload)
    .eq('id', existing.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}

/** PATCH: toggle paid status — admin only */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  const { id, paid } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('entries')
    .update({ paid: Boolean(paid) })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}

/** DELETE: remove an entry — admin only */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  await supabaseAdmin.from('entries').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
