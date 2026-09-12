import { useEffect, useRef } from 'react'

export function localInput(target, wheel = false) {
  const control = wheel ? 'button:not(.paper-corner)' : 'button,[role="button"]'
  return Boolean(target.closest(`input,textarea,select,${control},a,summary,details,[role="dialog"],[role="listbox"],[data-local-scroll],.table-scroll,.print-advisors,.notification-panel`) || document.querySelector('dialog[open], [data-focus-layer], .book-intro'))
}

export function useReaderInput({ root, sheets, active, phase, curl, api, navigation }) {
  const touch = useRef(null)
  useEffect(() => {
    const element = root.current
    let lastWheel = 0
    let endReached = 0
    const nextRoute = () => api.current.adjacent(1)

    function advance(delta) {
      const sheet = sheets.current[active.current]
      const now = performance.now()
      if (api.current.lockedUntil > now) return
      if (phase.current === 'CURLING_WITH_SCROLL') {
        const progress = Math.max(0, Math.min(1, curl.current.progress + Math.max(-180, Math.min(180, delta)) / Math.max(1600, innerHeight * 2.2)))
        curl.current.setProgress(progress)
        if (progress >= .82) api.current.finish()
        else if (progress <= .001 && delta < 0) api.current.cancel()
        return
      }
      if (!['IDLE', 'EXPLORING_PAGE', 'AT_PAGE_END'].includes(phase.current)) return
      if (sheet.atEnd && delta > 0 && nextRoute()) {
        if (!endReached) { endReached = now; return }
        if (now - endReached < 180) return
        if (api.current.requestTurn(nextRoute(), { kind: 'scroll' })) curl.current.setProgress(Math.min(.07, delta / 1800))
      } else if (sheet.atStart && delta < 0 && now - lastWheel > 240 && api.current.adjacent(-1)) {
        api.current.requestTurn(api.current.adjacent(-1), { kind: 'boundary', restore: true })
      } else if (sheet.spatial) {
        endReached = 0
        document.dispatchEvent(new Event('publication-camera'))
        sheet.advance(delta)
      }
    }

    function wheel(event) {
      if (event.ctrlKey || localInput(event.target, true)) return
      const sheet = sheets.current[active.current]
      const delta = (Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1)
      if (!delta) return
      if (sheet.spatial || sheet.atEnd && delta > 0 || phase.current === 'CURLING_WITH_SCROLL') event.preventDefault()
      advance(delta)
      lastWheel = performance.now()
    }

    function keyboard(event) {
      if (event.key === 'Escape' && ['DRAGGING_CORNER', 'CURLING_WITH_SCROLL'].includes(phase.current)) { event.preventDefault(); api.current.cancel(); return }
      if (localInput(event.target) || event.ctrlKey || event.metaKey || event.altKey) return
      if (!['IDLE', 'EXPLORING_PAGE', 'AT_PAGE_END', 'CURLING_WITH_SCROLL'].includes(phase.current)) return
      const sheet = sheets.current[active.current]
      if (!sheet.spatial) return
      if (event.key === 'End' || event.key === 'Home') {
        event.preventDefault()
        if (phase.current !== 'CURLING_WITH_SCROLL') sheet.seek(event.key === 'End' ? 1 : 0)
        return
      }
      const increments = { ArrowDown: 180, ArrowRight: 180, PageDown: 240, ' ': event.shiftKey ? -240 : 240, ArrowUp: -180, ArrowLeft: -180, PageUp: -240 }
      if (increments[event.key]) { event.preventDefault(); advance(increments[event.key]) }
    }

    function down(event) {
      if (event.pointerType !== 'touch' || localInput(event.target)) return
      touch.current = { y: event.clientY }
      element.setPointerCapture(event.pointerId)
    }
    function move(event) {
      if (!touch.current) return
      event.preventDefault()
      const delta = touch.current.y - event.clientY
      touch.current = { y: event.clientY }
      advance(delta * 2)
    }
    function up() { touch.current = null }
    function pause() {
      if (['IDLE', 'EXPLORING_PAGE', 'AT_PAGE_END'].includes(phase.current)) sheets.current[active.current]?.stop()
    }

    element.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('keydown', keyboard)
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move, { passive: false })
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', up)
    document.addEventListener('publication-focus', pause)
    return () => {
      element.removeEventListener('wheel', wheel)
      window.removeEventListener('keydown', keyboard)
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', up)
      document.removeEventListener('publication-focus', pause)
    }
  }, [navigation, root, sheets, active, phase, curl, api])
}
