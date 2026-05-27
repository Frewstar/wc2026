import { TeamFlag } from './TeamFlag'
import { IconCheck } from './icons'

type KnockoutTeamPickerProps = {
  teams: string[]
  selectedTeam: string
  usedTeams: string[]
  onSelect: (team: string) => void
}

export function KnockoutTeamPicker({ teams, selectedTeam, usedTeams, onSelect }: KnockoutTeamPickerProps) {
  if (teams.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-ink-muted">
        No fixtures added for this round yet — check back soon
      </div>
    )
  }

  return (
    <div className="divide-y divide-theme">
      {teams.map(team => {
        const isUsed = usedTeams.includes(team)
        const isSelected = selectedTeam === team
        return (
          <div
            key={team}
            onClick={() => !isUsed && onSelect(team)}
            className={`px-4 py-3 text-sm flex items-center justify-between cursor-pointer transition-all duration-150
              ${isSelected ? 'bg-pitch-muted text-pitch-light font-semibold' : ''}
              ${isUsed ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'}
            `}
          >
            <span className={`inline-flex items-center gap-2.5 min-w-0 ${isUsed ? 'line-through' : ''}`}>
              <TeamFlag team={team} size={22} />
              <span className="truncate">{team}</span>
            </span>
            {isSelected && <IconCheck className="w-4 h-4 text-pitch-light shrink-0" />}
            {isUsed && !isSelected && (
              <span className="text-xs text-ink-faint shrink-0">picked</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
