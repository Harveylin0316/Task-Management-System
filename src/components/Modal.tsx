import type { ReactNode } from 'react'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  if (!open) return null
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal
      aria-labelledby="modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2 id="modal-title">{title}</h2>
        {children}
        {footer}
      </div>
    </div>
  )
}
