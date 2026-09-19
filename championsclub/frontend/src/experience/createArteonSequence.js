import { chapterFrames, deliveryFrameCount, deliveryFps, frameAtProgress } from './arteonTimeline.js'

const base = `${import.meta.env.BASE_URL}media/arteon/`

export function createArteonSequence(host, callbacks) {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', 'Volkswagen Arteon cinematic. Scroll forward to advance and backward to reverse.')
  const context = canvas.getContext('2d', { alpha: true, desynchronized: true })
  if (!context) throw new Error('Canvas is unavailable')
  host.appendChild(canvas)
  const lifetime = new AbortController()
  const cache = new Map()
  const requests = new Map()
  const failures = new Map()
  let wanted = new Set([0])
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
  const compact = host.clientWidth <= 720 || navigator.connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 4)
  // Keep a small directional window decoded.  The previous 28-frame/3-request
  // window caused rapid wheel input to abort almost every useful request and
  // made the canvas visibly trail the scroll position.
  const cacheLimit = compact ? 20 : 28
  const concurrency = compact ? 3 : 6
  let reducedMotion = motionQuery.matches
  let manifest, variant, queue = []
  let requested = 0, displayed = -1, direction = 1, progress = 0
  let targetProgress = 0, visualProgress = 0, momentum = 0, motionFrame = 0
  let disposed = false, ready = false, scheduled = 0, dirty = true
  let width = 0, height = 0, draws = 0, decodes = 0, evictions = 0
  let decodeTotal = 0, decodeMax = 0, drawMax = 0, errorReported = false
  let retryTimer = 0

  function evict() {
    while (cache.size > cacheLimit) {
      // Evict distant frames first; retain the currently displayed bitmap so
      // resizing never clears a frame while a new request is in flight.
      const candidates = [...cache.keys()].filter((index) => index !== displayed && index !== requested)
      candidates.sort((a, b) => Number(wanted.has(a)) - Number(wanted.has(b)) || Math.abs(b - requested) - Math.abs(a - requested))
      const index = candidates[0]
      if (index == null) break
      cache.get(index).close?.()
      cache.delete(index)
      evictions++
    }
  }

  function invalidate() {
    if (!disposed && !scheduled && !document.hidden && !callbacks.isPaused()) scheduled = requestAnimationFrame(draw)
  }

  function draw() {
    scheduled = 0
    if (disposed || callbacks.isPaused() || document.hidden || !variant) return
    // Async completion never chooses a frame: only the latest requested index
    // may replace the image. Keep the last complete frame during a cache miss.
    const index = cache.has(requested) ? requested : displayed
    const bitmap = cache.get(index)
    if (!bitmap || (index === displayed && !dirty)) return
    const started = performance.now()
    const nextWidth = host.clientWidth
    const nextHeight = host.clientHeight
    if (!nextWidth || !nextHeight) return
    width = nextWidth
    height = nextHeight
    // Never allocate a full-screen retina buffer for a 720p source.
    const dpr = Math.min(devicePixelRatio || 1, 1.5, variant.width / Math.min(width, variant.width))
    const bufferWidth = Math.round(width * dpr)
    const bufferHeight = Math.round(height * dpr)
    if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) { canvas.width = bufferWidth; canvas.height = bufferHeight }
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, width, height)
    // Contain the entire original frame. Exterior geometry is never cropped;
    // engine close-ups retain their original crop. Native-size desktop cap.
    const mobile = width <= 720
    // Every source frame is already a fixed 1280x720 composition.  Keep one
    // stable destination rectangle for the entire sequence so transparent
    // matte bounds cannot make the vehicle jump smaller or larger.  Any camera
    // zoom remains encoded in the source pixels themselves.
    const frameWidth = Math.min(width * (mobile ? .98 : .90), variant.width, height * (mobile ? .40 : .69) * 16 / 9)
    const frameHeight = frameWidth * 9 / 16
    const x = (width - frameWidth) / 2
    const y = height * (mobile ? .48 : .57) - frameHeight / 2
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, x, y, frameWidth, frameHeight)
    callbacks.onAnchor(x + frameWidth * .59, y + frameHeight * .66)
    displayed = index
    dirty = false
    draws++
    drawMax = Math.max(drawMax, performance.now() - started)
    host.dataset.frame = String(index)
    host.dataset.progress = progress.toFixed(5)
    host.dataset.buffering = String(index !== requested)
    canvas.setAttribute('aria-label', reducedMotion
      ? 'Volkswagen Arteon static chapter view. Reduced motion is enabled; chapter navigation remains available.'
      : 'Volkswagen Arteon cinematic. Scroll forward to advance and backward to reverse.')
    evict()
  }

  async function decode(blob) {
    if ('createImageBitmap' in window) return createImageBitmap(blob)
    const url = URL.createObjectURL(blob)
    const image = new Image()
    try { image.src = url; await image.decode(); return image } finally { URL.revokeObjectURL(url) }
  }

  function pump() {
    if (disposed || !manifest || document.hidden || (callbacks.isPaused() && ready)) return
    while (requests.size < concurrency && queue.length) {
      const index = queue.shift()
      if (cache.has(index) || requests.has(index) || (failures.get(index) ?? 0) >= 3) continue
      const controller = new AbortController()
      requests.set(index, controller)
      const path = variant.path.replace('{frame}', String(index).padStart(4, '0'))
      fetch(`${base}${path}`, { signal: controller.signal, cache: 'force-cache' })
        .then((response) => { if (!response.ok) throw new Error(`Frame ${index}: ${response.status}`); return response.blob() })
        .then(async (blob) => {
          const start = performance.now()
          const bitmap = await decode(blob)
          if (disposed || controller.signal.aborted) { bitmap.close?.(); return }
          const elapsed = performance.now() - start
          decodeTotal += elapsed
          decodeMax = Math.max(decodeMax, elapsed)
          decodes++
          cache.set(index, bitmap)
          failures.delete(index)
          if (index === requested) {
            if (errorReported) callbacks.onFrameAvailable?.()
            errorReported = false
            invalidate()
          }
          if (!ready && index === requested) {
            ready = true
            callbacks.onProgress(100)
            callbacks.onReady({ vehicle: 'Volkswagen Arteon source footage', engine: 'Original cinematic engine sequence', issues: [] })
          }
          evict()
        })
        .catch((error) => {
          if (disposed || error.name === 'AbortError') return
          failures.set(index, (failures.get(index) ?? 0) + 1)
          if (index === requested) {
            if (failures.get(index) >= 3 && !errorReported) {
              errorReported = true
              callbacks.onError('This cinematic frame could not load. The last image is held; try another chapter or open your workspace.')
            } else {
              clearTimeout(retryTimer)
              retryTimer = setTimeout(plan, 350)
            }
          }
        })
        .finally(() => {
          requests.delete(index)
          if (!disposed && controller.signal.aborted && !cache.has(requested) && !requests.has(requested) && !queue.includes(requested)) queue.unshift(requested)
          pump()
        })
    }
  }

  function plan() {
    if (!manifest || disposed) return
    const desired = [requested]
    if (!reducedMotion) {
      const ahead = compact ? 10 : 16
      for (let offset = 1; offset <= ahead; offset++) {
        desired.push(requested + offset * direction)
        if (offset <= 6) desired.push(requested - offset * direction)
      }
    }
    queue = [...new Set(desired)].filter((index) => index >= 0 && index < manifest.frameCount && !cache.has(index) && !requests.has(index))
    wanted = new Set(desired.filter((index) => index >= 0 && index < manifest.frameCount))
    // Reprioritize large jumps instead of waiting for obsolete network work.
    for (const [index, controller] of requests) {
      if (!desired.includes(index)) controller.abort()
    }
    host.dataset.requestedFrame = String(requested)
    host.dataset.buffering = String(displayed !== requested)
    pump()
    invalidate()
  }

  function applyProgress(value) {
    progress = Math.max(0, Math.min(1, value))
    visualProgress = progress
    const frame = manifest?.frames?.length
      ? (() => {
        const targetTime = progress * (manifest.source?.duration ?? manifest.frames[manifest.frames.length - 1].timestamp)
        let low = 0; let high = manifest.frames.length - 1
        while (low < high) { const middle = Math.ceil((low + high) / 2); if (manifest.frames[middle].timestamp < targetTime) low = middle; else high = middle - 1 }
        return Math.min(manifest.frames.length - 1, Math.max(0, low + (manifest.frames[low]?.timestamp < targetTime ? 1 : 0)))
      })()
      : frameAtProgress(progress, manifest?.frameCount ?? deliveryFrameCount)
    const next = reducedMotion ? chapterFrames.reduce((closest, candidate) => Math.abs(candidate - frame) < Math.abs(closest - frame) ? candidate : closest, 0) : frame
    direction = next === requested ? direction : Math.sign(next - requested)
    const changed = next !== requested
    requested = next
    if (changed || displayed < 0) plan()
  }

  function animateMotion() {
    motionFrame = 0
    const projected = Math.max(0, Math.min(1, targetProgress + momentum))
    const delta = projected - visualProgress
    visualProgress += delta * (reducedMotion ? 1 : .28)
    momentum *= reducedMotion ? 0 : .84
    applyProgress(visualProgress)
    if (!reducedMotion && (Math.abs(targetProgress - visualProgress) > .00035 || Math.abs(momentum) > .00003)) motionFrame = requestAnimationFrame(animateMotion)
  }

  function seek(value) {
    const nextTarget = Math.max(0, Math.min(1, value))
    const inputDelta = nextTarget - targetProgress
    if (Math.abs(inputDelta) > .00001) {
      const nextDirection = Math.sign(inputDelta)
      if (nextDirection && nextDirection !== direction) momentum = 0
      direction = nextDirection || direction
      // A bounded tail gives the stopped scroll a soft continuation without
      // letting the cinematic drift away from the user's final position.
      momentum = Math.max(-.012, Math.min(.012, inputDelta * .32))
    }
    targetProgress = nextTarget
    if (reducedMotion) applyProgress(targetProgress)
    else if (!motionFrame) motionFrame = requestAnimationFrame(animateMotion)
  }

  const resize = new ResizeObserver(() => { dirty = true; invalidate() })
  resize.observe(host)
  const onVisibility = () => { if (!document.hidden) { plan(); invalidate() } }
  const onMotion = () => { reducedMotion = motionQuery.matches; seek(progress); dirty = true; plan() }
  const onContextLost = (event) => { event.preventDefault(); callbacks.onError('The cinematic canvas was interrupted. Your workspace remains available.') }
  const onContextRestored = () => { dirty = true; callbacks.onFrameAvailable?.(); invalidate() }
  document.addEventListener('visibilitychange', onVisibility)
  motionQuery.addEventListener('change', onMotion)
  canvas.addEventListener('contextlost', onContextLost)
  canvas.addEventListener('contextrestored', onContextRestored)

  callbacks.onProgress(10)
  fetch(`${base}manifest.json`, { signal: lifetime.signal })
    .then((response) => { if (!response.ok) throw new Error('Cinematic manifest could not load.'); return response.json() })
    .then((value) => {
      if (disposed) return
      if (value.frameCount < 480 || value.fps !== deliveryFps || value.frames?.length !== value.frameCount || !value.alpha || !value.variants?.length) throw new Error('Cinematic manifest is incompatible.')
      manifest = value
      variant = manifest.variants.find((item) => item.name === (compact ? 'mobile' : 'desktop'))
      if (!variant) throw new Error('Cinematic resolution is unavailable.')
      callbacks.onProgress(30)
      // This is the first visible frame, including restored scroll positions.
      seek(progress)
      plan()
    })
    .catch((error) => { if (!disposed && error.name !== 'AbortError') callbacks.onError(error.message) })

  return {
    update(_state, value) { seek(value) },
    setData() {},
    invalidate() { plan(); invalidate() },
    diagnostics() {
      return { ready, progress, requestedFrame: requested, displayedFrame: displayed, frames: draws, decodes, evictions,
        cachedFrames: cache.size, cacheLimit, inFlight: requests.size, queued: queue.length, variant: variant?.name,
        decodedBytes: cache.size * (variant?.width ?? 0) * (variant?.height ?? 0) * 4,
        canvasBytes: canvas.width * canvas.height * 4, decodeMeanMs: decodes ? decodeTotal / decodes : 0, decodeMaxMs: decodeMax, drawMaxMs: drawMax,
        reducedMotion, frameCount: manifest?.frameCount, sourceTime: manifest?.frames?.[displayed]?.timestamp ?? displayed / (manifest?.fps ?? deliveryFps), targetProgress, visualProgress, momentum, buffering: requested !== displayed }
    },
    destroy() {
      disposed = true
      lifetime.abort()
      requests.forEach((controller) => controller.abort())
      cache.forEach((bitmap) => bitmap.close?.())
      cache.clear()
      queue = []
      cancelAnimationFrame(scheduled)
      cancelAnimationFrame(motionFrame)
      clearTimeout(retryTimer)
      resize.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onMotion)
      canvas.removeEventListener('contextlost', onContextLost)
      canvas.removeEventListener('contextrestored', onContextRestored)
      delete host.getDiagnostics
      canvas.remove()
    }
  }
}
