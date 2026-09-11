import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { focusGeometry } from './focusGeometry.js'

export const FocusCard = memo(function FocusCard({ children, className = '', label }) {
  const source = useRef(null)
  const overlay = useRef(null)
  const pending = useRef(null)
  const animation = useRef(null)
  const phase = useRef('idle')
  const [bounds, setBounds] = useState(null)
  const [closing, setClosing] = useState(false)

  function cancelPending() {
    clearTimeout(pending.current)
    pending.current = null
  }

  function close() {
    cancelPending()
    if (phase.current !== 'open') return
    phase.current = 'closing'
    setClosing(true)
    if (overlay.current) overlay.current.style.willChange = 'transform'
    animation.current?.reverse()
    window.setTimeout(() => {
      if (phase.current !== 'closing') return
      setBounds(null)
      setClosing(false)
      phase.current = 'idle'
    }, 220)
  }

  function schedule(event) {
    if (event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || phase.current !== 'idle') return
    if (document.querySelector('[data-focus-layer], dialog[open], .intro-sequence')) return
    cancelPending()
    pending.current = setTimeout(() => {
      if (!source.current?.matches(':hover') || document.querySelector('dialog[open], [data-focus-layer]')) return
      const geometry = focusGeometry(source.current.getBoundingClientRect(), innerWidth, innerHeight)
      if (!geometry) return
      document.dispatchEvent(new Event('champions-focus'))
      phase.current = 'open'
      setBounds(geometry)
    }, 1000)
  }

  useLayoutEffect(() => {
    if (!bounds || !overlay.current) return
    const motion = overlay.current.animate([
      { transform: `translate(${bounds.originX}px, ${bounds.originY}px) scale(1)` },
      { transform: `translate(0, 0) scale(${bounds.scale})` }
    ], { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' })
    animation.current = motion
    motion.finished.then(() => {
      if (phase.current === 'open' && overlay.current) overlay.current.style.willChange = 'auto'
    }).catch(() => {})
    return () => motion.cancel()
  }, [bounds])

  useEffect(() => {
    phase.current = 'idle'
    const cancel = () => cancelPending()
    document.addEventListener('champions-focus', cancel)
    window.addEventListener('blur', cancel)
    document.addEventListener('scroll', cancel, true)
    return () => {
      phase.current = 'unmounted'
      cancelPending()
      document.removeEventListener('champions-focus', cancel)
      window.removeEventListener('blur', cancel)
      document.removeEventListener('scroll', cancel, true)
    }
  }, [])

  useEffect(() => {
    if (!bounds) return
    const dismiss = () => close()
    const keyboard = (event) => { if (event.key === 'Escape' || event.key === 'Tab') close() }
    const pointer = (event) => {
      if (event.clientX < bounds.left || event.clientX > bounds.left + bounds.width * bounds.scale || event.clientY < bounds.top || event.clientY > bounds.top + bounds.height * bounds.scale) close()
    }
    window.addEventListener('resize', dismiss)
    window.addEventListener('blur', dismiss)
    document.addEventListener('scroll', dismiss, true)
    document.addEventListener('keydown', keyboard)
    document.addEventListener('pointermove', pointer, { passive: true })
    return () => {
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('blur', dismiss)
      document.removeEventListener('scroll', dismiss, true)
      document.removeEventListener('keydown', keyboard)
      document.removeEventListener('pointermove', pointer)
    }
  }, [bounds])

  return <>
    <article ref={source} aria-hidden={Boolean(bounds)} className={`focus-source ${className}`} data-focusable="true" data-focused={Boolean(bounds)}
      onPointerEnter={schedule} onPointerLeave={cancelPending} onPointerDown={cancelPending}>{children}</article>
    {bounds && createPortal(<div data-focus-layer="true" className={`focus-layer ${closing ? 'is-closing' : ''}`}>
      <div className="focus-backdrop" onPointerDown={close} />
      <article ref={overlay} aria-label={label} className={`focused-card ${className}`}
        style={{ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }}>{children}</article>
      <span className="focus-hint">FOCUS VIEW <span>Move away or press Esc to return</span></span>
    </div>, document.body)}
  </>
})
