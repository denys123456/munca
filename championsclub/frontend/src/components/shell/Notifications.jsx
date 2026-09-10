import { useEffect, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'

export function Notifications({ data, onNavigate }) {
  const [open, setOpen] = useState(false)
  const reference = useRef(null)
  useEffect(() => {
    if (!open) return
    const dismiss = (event) => { if (!reference.current?.contains(event.target)) setOpen(false) }
    const keyboard = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', keyboard)
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', keyboard) }
  }, [open])
  return <div className="notification-container" ref={reference}>
    <button className="icon-button notification-trigger" type="button" aria-expanded={open} aria-label="Open notifications" title="Notifications" onClick={() => setOpen((value) => !value)}><Bell />{data.alerts.some((alert) => alert.isUnread) && <i />}</button>
    {open && <div className="notification-panel"><header><strong>Notifications</strong><button className="icon-button" type="button" aria-label="Close notifications" onClick={() => setOpen(false)}><X /></button></header>
      {data.alerts.map((alert) => <button key={alert.title} className={alert.isUnread ? 'is-unread' : ''} type="button" onClick={() => { data.actions.markAlertReviewed(alert.title); onNavigate(data.currentUser.role === 'ADMIN' ? 'admin-audit' : 'alerts'); setOpen(false) }}><span>{alert.group}</span><strong>{alert.title}</strong><small>{alert.message}</small></button>)}
      {data.alerts.length === 0 && <p className="search-empty">You're all caught up.</p>}
    </div>}
  </div>
}
