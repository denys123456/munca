import { useEffect, useRef, useState } from 'react'

const focusSelector = [
  '.kpi-card',
  '.panel',
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
  const [focusedCard, setFocusedCard] = useState(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) {
      return undefined
    }

    function clearFocus() {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
      setFocusedCard(null)
    }

    function onPointerOver(event) {
      const target = event.target.closest(focusSelector)
      if (!target || target.closest('.intro-sequence, .search-panel, .modal-backdrop, .toast-stack')) {
        return
      }

      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        const rect = target.getBoundingClientRect()
        const maxScale = Math.min(1.75, (window.innerWidth - 48) / rect.width, (window.innerHeight - 48) / rect.height)
        const width = rect.width * maxScale
        const height = rect.height * maxScale
        const left = Math.min(Math.max(24, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 24)
        const top = Math.min(Math.max(24, rect.top + rect.height / 2 - height / 2), window.innerHeight - height - 24)
        setFocusedCard({
          html: target.innerHTML,
          className: target.className,
          style: {
            left,
            top,
            width,
            minHeight: height,
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
      <div className="focus-scrim" />
      <div
        aria-hidden="true"
        className={`focus-card ${focusedCard.className}`}
        dangerouslySetInnerHTML={{ __html: focusedCard.html }}
        style={focusedCard.style}
      />
    </>
  )
}
