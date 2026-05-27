import Image from 'next/image'
import { getTeamFlagUrl } from '@/lib/team-flags'

type TeamFlagProps = {
  team: string
  size?: number
  className?: string
}

export function TeamFlag({ team, size = 20, className = '' }: TeamFlagProps) {
  const url = getTeamFlagUrl(team, 40)
  if (!url) return null

  const height = Math.round(size * 0.72)

  return (
    <Image
      src={url}
      alt=""
      width={size}
      height={height}
      className={`rounded-[3px] object-cover shrink-0 ring-1 ring-black/10 ${className}`}
      unoptimized
    />
  )
}

type TeamLabelProps = {
  team: string
  flagSize?: number
  className?: string
  compact?: boolean
}

export function TeamLabel({ team, flagSize = 18, className = '', compact = false }: TeamLabelProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
      <TeamFlag team={team} size={flagSize} />
      {!compact && <span className="truncate">{team}</span>}
    </span>
  )
}

type TeamMatchupProps = {
  team: string
  opponent?: string | null
  className?: string
}

export function TeamMatchup({ team, opponent, className = '' }: TeamMatchupProps) {
  if (!opponent) {
    return <TeamLabel team={team} flagSize={20} className={className} />
  }
  return (
    <span className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
      <TeamLabel team={team} flagSize={18} />
      <span className="text-ink-faint text-xs font-medium">vs</span>
      <TeamLabel team={opponent} flagSize={18} />
    </span>
  )
}
