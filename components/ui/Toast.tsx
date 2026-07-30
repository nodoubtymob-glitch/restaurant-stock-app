'use client'

import { createContext, useCallback, useContext, useState, ReactNode } from 'react'

type ToastKind = 'success' | 'error' | 'info'
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

const ToastCtx = createContext<{
  show: (message: string, kind?: ToastKind) => void
}>({ show: () => {} })

export function useToast() {
  return useContext(ToastCtx)
}

let counter = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = counter++
    setToasts((t) => [...t, { id, kind, message }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[200] flex flex-col items-center gap-2 px-3 safe-top">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-sm animate-fade-up rounded-2xl border px-4 py-3 text-sm font-bold shadow-card ${
              t.kind === 'success'
                ? 'border-emerald-500/25 bg-emerald-50 text-emerald-700'
                : t.kind === 'error'
                ? 'border-red-500/25 bg-red-50 text-red-600'
                : 'border-black/[0.08] bg-coal-900 text-coal-100'
            }`}
          >
            {t.kind === 'success' ? '✅ ' : t.kind === 'error' ? '⚠️ ' : ''}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
