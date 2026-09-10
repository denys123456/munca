import { memo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export const FocusCard = memo(function FocusCard({ children, className = '', label }) {
  const source = useRef(null)
  const overlay = useRef(null)
  const timer = useRef(null)
  const closeTimer = useRef(null)
  const active = useRef(false)
  const animation = useRef(null)
  const [bounds, setBounds] = useState(null)
  const [closing, setClosing] = useState(false)

  function cancelPending() {
    window.clearTimeout(timer.current)
    timer.current = null
  }

  function close() {
    cancelPending()
    if (!active.current || closing) return
    active.current = false
    setClosing(true)
    animation.current?.reverse()
    closeTimer.current = window.setTimeout(() => {
      setBounds(null)
      setClosing(false)
    }, 220)
  }

  function schedule(event) {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (active.current || closing || document.querySelector('[data-focus-layer], dialog[open], .intro-sequence')) return
    cancelPending()
    timer.current = window.setTimeout(() => {
      if (!source.current?.matches(':hover')) return
      const rect = source.current.getBoundingClientRect()
      const scale = Math.min(1.65, (innerWidth - 48) / rect.width, (innerHeight - 48) / rect.height)
      if (scale < 1.1) return
      const left = Math.max(24, Math.min(rect.left - rect.width * (scale - 1) / 2, innerWidth - rect.width * scale - 24))
      const top = Math.max(24, Math.min(rect.top - rect.height * (scale - 1) / 2, innerHeight - rect.height * scale - 24))
      document.dispatchEvent(new Event('champions-focus'))
      active.current = true
      setBounds({ left, top, width: rect.width, height: rect.height, originX: rect.left - left, originY: rect.top - top, scale })
    }, 1000)
  }

  useEffect(() => {
    if (!bounds || !overlay.current) return
    animation.current = overlay.current.animate([
      { transform: `translate(${bounds.originX}px, ${bounds.originY}px) scale(1)` },
      { transform: `translate(0, 0) scale(${bounds.scale})` }
    ], { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' })
    return () => animation.current?.cancel()
  }, [bounds])

  useEffect(() => {
    const cancel = () => cancelPending()
    document.addEventListener('champions-focus', cancel)
    return () => {
      cancelPending()
      window.clearTimeout(closeTimer.current)
      document.removeEventListener('champions-focus', cancel)
    }
  }, [])

  useEffect(() => {
    if (!bounds) return
    const dismiss = () => close()
    const keyboard = (event) => { if (event.key === 'Escape') close() }
    window.addEventListener('resize', dismiss)
    window.addEventListener('blur', dismiss)
    document.addEventListener('scroll', dismiss, true)
    document.addEventListener('keydown', keyboard)
    return () => {
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('blur', dismiss)
      document.removeEventListener('scroll', dismiss, true)
      document.removeEventListener('keydown', keyboard)
    }
  }, [bounds, closing])

  return <>
    <article ref={source} className={`focus-source ${className}`} data-focusable="true" data-focused={Boolean(bounds)}
      onPointerEnter={schedule} onPointerLeave={cancelPending} onPointerDown={cancelPending}>{children}</article>
    {bounds && createPortal(<div data-focus-layer="true" className={`focus-layer ${closing ? 'is-closing' : ''}`}>
      <div className="focus-backdrop" onPointerEnter={close} onPointerDown={close} />
      <article ref={overlay} aria-label={label} className={`focused-card ${className}`} onPointerLeave={close}
        style={{ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }}>{children}</article>
    </div>, document.body)}
  </>
})
