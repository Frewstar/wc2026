import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { data } = await supabaseAdmin.from('settings').select('*').single()
  if (!data) return NextResponse.json({ settings: null })
  // Never expose the admin password in public responses
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { admin_pass, ...safe } = data as Record<string, unknown>
  return NextResponse.json({ settings: safe })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  const body = await req.json()
  // Prevent clients from clearing or changing admin_pass via this endpoint
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { admin_pass, ...safe } = body as Record<string, unknown>
  const { data, error } = await supabaseAdmin
    .from('settings')
    .update(safe)
    .eq('id', 1)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Return without exposing admin_pass
  const { admin_pass: _pw, ...safeResult } = (data as Record<string, unknown>)
  return NextResponse.json({ settings: safeResult })
}
