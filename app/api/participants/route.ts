import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (token) {
    const { data } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('token', token)
      .maybeSingle()
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ participant: data })
  }
  const { data } = await supabaseAdmin
    .from('participants')
    .select('*')
    .order('created_at')
  return NextResponse.json({ participants: data || [] })
}

export async function POST(req: NextRequest) {
  const { name, email } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  // Check for existing registration by email or name
  const { data: byEmail } = await supabaseAdmin
    .from('participants')
    .select('id, name, email')
    .ilike('email', email.trim())
    .maybeSingle()
  if (byEmail) return NextResponse.json({ error: 'already_registered' }, { status: 409 })

  const { data: byName } = await supabaseAdmin
    .from('participants')
    .select('id, name, email')
    .ilike('name', name.trim())
    .maybeSingle()
  if (byName) return NextResponse.json({ error: 'already_registered' }, { status: 409 })

  const token = crypto.randomUUID()
  const { data, error } = await supabaseAdmin
    .from('participants')
    .insert({ name: name.trim(), email: email.trim().toLowerCase(), token, status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ participant: data })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  await supabaseAdmin.from('participants').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
