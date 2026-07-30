'use client'

import { ReactNode, useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg animate-pop">
        <div className="card m-2 max-h-[92vh] overflow-hidden rounded-3xl sm:m-4">
          {title && (
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <h3 className="text-lg font-bold">{title}</h3>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-coal-100/60 hover:bg-white/10 hover:text-coal-100"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
          )}
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="flex justify-end gap-2 border-t border-white/5 px-5 py-4 safe-bottom">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
