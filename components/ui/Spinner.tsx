export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white ${className}`}
      aria-hidden
    />
  )
}

export function FullSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-coal-100/50">
      <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-ember-500/30 border-t-ember-500" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
