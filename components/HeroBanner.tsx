import { TeamFlag } from './TeamFlag'
import { APP_SHORT } from '@/lib/app-config'
import { getTeamGroup } from '@/lib/wc-groups'
import { MyPicksButton } from './MyPicksButton'

const HOST_NATIONS = ['USA', 'Mexico', 'Canada']
const FEATURED_TEAM = 'Scotland'

export function HeroBanner() {
  const scotlandGroup = getTeamGroup(FEATURED_TEAM)

  return (
    <div className="hero-banner relative overflow-hidden rounded-3xl mb-8 animate-fade-in">
      <div className="absolute inset-0 bg-pitch-gradient opacity-90" />
      <div className="absolute inset-0 bg-hero-glow" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.5) 12px, rgba(255,255,255,0.5) 13px)',
        }}
      />

      <div className="relative px-6 py-8 text-center">
        {/* Scotland — featured */}
        <div className="flex flex-col items-center mb-6 animate-slide-up">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-2xl bg-white/10 blur-xl scale-110" />
            <div className="relative w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center shadow-glow">
              <TeamFlag team={FEATURED_TEAM} size={52} className="ring-0 rounded-md" />
            </div>
          </div>
          <span className="font-display text-2xl font-bold text-white tracking-tight">Scotland</span>
          {scotlandGroup && (
            <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/80">
              Group {scotlandGroup}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mb-5">
          {HOST_NATIONS.map(nation => (
            <div
              key={nation}
              className="flex flex-col items-center gap-1.5 animate-fade-in"
            >
              <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
                <TeamFlag team={nation} size={22} className="ring-0" />
              </div>
              <span className="text-[9px] font-semibold text-white/60 uppercase tracking-wider">{nation}</span>
            </div>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[11px] font-semibold text-white/90 uppercase tracking-[0.15em]">
            FIFA World Cup 2026
          </span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
          Juggs World Cup
          <span className="block text-white/90 mt-0.5">Prediction 2026</span>
        </h1>

        <p className="text-sm text-white/75 mt-3 max-w-xs mx-auto leading-relaxed">
          Pick your team. Call the score. Top the table.
        </p>

        <div className="gold-accent-line mt-6 max-w-[140px] mx-auto opacity-60" />
      </div>
    </div>
  )
}

export function CompactHeader() {
  return (
    <header className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <MyPicksButton />
        <div className="flex-1 text-center">
          <p className="section-label mb-1">{APP_SHORT}</p>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink">
            Juggs <span className="text-gold">World Cup</span>
          </h1>
        </div>
        {/* spacer to keep title centred when button is present */}
        <div className="w-[80px]" />
      </div>
      <div className="gold-accent-line mt-3 max-w-[80px] mx-auto" />
    </header>
  )
}
