import Link from 'next/link'
import { PageHeader } from '@/components/ui'
import { SCORING_RULES, GAME_RULES, TIEBREAKER_RULES, MAX_POINTS } from '@/lib/rules'

const POINTS_STYLE: Record<string, string> = {
  correct: 'text-pitch-light border-pitch/30 bg-pitch-muted',
  win: 'text-sky-400 border-sky-500/20 bg-sky-500/10',
  draw: 'text-ink-muted border-theme bg-surface',
  lost: 'text-red-400 border-red-500/20 bg-red-500/10',
}

export default function RulesPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Rules" subtitle="How scoring works" />

      <div className="glass-card p-5">
        <p className="section-label mb-4">Scoring</p>
        <p className="text-sm text-ink-muted mb-5 leading-relaxed">
          Points from all eight rounds accumulate on the leaderboard — up to{' '}
          <strong className="text-ink font-medium">{MAX_POINTS} points</strong> if you nail every prediction.
        </p>

        <div className="space-y-3">
          {SCORING_RULES.map(rule => (
            <div
              key={rule.title}
              className={`rounded-xl border p-4 ${POINTS_STYLE[rule.highlight]}`}
            >
              <div className="flex items-start gap-3">
                <span className="font-display text-2xl font-bold shrink-0 w-10 text-right">
                  {rule.points}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink text-sm">{rule.title}</p>
                  <p className="text-sm text-ink-muted mt-1 leading-relaxed">{rule.description}</p>
                  <p className="text-xs text-ink-faint mt-2 italic">{rule.example}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <p className="section-label mb-4">How to play</p>
        <ul className="space-y-4">
          {GAME_RULES.map(rule => (
            <li key={rule.step} className="flex gap-3">
              <span className="text-pitch-light font-display font-bold text-xs mt-0.5 shrink-0">{rule.step}</span>
              <div>
                <p className="font-semibold text-ink text-sm">{rule.title}</p>
                <p className="text-sm text-ink-muted mt-0.5 leading-relaxed">{rule.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-card p-5 border border-pitch/20">
        <p className="section-label mb-2">Quick reference</p>
        <div className="grid grid-cols-3 gap-2 text-center text-sm mt-3">
          <div className="rounded-lg bg-pitch-muted py-3 px-2">
            <p className="font-display text-xl font-bold text-pitch-light">3</p>
            <p className="text-[10px] text-ink-muted mt-1 uppercase tracking-wide">Exact score</p>
          </div>
          <div className="rounded-lg bg-sky-500/10 py-3 px-2">
            <p className="font-display text-xl font-bold text-sky-400">1</p>
            <p className="text-[10px] text-ink-muted mt-1 uppercase tracking-wide">Correct win</p>
          </div>
          <div className="rounded-lg bg-surface py-3 px-2 border border-theme">
            <p className="font-display text-xl font-bold text-ink-faint">0</p>
            <p className="text-[10px] text-ink-muted mt-1 uppercase tracking-wide">Draw or loss</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 border border-amber-500/20">
        <p className="section-label mb-4">Tiebreakers</p>
        <p className="text-sm text-ink-muted mb-4 leading-relaxed">
          If two or more players end on the same total points, these rules decide the winner — applied in order until the tie is broken.
        </p>
        <div className="space-y-3">
          {TIEBREAKER_RULES.map(rule => (
            <div key={rule.rank} className="flex gap-3">
              <span className="font-display font-bold text-amber-400/80 text-xs mt-0.5 shrink-0 w-4">{rule.rank}</span>
              <div>
                <p className="font-semibold text-ink text-sm">{rule.label}</p>
                <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{rule.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link href="/" className="btn-secondary block text-center text-sm">
        Back to home
      </Link>
    </div>
  )
}
