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
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-black/10 bg-coal-900 px-6 py-14 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <p className="font-display text-lg font-bold">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm font-medium text-coal-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
