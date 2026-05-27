import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'
import { ROUNDS, pickField } from '@/lib/rounds'
import { requireAdmin } from '@/lib/admin-auth'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = 'juggswc2026@gmail.com'

/**
 * GET /api/admin/backup
 * Triggered daily by Vercel cron at 11pm.
 * Emails a CSV backup of all entries + participants to the admin.
 */
export async function GET(req: NextRequest) {
  // Allow Vercel cron (which sends CRON_SECRET) and admin Bearer token
  const cronSecret = req.headers.get('authorization')
  const isCron = cronSecret === `Bearer ${process.env.CRON_SECRET}`
  if (!isCron) {
    const auth = await requireAdmin(req)
    if (!('ok' in auth)) return auth
  }
  const timestamp = new Date().toISOString().slice(0, 10)

  const [
    { data: entries },
    { data: results },
    { data: participants },
    { data: fixtures },
  ] = await Promise.all([
    supabaseAdmin.from('entries').select('*').order('created_at'),
    supabaseAdmin.from('results').select('*'),
    supabaseAdmin.from('participants').select('*').order('created_at'),
    supabaseAdmin.from('fixtures').select('*'),
  ])

  const participantMap = new Map(
    (participants || []).map(p => [p.name.toLowerCase(), p])
  )

  // ── CSV 1: Leaderboard (entries + scores) ──────────────────────────────────
  const entryHeaders = [
    'Name', 'Email', 'Status', 'Golden Goal', 'Joker Round',
    ...ROUNDS.flatMap(r => [`${r.short} Team`, `${r.short} My Goals`, `${r.short} Opp Goals`]),
    'Entered',
  ]

  const entryRows = (entries || []).map(e => {
    const p = participantMap.get(e.name.toLowerCase())
    return [
      e.name,
      p?.email ?? '',
      p?.status ?? (e.paid ? 'paid' : 'unpaid'),
      e.golden_goal ?? '',
      e.joker_round ? `R${e.joker_round}` : '',
      ...ROUNDS.flatMap(r => [
        (e[pickField(r.num, 'team') as keyof typeof e] as string) || '',
        (e[pickField(r.num, 'my_goals') as keyof typeof e] as number) ?? '',
        (e[pickField(r.num, 'opp_goals') as keyof typeof e] as number) ?? '',
      ]),
      new Date(e.created_at).toLocaleDateString('en-GB'),
    ]
  })

  const entryCsv = [entryHeaders, ...entryRows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  // ── CSV 2: Results ─────────────────────────────────────────────────────────
  const resultHeaders = ['Round', 'Home Team', 'Home Goals', 'Away Goals', 'Away Team', 'Winner (pens)']
  const resultRows = (results || []).map(r => [
    `Round ${r.round}`,
    r.home_team,
    r.home_goals,
    r.away_goals,
    r.away_team,
    r.winner_team ?? '',
  ])
  const resultCsv = [resultHeaders, ...resultRows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  // ── CSV 3: Participants (no token — tokens are personal pick links) ─────────
  const partHeaders = ['Name', 'Email', 'Status', 'Registered', 'Paid At']
  const partRows = (participants || []).map(p => [
    p.name,
    p.email,
    p.status,
    new Date(p.created_at).toLocaleDateString('en-GB'),
    p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-GB') : '',
  ])
  const partCsv = [partHeaders, ...partRows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  // ── Send email ─────────────────────────────────────────────────────────────
  const { error } = await resend.emails.send({
    from: 'WC2026 <picks@frewstar.co.uk>',
    to: ADMIN_EMAIL,
    subject: `📊 WC2026 Daily Backup — ${timestamp}`,
    html: `
      <div style="font-family:sans-serif;background:#06091a;color:#e2e8f0;padding:24px;border-radius:12px;max-width:480px;">
        <h2 style="margin:0 0 12px;color:#fff;">📊 Daily Backup</h2>
        <p style="color:#94a3b8;margin:0 0 16px;">${timestamp} — three CSV files attached.</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Entries</td>
            <td style="padding:8px 0;color:#fff;font-size:13px;text-align:right;">${(entries || []).length}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Participants</td>
            <td style="padding:8px 0;color:#fff;font-size:13px;text-align:right;">${(participants || []).length}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Results saved</td>
            <td style="padding:8px 0;color:#fff;font-size:13px;text-align:right;">${(results || []).length}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:13px;">Fixtures</td>
            <td style="padding:8px 0;color:#fff;font-size:13px;text-align:right;">${(fixtures || []).length}</td>
          </tr>
        </table>
        <p style="color:#334155;font-size:11px;margin:16px 0 0;">Juggs World Cup 2026 · Auto-backup</p>
      </div>
    `,
    attachments: [
      {
        filename: `wc2026-entries-${timestamp}.csv`,
        content: Buffer.from(entryCsv, 'utf-8').toString('base64'),
      },
      {
        filename: `wc2026-results-${timestamp}.csv`,
        content: Buffer.from(resultCsv, 'utf-8').toString('base64'),
      },
      {
        filename: `wc2026-participants-${timestamp}.csv`,
        content: Buffer.from(partCsv, 'utf-8').toString('base64'),
      },
    ],
  })

  if (error) {
    console.error('Backup email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    entries: (entries || []).length,
    participants: (participants || []).length,
    results: (results || []).length,
    timestamp,
  })
}
