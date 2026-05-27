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
        <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 py-3 px-2 text-center">
          <p className="font-display text-xl font-bold text-amber-400">×2</p>
          <p className="text-[10px] text-ink-muted mt-1 uppercase tracking-wide">Joker round</p>
        </div>
      </div>

      {/* Joker section */}
      <div className="glass-card p-5 border border-amber-500/30">
        <p className="section-label mb-3">🃏 The Joker</p>
        <p className="text-sm text-ink-muted mb-4 leading-relaxed">
          Every player gets one Joker to play across the knockout rounds (Last 32 through to the Final).
        </p>
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className="text-amber-400 shrink-0 mt-0.5">⚡</span>
            <div>
              <p className="text-sm font-semibold text-ink">Points doubled</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Your earned points for that round are multiplied by 2. Correct score = 6 pts, correct winner = 2 pts, wrong pick = 0 pts.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-amber-400 shrink-0 mt-0.5">🔒</span>
            <div>
              <p className="text-sm font-semibold text-ink">Knockout rounds only</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                The Joker can only be used in Rounds 4–8 (Last 32, Last 16, Quarter-finals, Semi-finals, Final). It cannot be played in the group stage.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-amber-400 shrink-0 mt-0.5">👤</span>
            <div>
              <p className="text-sm font-semibold text-ink">Admin assigns it</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                The admin decides which round each player&apos;s Joker is used. You&apos;ll receive an email notification when your Joker is activated — check your personal picks page to see it.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-amber-400 shrink-0 mt-0.5">1️⃣</span>
            <div>
              <p className="text-sm font-semibold text-ink">One use only</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Each player gets exactly one Joker for the whole competition. Once it&apos;s played it&apos;s gone.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <p className="text-xs text-amber-300 font-semibold mb-1">Example</p>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Your Joker is on the Quarter-final. You pick Argentina to beat France 2–1 and the score is 2–1 — you earn 3 × 2 = <strong className="text-amber-300">6 points</strong>.
            If Argentina win but the score is different, you earn 1 × 2 = <strong className="text-amber-300">2 points</strong>.
          </p>
        </div>
      </div>

      {/* Golden Goal section */}
      <div className="glass-card p-5 border border-gold/20">
        <p className="section-label mb-3">⚽ Golden Goal — declaring the winner</p>
        <p className="text-sm text-ink-muted mb-4 leading-relaxed">
          If two or more players finish the tournament level on points, the Golden Goal decides the winner.
        </p>
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className="text-gold shrink-0 mt-0.5">📝</span>
            <div>
              <p className="text-sm font-semibold text-ink">Predict total tournament goals</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Before Round 1 kicks off, predict how many goals will be scored across all matches in the entire 2026 World Cup (104 matches in total).
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-gold shrink-0 mt-0.5">🔒</span>
            <div>
              <p className="text-sm font-semibold text-ink">Locked in at Round 1</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Your Golden Goal prediction is set when you submit your Round 1 pick and cannot be changed — so think carefully!
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-gold shrink-0 mt-0.5">🏆</span>
            <div>
              <p className="text-sm font-semibold text-ink">Closest wins the tie</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                If players are tied on points at the end, whoever predicted closest to the actual total goals wins. If predictions are identical, the earliest entry wins.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white/[0.03] border border-theme rounded-xl p-3">
          <p className="text-xs text-ink-faint font-semibold mb-1">For reference</p>
          <p className="text-xs text-ink-faint leading-relaxed">
            The 2022 World Cup (64 matches) produced 172 goals. The 2026 tournament has 104 matches — expect somewhere in the region of 250–300 goals.
          </p>
        </div>
      </div>

      <div className="glass-card p-5 border border-amber-500/10">
        <p className="section-label mb-4">Tiebreaker order</p>
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
