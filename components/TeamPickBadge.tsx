import { TeamFlag } from './TeamFlag'

const STATUS_CLASS: Record<string, string> = {
  correct: 'status-correct',
  win: 'status-win',
  draw: 'status-draw',
  lost: 'status-lost',
  pending: 'status-pending',
  no_pick: 'status-pending',
}

export function TeamPickBadge({ team, status }: { team: string; status: string }) {
  return (
    <span className={`${STATUS_CLASS[status] ?? 'status-pending'} inline-flex items-center gap-1 max-w-[72px]`}>
      <TeamFlag team={team} size={14} className="shrink-0" />
      <span className="truncate">{team}</span>
    </span>
  )
}
