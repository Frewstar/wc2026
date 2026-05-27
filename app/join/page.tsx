'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui'
import { IconExternalLink } from '@/components/icons'
import { TeamFlag } from '@/components/TeamFlag'

type JoinSettings = {
  whatsapp_group_url?: string | null
  whatsapp_invite_text?: string | null
  entries_open?: boolean
  round_deadlines?: string | null
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function JoinPage() {
  const [settings, setSettings] = useState<JoinSettings>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { setSettings(d.settings ?? {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const waUrl = settings.whatsapp_group_url
  const inviteText = settings.whatsapp_invite_text || 'Ask in the WhatsApp group to get added and make your payment — then you\'re in.'

  return (
    <div className="space-y-5">
      <PageHeader title="Join the competition" subtitle="Juggs World Cup 2026" />

      <div className="glass-card overflow-hidden">
        <div className="bg-pitch-gradient px-5 py-4">
          <div className="flex items-center gap-3">
            <TeamFlag team="Scotland" size={32} />
            <div>
              <p className="font-display font-bold text-white text-base">Juggs WC 2026 Predictor</p>
              <p className="text-white/70 text-xs">Private competition · 8 rounds · Golden Goal tiebreaker</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-ink-muted leading-relaxed">
            Pick a team and predict the score for each round — group stage through to the Final. Points stack up and the leaderboard updates in real time.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-pitch-muted/40 py-3 px-1">
              <p className="font-display font-bold text-pitch-light text-lg">8</p>
              <p className="text-[10px] text-ink-muted mt-0.5 uppercase tracking-wide">Rounds</p>
            </div>
            <div className="rounded-xl bg-pitch-muted/40 py-3 px-1">
              <p className="font-display font-bold text-pitch-light text-lg">24</p>
              <p className="text-[10px] text-ink-muted mt-0.5 uppercase tracking-wide">Max pts</p>
            </div>
            <div className="rounded-xl bg-pitch-muted/40 py-3 px-1">
              <p className="font-display font-bold text-pitch-light text-lg">48</p>
              <p className="text-[10px] text-ink-muted mt-0.5 uppercase tracking-wide">Teams</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <p className="section-label">How to join</p>
        <ol className="space-y-4">
          <li className="flex gap-3">
            <span className="text-pitch-light font-display font-bold text-xs mt-0.5 shrink-0 w-4">1</span>
            <div>
              <p className="font-semibold text-ink text-sm">Join the WhatsApp group</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">Tap the button below to join. Introduce yourself and confirm you want in.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-pitch-light font-display font-bold text-xs mt-0.5 shrink-0 w-4">2</span>
            <div>
              <p className="font-semibold text-ink text-sm">Make payment</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{inviteText}</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-pitch-light font-display font-bold text-xs mt-0.5 shrink-0 w-4">3</span>
            <div>
              <p className="font-semibold text-ink text-sm">Submit your picks</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">Once confirmed, come back here and enter your name to submit your predictions before Round 1 kicks off.</p>
            </div>
          </li>
        </ol>
      </div>

      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-[#25D366] text-white font-semibold text-base hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#25D366]/20"
        >
          <WhatsAppIcon />
          Join the WhatsApp group
          <IconExternalLink className="w-4 h-4 opacity-80" />
        </a>
      ) : !loading ? (
        <div className="glass-card p-5 text-center">
          <p className="text-sm text-ink-muted">WhatsApp group link not set yet.</p>
          <p className="text-xs text-ink-faint mt-1">Admin → Settings → WhatsApp group link</p>
        </div>
      ) : null}

      <div className="glass-card p-5 space-y-3">
        <p className="section-label">Scoring</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-pitch-muted py-3">
            <p className="font-display font-bold text-pitch-light text-xl">3</p>
            <p className="text-[10px] text-ink-muted mt-1 uppercase tracking-wide">Exact score</p>
          </div>
          <div className="rounded-xl bg-sky-500/10 py-3">
            <p className="font-display font-bold text-sky-400 text-xl">1</p>
            <p className="text-[10px] text-ink-muted mt-1 uppercase tracking-wide">Correct win</p>
          </div>
          <div className="rounded-xl bg-surface border border-theme py-3">
            <p className="font-display font-bold text-ink-faint text-xl">0</p>
            <p className="text-[10px] text-ink-muted mt-1 uppercase tracking-wide">Draw or loss</p>
          </div>
        </div>
        <p className="text-xs text-ink-faint text-center">Tiebreaker: Golden Goal prediction + most exact scores</p>
      </div>

      <div className="flex gap-3">
        <Link href="/" className="btn-secondary flex-1 text-center text-sm py-2.5">
          Home
        </Link>
        <Link href="/leaderboard" className="btn-secondary flex-1 text-center text-sm py-2.5">
          Leaderboard
        </Link>
      </div>
    </div>
  )
}
