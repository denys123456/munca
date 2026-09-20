import { useEffect, useMemo, useRef, useState } from 'react'
import { createArteonSequence } from './createArteonSequence.js'
import { useScrollTimeline } from './useScrollTimeline.js'
import { chapters } from './ExperienceTimeline.js'
import { getStoryData } from './storyData.js'
import { StoryTypography, StoryContent } from './ui/StoryContent.jsx'
import { LoadingExperience } from './ui/LoadingExperience.jsx'
import { Dialog } from '../components/ui/Dialog.jsx'

export default function AutomotiveExperience({ data, paused, onWorkspace }) {
  const root = useRef(null)
  const canvasHost = useRef(null)
  const runtime = useRef(null)
  const controls = useRef(null)
  const anchor = useRef(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const [loading, setLoading] = useState(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [models, setModels] = useState(null)
  const [indexOpen, setIndexOpen] = useState(false)
  const [modelInfo, setModelInfo] = useState(false)
  const metrics = useMemo(() => getStoryData(data), [data])
  useScrollTimeline(root, runtime, controls, paused, ready)

  useEffect(() => {
    let active = true
    try {
      runtime.current = createArteonSequence(canvasHost.current, {
        isPaused: () => pausedRef.current,
        onProgress: (value) => { if (active) setLoading(value) },
        onReady: (value) => { if (active) { setModels(value); setReady(true) } },
        onError: (message) => { if (active) { setError(message); setReady(true) } },
        onFrameAvailable: () => { if (active) setError((current) => current ? '' : current) },
        onTimeline: () => controls.current?.refresh(),
        onAnchor: (x, y) => { if (anchor.current) anchor.current.style.transform = `translate3d(${x}px, ${y}px, 0)` }
      })
      canvasHost.current.getDiagnostics = () => runtime.current?.diagnostics()
      controls.current?.refresh()
    } catch {
      setError('This browser cannot display the cinematic canvas. The full operational workspace remains available.')
      setReady(true)
    }
    return () => { active = false; runtime.current?.destroy(); runtime.current = null }
  }, [])

  useEffect(() => { runtime.current?.setData(metrics) }, [metrics, ready])

  function seek(chapter) {
    setIndexOpen(false)
    requestAnimationFrame(() => controls.current?.seek(chapter))
  }

  return <main ref={root} className="automotive-experience" data-tone="light" data-chapter="0" aria-label="ChampionsClub automotive experience" inert={paused}>
    <div className="experience-stage">
      <div className="studio-horizon" aria-hidden="true" />
      <StoryTypography />
      <div className="experience-canvas" ref={canvasHost} />
      <StoryContent metrics={metrics} data={data} onWorkspace={onWorkspace} onSeek={seek} anchorRef={anchor} />
      <div className="experience-bottom-bar"><button className="chapter-index-toggle" onClick={() => setIndexOpen(true)} aria-label="Open chapter index"><span data-chapter-count>01</span><span>/ 13</span><i /><span>EXPLORE THE SYSTEM</span></button><button className="model-disclosure" onClick={() => setModelInfo(true)}>CC—01 / ARTEON CINEMATIC <span>↗</span></button></div>
      <div className="journey-progress" aria-hidden="true"><span className="journey-progress-fill" /></div>
      {!ready && <LoadingExperience progress={loading} />}
      {error && <div className="graphics-fallback" role="status"><span>GRAPHICS UNAVAILABLE</span><p>{error}</p><button className="workspace-cta" onClick={() => onWorkspace()}>OPEN WORKSPACE ↗</button></div>}
    </div>
    {indexOpen && <Dialog title="Explore the system" onClose={() => setIndexOpen(false)} className="chapter-dialog"><nav className="chapter-index" aria-label="Story chapters">{chapters.map((chapter, index) => <button key={chapter.name} aria-current={Number(root.current?.dataset.chapter) === index ? 'step' : undefined} onClick={() => seek(index)}><span>{String(index + 1).padStart(2, '0')}</span>{chapter.name}<span>↗</span></button>)}</nav></Dialog>}
    {modelInfo && <Dialog title="The Arteon cinematic" onClose={() => setModelInfo(false)}><div className="model-information"><p>The Volkswagen Arteon, from the exterior to its mechanical heart. Scroll to explore, pause to settle, and scroll back to retrace every movement.</p><dl><dt>Vehicle</dt><dd>{models?.vehicle ?? 'Unavailable'}</dd><dt>Engine</dt><dd>{models?.engine ?? 'Unavailable'}</dd><dt>Data</dt><dd>{metrics.source === 'SEEDED DEMO DATA' ? 'Seeded demo workspace' : 'Connected performance service'}</dd></dl><p>Three original films. An exterior showcase, an opening hood, and an isolated engine study. The engineering film reverses to reconstruct the engine before returning to the car. Reduced motion selects static chapter views.</p></div></Dialog>}
  </main>
}
