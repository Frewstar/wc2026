import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin.from('settings').select('*').single()
  return NextResponse.json({ settings: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('settings')
    .update(body)
    .eq('id', 1)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data })
}
