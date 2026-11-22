import { useEffect, useRef } from 'react'

export function ConfirmDialog({ title, children, confirmLabel = 'Confirmar', busy, onConfirm, onCancel }) {
  const confirmRef = useRef(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [busy, onCancel])

  return (
    <div className="dialog-backdrop" onClick={busy ? undefined : onCancel}>
      <div
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 id="dialog-title">{title}</h2>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">
          <button className="secondary-button" disabled={busy} onClick={onCancel} type="button">
            Cancelar
          </button>
          <button
            className="primary-button"
            disabled={busy}
            onClick={onConfirm}
            ref={confirmRef}
            type="button"
          >
            {busy ? 'Registrando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
