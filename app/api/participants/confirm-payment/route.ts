import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

function buildEmailHtml(name: string, link: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're in!</title>
</head>
<body style="margin:0;padding:0;background:#06091a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06091a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#001233 0%,#00205b 50%,#003087 100%);border-radius:16px 16px 0 0;padding:32px 32px 24px;text-align:center;">
              <p style="margin:0 0 8px;font-size:28px;">⚽</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                You're in!
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">
                Juggs World Cup 2026 Prediction
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
                Your payment is confirmed — you're officially in the competition! 🎉
                Use the button below to access your personal picks dashboard.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${link}"
                       style="display:inline-block;background:linear-gradient(135deg,#00205b,#003087);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.2px;">
                      Go to My Picks →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(0,48,135,0.15);border:1px solid rgba(0,48,135,0.3);border-radius:10px;padding:14px 16px;">
                    <p style="margin:0 0 8px;color:#93c5fd;font-size:13px;font-weight:600;">📌 Important</p>
                    <p style="margin:0 0 6px;color:#94a3b8;font-size:13px;line-height:1.5;">
                      Bookmark this link — it's your personal access to the competition every round.
                    </p>
                    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">
                      <strong style="color:#e2e8f0;">Round 1 kicks off 11 June.</strong>
                      We'll send you a reminder when it's time to make your picks.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Link fallback -->
              <p style="margin:24px 0 0;color:#64748b;font-size:12px;word-break:break-all;">
                Can't click the button? Copy this link:<br />
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
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Fetch participant
  const { data: participant, error: fetchErr } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchErr || !participant) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const link = `${appUrl}/pick/${participant.token}`

  // Update status + paid_at
  const now = new Date().toISOString()
  const { error: updateErr } = await supabaseAdmin
    .from('participants')
    .update({ status: 'paid', paid_at: now })
    .eq('id', id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Send email via Resend
  const { error: emailErr } = await resend.emails.send({
    from: 'WC2026 <picks@frewstar.co.uk>',
    to: participant.email,
    subject: "⚽ You're in! Your Juggs World Cup 2026 link",
    html: buildEmailHtml(participant.name, link),
  })

  if (emailErr) {
    console.error('Resend error:', emailErr)
    return NextResponse.json({ error: 'Payment confirmed but email failed: ' + emailErr.message }, { status: 500 })
  }

  // Update link_sent_at
  await supabaseAdmin
    .from('participants')
    .update({ link_sent_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ success: true, link })
}
