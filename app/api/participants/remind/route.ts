import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'
import { ROUNDS, pickField } from '@/lib/rounds'
import { parseDeadlines } from '@/lib/round-deadlines'
import { formatUKKickoff } from '@/lib/uk-time'

const resend = new Resend(process.env.RESEND_API_KEY)

function buildReminderHtml(name: string, link: string, roundLabel: string, deadline: string | null): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#06091a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06091a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#001233 0%,#00205b 50%,#003087 100%);border-radius:16px 16px 0 0;padding:32px 32px 24px;text-align:center;">
              <p style="margin:0 0 8px;font-size:28px;">⏰</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                Time to make your pick!
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">
                ${roundLabel} is now open
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-top:none;border-radius:0 0 16px 16px;padding:32px;">
              <p style="margin:0 0 16px;color:#e2e8f0;font-size:15px;line-height:1.6;">
                Hi <strong style="color:#ffffff;">${name}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                ${roundLabel} picks are now open. Head to your picks page to choose your team and call the score before the deadline!
              </p>

              ${deadline ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:12px 16px;">
                    <p style="margin:0;color:#fbbf24;font-size:13px;font-weight:600;">
                      ⏱ Deadline: ${deadline}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${link}"
                       style="display:inline-block;background:linear-gradient(135deg,#00205b,#003087);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.2px;">
                      Make My Pick →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#64748b;font-size:12px;word-break:break-all;">
                Or copy this link:<br />
                <a href="${link}" style="color:#93c5fd;text-decoration:none;">${link}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;color:#334155;font-size:12px;">
                Juggs World Cup 2026 · Powered by <span style="color:#475569;font-weight:600;">Frewstar</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const { round } = await req.json()
  if (!round) return NextResponse.json({ error: 'round required' }, { status: 400 })

  const roundDef = ROUNDS.find(r => r.num === Number(round))
  if (!roundDef) return NextResponse.json({ error: 'Invalid round' }, { status: 400 })

  // Fetch all paid participants
  const { data: participants } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('status', 'paid')
  if (!participants?.length) return NextResponse.json({ sent: 0, skipped: 0 })

  // Fetch entries to check who has picked for this round
  const { data: entries } = await supabaseAdmin.from('entries').select('*')
  const teamField = pickField(roundDef.num, 'team')
  const pickedNames = new Set(
    (entries || [])
      .filter(e => e[teamField] != null)
      .map(e => e.name.toLowerCase())
  )

  // Fetch settings for deadline
  const { data: settings } = await supabaseAdmin.from('settings').select('round_deadlines').single()
  const deadlines = parseDeadlines(settings?.round_deadlines)
  const deadlineIso = deadlines[String(round)]
  const deadlineStr = deadlineIso ? formatUKKickoff(deadlineIso) : null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const needsReminder = participants.filter(
    p => !pickedNames.has(p.name.toLowerCase())
  )

  if (needsReminder.length === 0) {
    return NextResponse.json({ sent: 0, skipped: participants.length, message: 'Everyone has already picked!' })
  }

  const results = await Promise.allSettled(
    needsReminder.map(p =>
      resend.emails.send({
        from: 'WC2026 <picks@frewstar.co.uk>',
        to: p.email,
        subject: `⏰ ${roundDef.label} is open — make your pick!`,
        html: buildReminderHtml(
          p.name,
          `${appUrl}/pick/${p.token}`,
          roundDef.label,
          deadlineStr
        ),
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({
    sent,
    failed,
    skipped: participants.length - needsReminder.length,
  })
}
