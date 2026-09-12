import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

export function Scene({ stops, index, children, className = '', end, label }) {
  const stop = stops[index]
  return <section className={`editorial-scene ${className}`} data-scene={index} data-scene-end={end} aria-label={label ?? stop.label} style={{ '--scene-x': stop.x, '--scene-y': stop.y }}>{children}</section>
}

export function PrintLabel({ number, children }) {
  return <div className="print-label"><span>{number}</span><i /><span>{children}</span></div>
}

export function JourneyOpening({ title, first, emphasis, description, number, children }) {
  return <><PrintLabel number={number ?? 'CHAMPIONSCLUB'}>{title.toUpperCase()}</PrintLabel><h1 className="chapter-statement">{first}<br /><em>{emphasis}</em></h1><p className="chapter-deck">{description}</p><span className="printed-scroll">Scroll to explore <ArrowDownRight /></span>{children}</>
}

export function ChapterEnd({ title = 'The story continues.', children, onNavigate, destination, nextTitle }) {
  return <><PrintLabel number="FIN">A CHAPTER IN YOUR PROGRESS</PrintLabel><h2>{title}<br /><em>Make the next move.</em></h2><div className="chapter-deck">{children ?? 'The next sheet is waiting. Continue scrolling to turn the corner.'}</div>{destination && <button className="print-link" onClick={() => onNavigate(destination)}>{nextTitle ?? 'Continue the story'}<ArrowUpRight /></button>}<div className="end-colophon"><span>CHAMPIONSCLUB / THE PERFORMANCE STANDARD</span><span>SCROLL TO TURN / PULL THE CORNER</span></div></>
}

export function PrintedThread() {
  return <svg className="composition-thread" viewBox="0 0 3240 3600" preserveAspectRatio="none" aria-hidden="true"><path d="M240 800C1500 1000 2700 430 2890 1100S1880 1850 1120 2080S-300 2800 700 2930S2700 2750 2970 3390" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
}
