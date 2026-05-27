import Link from 'next/link'
import { IconArrowLeft } from './icons'

type PageHeaderProps = {
  backHref?: string
  backLabel?: string
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ backHref = '/', backLabel = 'Home', title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <Link href={backHref} className="btn-ghost">
          <IconArrowLeft />
          {backLabel}
        </Link>
        {actions}
      </div>
      {(title || subtitle) && (
        <div>
          {title && <h2 className="page-title">{title}</h2>}
          {subtitle && <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>}
        </div>
      )}
    </div>
  )
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-8 h-8 rounded-full border-2 border-pitch/30 border-t-pitch-light animate-spin mb-4" />
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass-card p-10 text-center animate-fade-in">
      <p className="text-ink-muted text-sm">{message}</p>
    </div>
  )
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented-control">
      {options.map(opt => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={value === opt.value ? 'segmented-btn-active' : 'segmented-btn-inactive'}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    correct: 'status-correct',
    win: 'status-win',
    draw: 'status-draw',
    lost: 'status-lost',
    pending: 'status-pending',
    no_pick: 'status-pending',
  }
  return <span className={map[status] || 'status-pending'}>{status}</span>
}
