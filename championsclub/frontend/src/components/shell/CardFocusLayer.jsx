import { useEffect, useRef, useState } from 'react'

const focusSelector = [
  '.kpi-card',
  '.reward-card',
  '.advisor-row',
  '.alert-card',
  '.leaderboard-card',
  '.target-card',
  '.executive-hero',
  '.forecast-primary',
  '.insight-section',
].join(',')

export function CardFocusLayer() {
  const timerRef = useRef(null)
  const activeTargetRef = useRef(null)
  const [focusedCard, setFocusedCard] = useState(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) {
      return undefined
    }

    function clearFocus() {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
      activeTargetRef.current = null
      setFocusedCard(null)
    }

    function onPointerOver(event) {
      const target = event.target.closest(focusSelector)
      if (!target || target.closest('.intro-sequence, .search-panel, .modal-backdrop, .toast-stack')) {
        return
      }
      if (activeTargetRef.current === target) {
        return
      }

      window.clearTimeout(timerRef.current)
      activeTargetRef.current = target
      timerRef.current = window.setTimeout(() => {
        if (activeTargetRef.current !== target || !target.matches(':hover')) {
          return
        }
        const rect = target.getBoundingClientRect()
        const scale = Math.min(1.75, (window.innerWidth - 48) / rect.width, (window.innerHeight - 48) / rect.height)
        const scaledWidth = rect.width * scale
        const scaledHeight = rect.height * scale
        const left = Math.min(Math.max(24, rect.left + rect.width / 2 - scaledWidth / 2), window.innerWidth - scaledWidth - 24)
        const top = Math.min(Math.max(24, rect.top + rect.height / 2 - scaledHeight / 2), window.innerHeight - scaledHeight - 24)
        setFocusedCard({
          html: target.innerHTML,
          className: target.className,
          style: {
            left,
            top,
            width: rect.width,
            height: rect.height,
            '--focus-scale': scale,
          },
        })
      }, 1000)
    }

    function onPointerOut(event) {
      const from = event.target.closest(focusSelector)
      const to = event.relatedTarget?.closest?.(focusSelector)
      if (from && from !== to) {
        clearFocus()
      }
    }

    document.addEventListener('pointerover', onPointerOver)
    document.addEventListener('pointerout', onPointerOut)
    document.addEventListener('scroll', clearFocus, true)
    window.addEventListener('resize', clearFocus)
    return () => {
      clearFocus()
      document.removeEventListener('pointerover', onPointerOver)
      document.removeEventListener('pointerout', onPointerOut)
      document.removeEventListener('scroll', clearFocus, true)
      window.removeEventListener('resize', clearFocus)
    }
  }, [])

  if (!focusedCard) {
    return null
  }

  return (
    <>
      <div className="focus-overlay" />
      <div
        aria-hidden="true"
        className={`focus-card is-visible ${focusedCard.className}`}
        dangerouslySetInnerHTML={{ __html: focusedCard.html }}
        style={focusedCard.style}
      />
    </>
  )
}
