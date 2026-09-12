import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function Dialog({ title, children, onClose, className = '' }) {
  const reference = useRef(null)
  const headingId = useId()
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const dialog = reference.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.dispatchEvent(new Event('publication-focus'))
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    const cancel = (event) => { event.preventDefault(); closeRef.current() }
    dialog.addEventListener('cancel', cancel)
    return () => {
      dialog.removeEventListener('cancel', cancel)
      dialog.close()
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.({ preventScroll: true })
    }
  }, [])

  return createPortal(<dialog ref={reference} className={`modal-panel ${className}`} aria-labelledby={headingId}
    onClick={(event) => { if (event.target === reference.current) onClose() }}>
    <div className="dialog-body"><header className="dialog-header"><h2 id={headingId}>{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" title="Close dialog" onClick={onClose}><X /></button></header>{children}</div>
  </dialog>, document.body)
}
