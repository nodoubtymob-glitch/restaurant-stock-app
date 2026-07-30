import { ReactNode } from 'react'

export default function EmptyState({
  icon = '📦',
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      <div className="mb-3 text-4xl opacity-80">{icon}</div>
      <p className="text-base font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-coal-100/50">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
