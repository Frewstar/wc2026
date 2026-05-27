import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'
import { ROUNDS } from '@/lib/rounds'
import { requireAdmin } from '@/lib/admin-auth'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * POST /api/admin/set-joker
 * Admin-only: assign or remove a joker for a participant's entry.
 *
 * Body: { entry_id, joker_round }
 *  - joker_round: 4–8 to assign, null to remove
 *
 * Rules:
 *  - Joker can only be assigned to knockout rounds (R4–R8)
 *  - If already assigned to a DIFFERENT round, must remove first
 *  - Sends an email to the participant when activated
 */

function buildJokerEmailHtml(name: string, link: string, roundLabel: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Joker is live!</title>
</head>
<body style="margin:0;padding:0;background:#06091a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06091a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#78350f 0%,#92400e 50%,#b45309 100%);border-radius:16px 16px 0 0;padding:32px 32px 24px;text-align:center;">
              <p style="margin:0 0 8px;font-size:32px;">🃏</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                Your Joker is live!
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">
                ${roundLabel} — points doubled
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
                Your <strong style="color:#fbbf24;">Joker</strong> has been activated for
                <strong style="color:#ffffff;">${roundLabel}</strong>.
                Whatever points you earn this round will be <strong style="color:#fbbf24;">doubled</strong> — make it count!
              </p>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:14px 16px;">
                    <p style="margin:0 0 6px;color:#fbbf24;font-size:13px;font-weight:600;">⚡ How it works</p>
                    <p style="margin:0 0 4px;color:#d4a853;font-size:13px;line-height:1.5;">
                      Correct winner = <strong>1 pt × 2 = 2 pts</strong>
                    </p>
                    <p style="margin:0;color:#d4a853;font-size:13px;line-height:1.5;">
                      Correct score = <strong>3 pts × 2 = 6 pts</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${link}"
                       style="display:inline-block;background:linear-gradient(135deg,#78350f,#b45309);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.2px;">
                      View My Picks →
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
  const auth = await requireAdmin(req)
  if (!('ok' in auth)) return auth

  const { entry_id, joker_round } = await req.json()

  if (!entry_id) {
    return NextResponse.json({ error: 'entry_id required' }, { status: 400 })
  }

  // Validate round if assigning
  if (joker_round != null) {
    const r = Number(joker_round)
    if (r < 4 || r > 8) {
      return NextResponse.json(
        { error: 'Joker can only be assigned to knockout rounds (R4–R8)' },
        { status: 400 }
      )
    }
  }

  // Fetch existing entry
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('entries')
    .select('*')
    .eq('id', entry_id)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  // Block assigning joker if it's already active on a DIFFERENT round
  if (joker_round != null && existing.joker_used && existing.joker_round !== Number(joker_round)) {
    const usedRound = ROUNDS.find(r => r.num === existing.joker_round)
    return NextResponse.json(
      { error: `Joker already used on ${usedRound?.label ?? `Round ${existing.joker_round}`} — remove it first` },
      { status: 400 }
    )
  }

  // Update entry
  const { data, error } = await supabaseAdmin
    .from('entries')
    .update({
      joker_round: joker_round ?? null,
      joker_used: joker_round != null,
    })
    .eq('id', entry_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send email notification when joker is newly assigned (not on removal)
  if (joker_round != null) {
    const roundDef = ROUNDS.find(r => r.num === Number(joker_round))
    const roundLabel = roundDef?.label ?? `Round ${joker_round}`

    // Look up participant by name to get email + token
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('name, email, token')
      .ilike('name', existing.name)
      .maybeSingle()

    if (participant?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const link = `${appUrl}/pick/${participant.token}`

      const { error: emailErr } = await resend.emails.send({
        from: 'WC2026 <picks@frewstar.co.uk>',
        to: participant.email,
        subject: `🃏 Your Joker is live — ${roundLabel}`,
        html: buildJokerEmailHtml(participant.name, link, roundLabel),
      })

      if (emailErr) {
        console.error('Joker email error:', emailErr)
        // Don't fail the whole request — joker is saved, email is best-effort
      }
    }
  }

  return NextResponse.json({ entry: data })
}
