import { ReactNode } from 'react'

interface StatCardProps {
  icon: string
  label: string
  value: ReactNode
  hint?: string
  tone?: 'ember' | 'green' | 'amber' | 'red' | 'neutral'
  className?: string
}

const toneMap: Record<string, string> = {
  ember: 'bg-ember-500/25 text-ember-700',
  green: 'bg-emerald-500/15 text-emerald-700',
  amber: 'bg-amber-500/15 text-amber-700',
  red: 'bg-red-500/12 text-red-600',
  neutral: 'bg-black/[0.05] text-coal-300',
}

export default function StatCard({
  icon,
  label,
  value,
  hint,
  tone = 'neutral',
  className = '',
}: StatCardProps) {
  return (
    <div className={`card card-hover animate-fade-up p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`stat-icon ${toneMap[tone]}`}>{icon}</div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-coal-400">
            {label}
          </p>
          <p className="mt-0.5 truncate font-display text-2xl font-bold tracking-tight">
            {value}
          </p>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-coal-400">{hint}</p>}
    </div>
  )
}
