import { buildCinematicTimeline, createCinematicMotion, clamp } from './arteonTimeline.js'
import { createCinematicMedia } from './cinematicMedia.js'
import { createCinematicParticles } from './cinematicParticles.js'

export function createArteonSequence(host, callbacks) {
  const canvas = document.createElement('canvas')
  canvas.className = 'cinematic-film'
  canvas.width = 1280; canvas.height = 720
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', 'Silver Volkswagen Arteon. Scroll to explore the exterior, open the hood, and study the isolated engine in both directions.')
  const context = canvas.getContext('2d', { alpha: false, desynchronized: true })
  if (!context) throw new Error('Canvas is unavailable')
  host.append(canvas)
  const surround = document.createElement('div')
  surround.className = 'cinematic-surround'
  surround.setAttribute('aria-hidden', 'true')
  for (const edge of ['top', 'bottom', 'left', 'right']) {
    const band = document.createElement('i')
    band.className = `film-edge-${edge}`
    surround.append(band)
  }
  host.prepend(surround)
  const particles = createCinematicParticles(host)
  const lifetime = new AbortController()
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
  let reduced = motionQuery.matches, disposed = false, ready = false
  let timeline, media, motion, requested, displayed, method = 'loading'
  let rawProgress = 0, renderedProgress = 0, direction = 1, motionFrame = 0
  let draws = 0, drawMaxMs = 0, requestTime = 0, presentationMaxMs = 0
  let listener = null, lastInput = 0, settledMs = 0, frameHistory = [], motionState = null
  let errorReported = false
  const reportError = message => { errorReported = true; callbacks.onError(message) }

  function present(entry, visual, renderer) {
    if (disposed || callbacks.isPaused() || document.hidden || requested?.key !== entry.key) return
    if (displayed?.ordinal === requested.ordinal) return
    const start = performance.now()
    // The backing store and destination rectangle never change during scrolling
    // or resize. CSS contains the full original aspect ratio. Never clear it.
    context.drawImage(visual, 0, 0, canvas.width, canvas.height)
    displayed = requested
    method = renderer
    draws++
    drawMaxMs = Math.max(drawMaxMs, performance.now() - start)
    presentationMaxMs = Math.max(presentationMaxMs, performance.now() - requestTime)
    host.dataset.frame = String(displayed.index)
    host.dataset.clip = displayed.clip
    host.dataset.ordinal = String(displayed.ordinal)
    host.dataset.buffering = 'false'
    host.dataset.transition = timeline.segments[displayed.segment].id
    canvas.style.visibility = 'visible'
    particles.draw(displayed, reduced)
    frameHistory.push({ ordinal: displayed.ordinal, clip: displayed.clip, frame: displayed.index, requested: requested.ordinal, at: performance.now() })
    if (frameHistory.length > 180) frameHistory.shift()
    listener?.(renderedProgress, timeline, displayed)
    if (errorReported) { errorReported = false; callbacks.onFrameAvailable?.() }
    if (!ready) {
      ready = true
      callbacks.onProgress(100)
      callbacks.onReady({ vehicle: 'Volkswagen Arteon source footage', engine: 'Original isolated engine, decomposition and reconstruction', issues: [] })
      media.preload(reduced)
    }
  }
  function select(progress) {
    renderedProgress = progress
    const entry = reduced ? timeline.chapterEntries[Math.round(timeline.phaseAt(progress))] : timeline.atProgress(progress)
    if (requested?.ordinal === entry.ordinal && displayed?.ordinal === entry.ordinal) return
    const changed = requested?.ordinal !== entry.ordinal
    requested = entry
    if (changed) requestTime = performance.now()
    host.dataset.requestedFrame = String(entry.index)
    host.dataset.requestedClip = entry.clip
    host.dataset.buffering = String(displayed?.ordinal !== entry.ordinal)
    media.request(entry, reduced)
    if (!reduced) media.nearby(entry, direction)
  }
  function tick(now) {
    motionFrame = 0
    if (disposed || !motion || callbacks.isPaused() || document.hidden) return
    motionState = motion.tick(now, reduced)
    select(motionState.progress)
    if (motionState.active) motionFrame = requestAnimationFrame(tick)
    else settledMs = performance.now() - lastInput
  }
  function schedule() {
    if (!disposed && !motionFrame && !document.hidden && !callbacks.isPaused()) motionFrame = requestAnimationFrame(tick)
  }
  function seek(value) {
    const next = clamp(value)
    direction = Math.sign(next - rawProgress) || direction
    rawProgress = next; lastInput = performance.now()
    motion?.seek(next, reduced)
    schedule()
  }
  const onVisibility = () => { if (!document.hidden) schedule() }
  const onMotion = () => {
    reduced = motionQuery.matches
    canvas.setAttribute('aria-label', reduced ? 'Static automotive chapter views. Reduced motion is enabled.' : 'Silver Volkswagen Arteon cinematic. Scroll to advance or reverse.')
    motion?.seek(rawProgress, reduced); schedule()
  }
  const onLost = event => { event.preventDefault(); reportError('The cinematic display was interrupted. Your workspace remains available.') }
  const onRestored = () => { displayed = null; schedule() }
  document.addEventListener('visibilitychange', onVisibility)
  motionQuery.addEventListener('change', onMotion)
  canvas.addEventListener('contextlost', onLost)
  canvas.addEventListener('contextrestored', onRestored)
  const resize = new ResizeObserver(() => { if (displayed) particles.draw(displayed, reduced) })
  resize.observe(host)
  callbacks.onProgress(10)
  fetch(`${import.meta.env.BASE_URL}media/cinematic/manifest.json`, { signal: lifetime.signal })
    .then(response => { if (!response.ok) throw new Error('Cinematic manifest could not load.'); return response.json() })
    .then(manifest => {
      if (disposed) return
      if (manifest.clips?.length !== 3 || manifest.clips.some(clip => clip.frames.length !== clip.source.frameCount)) throw new Error('Cinematic manifest failed frame validation.')
      timeline = buildCinematicTimeline(manifest)
      motion = createCinematicMotion(timeline)
      media = createCinematicMedia(host, timeline, { onFrame: present, onError: reportError, isPaused: callbacks.isPaused })
      callbacks.onTimeline?.(timeline)
      callbacks.onProgress(35)
      // Workspace-first visits need only the poster, not a running video decoder.
      if (callbacks.isPaused()) {
        requested = timeline.atProgress(rawProgress)
        media.request(requested, true)
        ready = true; callbacks.onReady({ vehicle: 'Volkswagen Arteon source footage', engine: 'Original isolated engine', issues: [] })
      }
      seek(rawProgress)
    })
    .catch(error => { if (!disposed && error.name !== 'AbortError') reportError(error.message) })
  return {
    update(_state, progress) { seek(progress) },
    setData() {},
    setPresentationListener(value) { listener = value; if (timeline && displayed) listener?.(renderedProgress, timeline, displayed) },
    getTimeline: () => timeline,
    invalidate() { motion?.seek(rawProgress, reduced); schedule(); if (ready) media?.preload(reduced) },
    diagnostics() {
      return { ready, requestedClip: requested?.clip, requestedFrame: requested?.index, requestedOrdinal: requested?.ordinal, displayedClip: displayed?.clip, displayedFrame: displayed?.index ?? -1, displayedOrdinal: displayed?.ordinal, transition: displayed && timeline.segments[displayed.segment].id, sourceTime: displayed?.timestamp, frameCount: timeline?.entries.length, sourceFrameCount: timeline && Object.values(timeline.clips).reduce((sum, clip) => sum + clip.frames.length, 0), duration: timeline?.duration, chapterProgress: timeline?.chapterProgress, segments: timeline?.segments, progress: renderedProgress, targetProgress: rawProgress, lagSeconds: motionState?.lagSeconds, settledMs, frames: draws, renderer: method, reducedMotion: reduced, canvasWidth: canvas.width, canvasHeight: canvas.height, canvasBytes: canvas.width * canvas.height * 4, drawMaxMs, presentationMaxMs, buffering: requested?.ordinal !== displayed?.ordinal, history: frameHistory, ...media?.diagnostics(), ...particles.diagnostics() }
    },
    destroy() {
      disposed = true; lifetime.abort(); cancelAnimationFrame(motionFrame)
      media?.destroy(); particles.destroy(); resize.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onMotion)
      canvas.removeEventListener('contextlost', onLost)
      canvas.removeEventListener('contextrestored', onRestored)
      listener = null; frameHistory = []; delete host.getDiagnostics; canvas.remove(); surround.remove()
    }
  }
}
