import { ReactNode } from 'react'

export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight md:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm font-medium text-coal-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
