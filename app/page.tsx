'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IconTrophy, IconScoreboard, IconSettings, IconRules, IconCalendar, IconExternalLink } from '@/components/icons'

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

type RegistrationState = 'idle' | 'submitting' | 'success' | 'already_registered' | 'error'

export default function Home() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [regState, setRegState] = useState<RegistrationState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [waGroupUrl, setWaGroupUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings?.whatsapp_group_url) setWaGroupUrl(d.settings.whatsapp_group_url)
      })
  }, [])

  const handleRegister = async () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName || !trimmedEmail) return

    setRegState('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
      })
      const data = await res.json()

      if (res.status === 409 || data.error === 'already_registered') {
        setRegState('already_registered')
      } else if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong. Please try again.')
        setRegState('error')
      } else {
        setRegState('success')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setRegState('error')
    }
  }

  const isFormValid = name.trim().length > 0 && email.trim().includes('@')

  return (
    <div className="space-y-5">
      <div className="glass-card p-6">
        {regState === 'success' ? (
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="font-display font-bold text-xl text-ink mb-2">You&apos;re registered!</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              We&apos;ll email your personal picks link once your payment is confirmed.
              Keep an eye on your inbox — including your junk folder.
            </p>
            {waGroupUrl && (
              <a
                href={waGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 bg-[#25D366] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:brightness-110 transition"
              >
                <WhatsAppIcon />
                Join the WhatsApp group
                <IconExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => { setRegState('idle'); setName(''); setEmail('') }}
              className="mt-3 block w-full text-xs text-ink-faint hover:text-ink transition-colors"
            >
              Register another person
            </button>
          </div>
        ) : regState === 'already_registered' ? (
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-pitch-muted border border-pitch/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📧</span>
            </div>
            <h2 className="font-display font-bold text-xl text-ink mb-2">Already registered</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              You&apos;re already on the list — check your email for your personal picks link.
              If you haven&apos;t received it yet, your payment may still be pending.
            </p>
            {waGroupUrl && (
              <a
                href={waGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 bg-[#25D366] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:brightness-110 transition"
              >
                <WhatsAppIcon />
                Ask in the group
                <IconExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => { setRegState('idle') }}
              className="mt-3 block w-full text-xs text-ink-faint hover:text-ink transition-colors"
            >
              ← Back
            </button>
          </div>
        ) : (
          <>
            <p className="section-label mb-3">Register to play</p>
            <p className="text-sm text-ink-muted mb-5 leading-relaxed">
              Enter your name and email. Once your payment is confirmed, you&apos;ll receive a personal link to make your picks.
            </p>
            <div className="space-y-3 mb-3">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => { setName(e.target.value); setRegState('idle') }}
                onKeyDown={e => e.key === 'Enter' && isFormValid && handleRegister()}
                className="input-field"
                autoComplete="name"
              />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setRegState('idle') }}
                onKeyDown={e => e.key === 'Enter' && isFormValid && handleRegister()}
                className="input-field"
                autoComplete="email"
                inputMode="email"
              />
            </div>

            {regState === 'error' && errorMsg && (
              <div className="rounded-xl p-4 mb-3 bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-xs">{errorMsg}</p>
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={regState === 'submitting' || !isFormValid}
              className="btn-primary"
            >
              {regState === 'submitting' ? 'Registering…' : 'Register for the Competition'}
            </button>
          </>
        )}
      </div>

      {waGroupUrl ? (
        <a
          href={waGroupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full py-3.5 px-5 rounded-2xl bg-[#25D366] text-white font-semibold text-sm hover:brightness-110 active:scale-95 transition-all"
        >
          <WhatsAppIcon />
          <span className="flex-1">Join the WhatsApp group</span>
          <IconExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
        </a>
      ) : (
        <Link
          href="/join"
          className="flex items-center gap-3 w-full py-3.5 px-5 rounded-2xl bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 font-semibold text-sm hover:bg-[#25D366]/30 transition-colors"
        >
          <WhatsAppIcon />
          <span className="flex-1">Want to join the competition?</span>
          <IconExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0" />
        </Link>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Link href="/leaderboard" className="nav-tile group">
          <div className="nav-tile-icon group-hover:bg-pitch/25">
            <IconTrophy />
          </div>
          <div className="font-semibold text-ink text-sm">Leaderboard</div>
        </Link>
        <Link href="/scores" className="nav-tile group">
          <div className="nav-tile-icon group-hover:bg-pitch/25">
            <IconScoreboard />
          </div>
          <div className="font-semibold text-ink text-sm">Live Scores</div>
        </Link>
        <Link href="/schedule" className="nav-tile group">
          <div className="nav-tile-icon group-hover:bg-pitch/25">
            <IconCalendar />
          </div>
          <div className="font-semibold text-ink text-sm">Schedule</div>
        </Link>
        <Link href="/rules" className="nav-tile group">
          <div className="nav-tile-icon group-hover:bg-pitch/25">
            <IconRules />
          </div>
          <div className="font-semibold text-ink text-sm">Rules</div>
        </Link>
        <Link href="/join" className="nav-tile group">
          <div className="nav-tile-icon group-hover:bg-[#25D366]/20" style={{ color: '#25D366' }}>
            <WhatsAppIcon />
          </div>
          <div className="font-semibold text-ink text-sm">Join</div>
        </Link>
        <Link href="/admin" className="nav-tile group">
          <div className="nav-tile-icon group-hover:bg-pitch/25">
            <IconSettings />
          </div>
          <div className="font-semibold text-ink text-sm">Admin</div>
        </Link>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="section-label">How it works</p>
          <Link href="/rules" className="text-xs font-semibold text-pitch-light hover:text-pitch transition-colors">
            Full rules →
          </Link>
        </div>
        <ul className="text-sm text-ink-muted space-y-3">
          <li className="flex gap-3">
            <span className="text-pitch-light font-display font-bold text-xs mt-0.5">01</span>
            <span>Register with your name &amp; email — we&apos;ll send your personal picks link once payment is confirmed</span>
          </li>
          <li className="flex gap-3">
            <span className="text-pitch-light font-display font-bold text-xs mt-0.5">02</span>
            <span>Group stage (Rounds 1–3) then knockout: Last 32, Last 16, QF, SF &amp; Final</span>
          </li>
          <li className="flex gap-3">
            <span className="text-pitch-light font-display font-bold text-xs mt-0.5">03</span>
            <span>
              <strong className="text-ink font-medium">3 pts</strong> exact score &middot;{' '}
              <strong className="text-ink font-medium">1 pt</strong> correct win &middot;{' '}
              <strong className="text-ink font-medium">0 pts</strong> for a draw
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-pitch-light font-display font-bold text-xs mt-0.5">04</span>
            <span>Points accumulate through all rounds to the Final</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
