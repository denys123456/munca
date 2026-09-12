import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PenInscription } from './PenInscription.jsx'

export function hasOpenedBook() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  try { return sessionStorage.getItem('championsclub-book-opened') === 'true' } catch { return false }
}

export function BookOpening({ onComplete, closed = false }) {
  const [phase, setPhase] = useState('cover')
  const callback = useRef(onComplete)
  callback.current = onComplete
  const button = useRef(null)

  function finish() {
    try { sessionStorage.setItem('championsclub-book-opened', 'true') } catch {}
    callback.current()
  }

  useEffect(() => {
    button.current?.focus()
    const escape = (event) => { if (event.key === 'Escape') finish() }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])

  useEffect(() => {
    let timer
    if (phase === 'cover' && !closed) timer = setTimeout(() => setPhase('opening'), 1800)
    if (phase === 'opening') timer = setTimeout(() => closed ? finish() : setPhase('writing'), 1100)
    if (phase === 'holding') timer = setTimeout(() => setPhase('revealing'), 3000)
    if (phase === 'revealing') timer = setTimeout(finish, 1200)
    return () => clearTimeout(timer)
  }, [phase, closed])

  return createPortal(<div className={`book-intro ${closed ? 'book-closed' : ''}`} data-phase={phase} role="dialog" aria-modal="true" aria-label={closed ? 'The book is closed' : 'Welcome to ChampionsClub'}>
    <div className="reader-focus-backdrop" />
    {(phase === 'cover' || phase === 'opening') && <div className="cover-environment"><div className="cover-plane"><span className="cover-edition">THE PERFORMANCE ISSUE / VOL. 01</span><span className="cover-monogram">CC</span><h1>Champions<br /><em>Club.</em></h1><span className="cover-motto">AMBITION. INTELLIGENCE. ADVANTAGE.</span><button ref={button} onClick={() => setPhase('opening')}>Open book <span aria-hidden="true">↗</span></button><span className="cover-colophon">A NEW PERSPECTIVE ON PERFORMANCE</span></div></div>}
    {['writing', 'holding', 'revealing'].includes(phase) && <div className="inscription-scene"><span>YOUR NEXT CHAPTER STARTS HERE</span><PenInscription onWritten={() => setPhase('holding')} /><p>Turn performance into progress.</p></div>}
    <button className="intro-skip" onClick={finish}>{closed ? 'Return to the page' : 'Skip introduction'} ↗</button>
  </div>, document.body)
}
