import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from './supabase'

/**
 * Validates the Bearer token in the Authorization header against the
 * admin password stored in the settings table.
 *
 * Returns { ok: true } when authorised.
 * Returns a 401 NextResponse when not — callers should return this immediately:
 *
 *   const auth = await requireAdmin(req)
 *   if (!('ok' in auth)) return auth
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ ok: true } | NextResponse> {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('admin_pass')
    .single()

  if (!settings?.admin_pass || token !== settings.admin_pass) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { ok: true }
}
