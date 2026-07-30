export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-coal-100 ${className}`}
      aria-hidden
    />
  )
}

export function FullSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-coal-400">
      <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-black/10 border-t-ember-500" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  )
}
