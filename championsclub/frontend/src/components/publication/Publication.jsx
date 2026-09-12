import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpLeft } from 'lucide-react'
import { PublicationSheet } from './PublicationSheet.jsx'
import { CurlSurface } from './CurlSurface.jsx'
import { ReaderControls } from './ReaderControls.jsx'
import { useReaderInput } from './useReaderInput.js'
import { createCurl } from './curl.js'
import { routeFor, routeKey, equalRoute } from './routes.js'
import { navigationByRole } from '../../product/navigation.js'

export function Publication({ account, accounts, data, onChangeAccount, onCloseBook }) {
  const location = useLocation()
  const routerNavigate = useNavigate()
  const navigation = navigationByRole[account.role]
  const [current, setCurrent] = useState(() => routeFor(location.pathname, account.role))
  const [activeSlot, setActiveSlot] = useState(0)
  const [pending, setPending] = useState(null)
  const [atEnd, setAtEnd] = useState(false)
  const root = useRef(null)
  const svg = useRef(null)
  const skim = useRef(null)
  const sheets = useRef([null, null])
  const curl = useRef(null)
  const active = useRef(0)
  const currentRef = useRef(current)
  const pendingRef = useRef(null)
  const phase = useRef('IDLE')
  const queuedRoute = useRef(null)
  const positions = useRef(new Map())
  const historyIndex = useRef(window.history.state?.idx ?? 0)
  const held = useRef(null)
  const settleTimer = useRef(null)
  const lockedUntil = useRef(0)
  const progressLine = useRef(null)
  const progressLabel = useRef(null)
  const progressNumber = useRef(null)
  const api = useRef({})
  const currentIndex = current.page === 'closing' ? -1 : Math.max(0, navigation.findIndex((item) => item.page === (current.page === 'advisor-detail' ? 'advisors' : current.page)))
  const next = current.page === 'closing' ? null : navigation[currentIndex + 1] ?? { page: 'closing' }
  const under = pending?.route ?? { page: next?.page ?? navigation[0].page, advisorId: 1 }
  const frontSlot = pending?.backward ? 1 - activeSlot : activeSlot

  function chapterIndex(page) {
    return page === 'closing' ? navigation.length : navigation.findIndex((item) => item.page === (page === 'advisor-detail' ? 'advisors' : page))
  }

  function setPhase(value) {
    phase.current = value
    if (root.current) root.current.dataset.mode = value
  }

  const onEdge = useCallback((slot, edge) => {
    if (slot !== active.current) return
    if (root.current) root.current.dataset.edge = edge
    setAtEnd(edge === 'end')
    if (['IDLE', 'EXPLORING_PAGE', 'AT_PAGE_END'].includes(phase.current)) setPhase(edge === 'end' ? 'AT_PAGE_END' : edge === 'start' ? 'IDLE' : 'EXPLORING_PAGE')
  }, [])

  const onProgress = useCallback((slot, progress, label, stop = 0) => {
    if (slot !== active.current) return
    if (progressLine.current) progressLine.current.style.transform = `scaleX(${progress})`
    if (progressLabel.current && progressLabel.current.textContent !== label) progressLabel.current.textContent = label
    const number = String(stop + 1).padStart(2, '0')
    if (progressNumber.current && progressNumber.current.textContent !== number) progressNumber.current.textContent = number
  }, [])

  function requestTurn(route, { kind = 'direct', history = false, restore = false, backward: historyBackward } = {}) {
    if (equalRoute(route, currentRef.current)) return false
    if (!['IDLE', 'EXPLORING_PAGE', 'AT_PAGE_END'].includes(phase.current)) {
      queuedRoute.current = { route, history, kind, restore, backward: historyBackward }
      return false
    }
    root.current.querySelectorAll('details[open]').forEach((detail) => detail.removeAttribute('open'))
    const source = sheets.current[active.current]
    positions.current.set(routeKey(currentRef.current), source.position)
    source.stop()
    const oldIndex = chapterIndex(currentRef.current.page)
    const destinationIndex = chapterIndex(route.page)
    const backward = historyBackward ?? (!['drag', 'scroll'].includes(kind) && destinationIndex >= 0 && (destinationIndex < oldIndex || currentRef.current.page === 'closing'))
    const transition = { route, kind, history, backward, initialPosition: history || restore ? positions.current.get(routeKey(route)) ?? 0 : 0, skims: kind === 'direct' && !history ? Math.min(3, Math.max(0, Math.abs(destinationIndex - oldIndex) - 1)) : 0 }
    pendingRef.current = transition
    setPhase(kind === 'drag' ? 'DRAGGING_CORNER' : kind === 'scroll' ? 'CURLING_WITH_SCROLL' : 'NAVIGATING_DIRECTLY')
    setPending(transition)
    return true
  }

  function navigate(page, advisorId = 1) {
    requestTurn(routeFor(`/${page}${page === 'advisor-detail' ? `/${advisorId}` : ''}`, account.role))
  }

  function unlock() {
    const sheet = sheets.current[active.current]
    setPhase(sheet.atEnd ? 'AT_PAGE_END' : sheet.atStart ? 'IDLE' : 'EXPLORING_PAGE')
    lockedUntil.current = performance.now() + 450
    const queued = queuedRoute.current
    queuedRoute.current = null
    if (queued && !equalRoute(queued.route, currentRef.current)) requestTurn(queued.route, queued)
  }

  function complete() {
    const transition = pendingRef.current
    if (!transition) return
    if (transition.skims > 0) {
      transition.skims -= 1
      sheets.current[active.current].element.style.visibility = 'hidden'
      skim.current.style.visibility = 'visible'
      skim.current.querySelector('strong').textContent = String(transition.skims + 1).padStart(2, '0')
      curl.current.connect(skim.current)
      curl.current.setProgress(0, true)
      curl.current.finish(false, 210)
      return
    }
    skim.current.style.visibility = 'hidden'
    setPhase('SETTLING')
    currentRef.current = transition.route
    active.current = 1 - active.current
    pendingRef.current = null
    setCurrent(transition.route)
    setActiveSlot(active.current)
    setPending(null)
    if (!transition.history && !queuedRoute.current?.history) routerNavigate(`/${routeKey(transition.route)}`)
  }

  function canceled() {
    pendingRef.current = null
    setPending(null)
    held.current = null
    curl.current.reset()
    unlock()
  }

  function finish() { setPhase(pendingRef.current?.backward ? 'COMPLETING_BACKWARD' : 'COMPLETING_FORWARD'); curl.current.finish(Boolean(pendingRef.current?.backward)) }
  function cancel() { held.current = null; setPhase('SETTLING'); curl.current.cancel() }

  api.current = { complete, canceled, requestTurn, navigate, unlock, finish, cancel,
    get lockedUntil() { return lockedUntil.current },
    adjacent(direction) {
      const index = chapterIndex(currentRef.current.page)
      const item = navigation[index + direction]
      return item ? { page: item.page, advisorId: 1 } : direction > 0 && currentRef.current.page !== 'closing' ? { page: 'closing', advisorId: 1 } : null
    }
  }

  useLayoutEffect(() => {
    curl.current = createCurl({ root: root.current, svg: svg.current, onComplete: () => api.current.complete(), onCancel: () => api.current.canceled() })
    curl.current.connect(sheets.current[active.current].element)
    return () => { curl.current?.destroy(); clearTimeout(settleTimer.current) }
  }, [])

  useLayoutEffect(() => {
    if (!pending) return
    const front = sheets.current[pending.backward ? 1 - activeSlot : activeSlot]
    sheets.current[1 - activeSlot].seek(pending.initialPosition, true)
    curl.current.connect(front.element)
    if (!['drag', 'scroll'].includes(pending.kind)) {
      curl.current.setProgress(pending.backward ? 1 : 0, true)
      curl.current.finish(pending.backward, pending.skims ? 340 : 720)
    } else if (held.current) curl.current.follow(held.current.x, held.current.y)
  }, [pending, activeSlot])

  useLayoutEffect(() => {
    if (pending || phase.current !== 'SETTLING') return
    curl.current.reset()
    sheets.current.forEach((item) => item?.element.style.removeProperty('visibility'))
    const sheet = sheets.current[activeSlot]
    curl.current.connect(sheet.element)
    onEdge(activeSlot, sheet.atEnd ? 'end' : sheet.atStart ? 'start' : 'inside')
    sheet.seek(sheet.position, true)
    settleTimer.current = setTimeout(() => { root.current?.focus({ preventScroll: true }); api.current.unlock() }, 220)
  }, [pending, activeSlot, onEdge])

  useEffect(() => {
    const route = routeFor(location.pathname, account.role)
    const nextHistoryIndex = window.history.state?.idx
    const backward = Number.isInteger(nextHistoryIndex) && nextHistoryIndex !== historyIndex.current ? nextHistoryIndex < historyIndex.current : undefined
    if (Number.isInteger(nextHistoryIndex)) historyIndex.current = nextHistoryIndex
    if (equalRoute(route, currentRef.current) && location.pathname !== `/${routeKey(route)}`) { routerNavigate(`/${routeKey(route)}`, { replace: true }); return }
    if (equalRoute(route, currentRef.current) || pendingRef.current && equalRoute(route, pendingRef.current.route)) return
    api.current.requestTurn(route, { history: true, backward })
  }, [location.pathname, account.role, routerNavigate])

  useReaderInput({ root, sheets, active, phase, curl, api, navigation })

  function startDrag(event) {
    if (event.button !== 0 || !atEnd || !next || !['AT_PAGE_END', 'IDLE'].includes(phase.current)) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    held.current = { x: event.clientX, y: event.clientY }
    requestTurn({ page: next.page, advisorId: 1 }, { kind: 'drag' })
  }
  function drag(event) {
    if (!held.current || phase.current !== 'DRAGGING_CORNER') return
    held.current = { x: event.clientX, y: event.clientY }
    curl.current.follow(event.clientX, event.clientY)
  }
  function endDrag(event) {
    if (!held.current || phase.current !== 'DRAGGING_CORNER') return
    held.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (event.type === 'pointerup' && curl.current.progress >= .38) finish()
    else cancel()
  }

  const sheetRoutes = activeSlot === 0 ? [current, under] : [under, current]
  return <main ref={root} className="publication" data-route={routeKey(current)} data-turn-direction={pending ? pending.backward ? 'backward' : 'forward' : undefined} tabIndex={-1} aria-label="ChampionsClub publication">
    <div className="publication-sheets">{sheetRoutes.map((route, slot) => <div key={slot} className={`sheet-slot ${slot === frontSlot ? 'is-front' : 'is-under'}`} data-slot={slot}><PublicationSheet key={routeKey(route)} ref={(value) => { sheets.current[slot] = value }} route={route} data={data} navigation={navigation} initialPosition={slot === activeSlot ? positions.current.get(routeKey(route)) ?? 0 : pending?.initialPosition ?? 0} onNavigate={navigate} onCloseBook={onCloseBook} active={slot === activeSlot && !pending} onEdge={(edge) => onEdge(slot, edge)} onProgress={(...args) => onProgress(slot, ...args)} /></div>)}</div>
    <div ref={skim} className="skimming-sheet" aria-hidden="true"><span>CHAMPIONSCLUB / THE PERFORMANCE ISSUE</span><strong>01</strong><i /><span>THE NEXT CHAPTER IN YOUR PROGRESS</span></div>
    <CurlSurface ref={svg} />
    <ReaderControls account={account} accounts={accounts} data={data} navigation={navigation} currentIndex={currentIndex} navigate={navigate} onChangeAccount={onChangeAccount} atEnd={atEnd} progressLine={progressLine} progressNumber={progressNumber} progressLabel={progressLabel} />
    <button className="paper-corner" aria-label="Pull bottom-right corner toward top-left to turn page" disabled={!atEnd || !next} onPointerEnter={() => { if (atEnd && next && phase.current === 'AT_PAGE_END') curl.current.lift() }} onPointerLeave={() => { if (phase.current === 'AT_PAGE_END') curl.current.reset() }} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onClick={(event) => { if (event.detail === 0 && next) navigate(next.page) }}><ArrowUpLeft /><span>TURN THE PAGE</span></button>
    {data.serviceError && <div className="publication-service" role="status">{data.serviceError}<button onClick={data.actions.retry}>Retry</button></div>}
  </main>
}
