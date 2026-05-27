import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/admin/auth
 * Validates the admin password server-side without ever exposing it in a GET response.
 * Returns { ok: true } on success, 401 on failure.
 */
export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('admin_pass')
    .single()

  if (!settings?.admin_pass || password !== settings.admin_pass) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
