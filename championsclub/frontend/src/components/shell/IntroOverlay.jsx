import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Brand } from './Brand.jsx'

const motto = 'Turn performance into progress.'

export function IntroOverlay({ onComplete }) {
  const [characters, setCharacters] = useState(0)
  const [phase, setPhase] = useState('typing')

  useEffect(() => {
    let timer
    if (characters < motto.length) {
      timer = window.setTimeout(() => setCharacters((count) => count + 1), characters === 0 ? 240 : 34)
    } else if (phase === 'typing') {
      timer = window.setTimeout(() => setPhase('reveal'), 340)
    } else {
      timer = window.setTimeout(() => {
        try { sessionStorage.setItem('championsclub-intro-seen', 'true') } catch {}
        onComplete()
      }, 550)
    }
    return () => window.clearTimeout(timer)
  }, [characters, phase, onComplete])

  return createPortal(<div className={`intro-sequence ${phase}`} aria-label="Welcome to ChampionsClub"><div className="intro-identity"><Brand /><div className="intro-rule" /><p>{motto.slice(0, characters)}{phase === 'typing' && <span className="cursor" />}</p><span className="intro-caption">AMBITION. INTELLIGENCE. ADVANTAGE.</span></div></div>, document.body)
}

export function hasSeenIntro() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  try { return sessionStorage.getItem('championsclub-intro-seen') === 'true' } catch { return false }
}
