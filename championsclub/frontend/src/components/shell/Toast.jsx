import { useEffect } from 'react'
import { CheckCircle2, X } from 'lucide-react'

export function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onClose, 4200)
    return () => window.clearTimeout(timer)
  }, [message, onClose])
  if (!message) return null
  return <div className="toast" role="status"><CheckCircle2 /><span>{message}</span><button type="button" aria-label="Dismiss notification" onClick={onClose}><X /></button></div>
}
