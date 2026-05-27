'use client'
import { useEffect, useState } from 'react'
import { TeamFlag } from './TeamFlag'

export type ShareData = {
  team: string
  myGoals: number
  oppGoals: number
  opponent: string | null
  roundLabel: string
  roundNum: number
  joker: boolean
}

type Props = {
  data: ShareData
  onDismiss: () => void
}

const APP_URL = 'wc2026.frewstar.co.uk'

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function ShareCard({ data, onDismiss }: Props) {
  const [phase, setPhase] = useState<'celebrate' | 'card'>('celebrate')

  useEffect(() => {
    const id = setTimeout(() => setPhase('card'), 1800)
    return () => clearTimeout(id)
  }, [])

  const waMessage = [
    `⚽ I've picked ${data.team} in ${data.roundLabel} of Juggs WC26!`,
    data.opponent
      ? `Predicting: ${data.team} ${data.myGoals}–${data.oppGoals} ${data.opponent}`
      : `My prediction: ${data.myGoals}–${data.oppGoals}`,
    data.joker ? '🃏 Joker played — points doubled!' : '',
    `Think you can do better?`,
    `👉 ${APP_URL}`,
  ].filter(Boolean).join('\n')

  const waUrl = `https://wa.me/?text=${encodeURIComponent(waMessage)}`

  // ── Celebration phase ─────────────────────────────────────────────────────
  if (phase === 'celebrate') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-pitch-dark/95">
        <div className="text-center animate-celebrate-enter">
          <div className="text-7xl mb-4 animate-bounce">⚽</div>
          <p className="font-display font-bold text-4xl text-white mb-4">Pick Saved!</p>
          <div className="flex items-center justify-center gap-3">
            <TeamFlag team={data.team} size={40} />
            <span className="font-display font-bold text-2xl text-pitch-light">{data.team}</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Share card phase ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm animate-slide-up">

        {/* The shareable card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-pitch/40 mb-3">
          {/* Card header */}
          <div className="bg-pitch-gradient px-5 py-3 flex items-center gap-2">
            <span className="text-base">⚽</span>
            <span className="font-display font-bold text-white tracking-wider text-sm">JUGGS WC26</span>
          </div>
          {/* Card body */}
          <div className="bg-[#06091a] px-5 py-5 text-center">
            <p className="text-[11px] text-ink-faint uppercase tracking-widest mb-3">
              {data.roundLabel}
            </p>
            <p className="text-lg font-bold text-ink mb-2">I&apos;ve backed</p>
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <TeamFlag team={data.team} size={38} />
              <span className="font-display font-bold text-2xl text-white">{data.team}</span>
            </div>
            {data.opponent && (
              <p className="text-sm text-ink-muted">
                Predicted:{' '}
                <span className="text-ink font-semibold tabular-nums">
                  {data.myGoals}–{data.oppGoals}
                </span>{' '}
                vs {data.opponent}
              </p>
            )}
            {data.joker && (
              <p className="text-xs text-amber-400 font-semibold mt-2">
                🃏 Joker played — points doubled!
              </p>
            )}
          </div>
          {/* Card footer */}
          <div className="bg-[#06091a] px-5 py-2.5 border-t border-white/[0.06] text-center">
            <p className="text-[10px] text-ink-faint tracking-wide">{APP_URL}</p>
          </div>
        </div>

        {/* Buttons */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-semibold text-sm mb-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#25D366]/20"
        >
          <WhatsAppIcon />
          Share to WhatsApp
        </a>
        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-2xl text-sm text-ink-muted hover:text-ink transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
