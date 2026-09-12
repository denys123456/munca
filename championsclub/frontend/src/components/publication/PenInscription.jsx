import { useEffect, useRef } from 'react'
import { handwritingPaths } from './handwriting.js'

const inscription = handwritingPaths('Every performance tells a story.')

export function PenInscription({ onWritten }) {
  const svg = useRef(null)
  const complete = useRef(onWritten)
  complete.current = onWritten
  useEffect(() => {
    const paths = [...svg.current.querySelectorAll('[data-ink]')]
    const lengths = paths.map((path) => path.getTotalLength())
    const total = lengths.reduce((sum, length) => sum + length, 0)
    const nib = svg.current.querySelector('[data-nib]')
    paths.forEach((path, index) => { path.style.strokeDasharray = lengths[index]; path.style.strokeDashoffset = lengths[index] })
    let frame
    let start
    function write(time) {
      if (!start) start = time
      const progress = Math.min(1, (time - start) / 6500)
      let remaining = progress * total
      let active = 0
      for (let index = 0; index < paths.length; index += 1) {
        const drawn = Math.max(0, Math.min(lengths[index], remaining))
        paths[index].style.strokeDashoffset = lengths[index] - drawn
        if (remaining >= 0) active = index
        remaining -= lengths[index]
      }
      const before = lengths.slice(0, active).reduce((sum, length) => sum + length, 0)
      const point = paths[active].getPointAtLength(Math.max(0, progress * total - before))
      const x = point.x + inscription[active].offset + 45
      const y = point.y + 128
      nib.setAttribute('transform', `translate(${x} ${y}) rotate(28)`)
      if (progress < 1) frame = requestAnimationFrame(write)
      else {
        const pool = svg.current.querySelector('.ink-pool')
        pool.setAttribute('cx', x)
        pool.setAttribute('cy', y)
        svg.current.dataset.written = 'true'
        complete.current()
      }
    }
    frame = requestAnimationFrame(write)
    return () => cancelAnimationFrame(frame)
  }, [])
  return <svg ref={svg} className="pen-inscription" viewBox="0 0 820 290" role="img" aria-label="Every performance tells a story.">
    <g fill="none" stroke="#253f50" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{inscription.map((glyph, index) => <path data-ink key={index} d={glyph.path} transform={`translate(${glyph.offset + 45} 128)`} />)}</g>
    <g data-nib className="fountain-pen"><path d="M-8 -118H8L7 -33H-7Z" fill="#243c4c" /><path d="M-7 -42L-10 -22L0 0L10 -22L7 -42Z" fill="#c4a268" stroke="#8f713f" strokeWidth=".7" /><path d="M0 -27V-1" fill="none" stroke="#473a29" strokeWidth=".8" /><circle cy="-26" r="2" fill="#273947" /><path d="M-5 -117V-45" fill="none" stroke="#fff9dc" opacity=".25" strokeWidth="1.5" /></g>
    <circle className="ink-pool" r="1.8" fill="#253f50" />
  </svg>
}
