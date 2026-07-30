'use client'

import Modal from './Modal'
import Spinner from './Spinner'

interface ConfirmProps {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function Confirm({
  open,
  title = 'Confirmar',
  message,
  confirmLabel = 'Confirmar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button className="btn-ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner /> : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-coal-100/80">{message}</p>
    </Modal>
  )
}
