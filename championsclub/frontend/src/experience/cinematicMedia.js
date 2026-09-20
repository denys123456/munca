const base = `${import.meta.env.BASE_URL}media/cinematic/`

// Opaque video decoding, one seek per player, one latest target, bounded image cache.
// Decoded boundary images are also the compatibility/network fallback.
export function createCinematicMedia(host, timeline, callbacks) {
  const cache = new Map(), players = new Map(), jobs = new Map(), pinned = new Set()
  const cacheLimit = 12
  let disposed = false, target, urgent, preloadQueue = [], imageJobs = 0
  let decodes = 0, seeks = 0, stale = 0, errors = 0, cacheHits = 0
  const seekTimes = [], imageTimes = []
  const keyOf = entry => `${entry.clip}:${entry.index}`

  function emit(entry, visual, method) {
    if (disposed || target?.key !== entry.key) { stale++; return }
    callbacks.onFrame(entry, visual, method)
  }
  function evict() {
    for (const [key, image] of cache) {
      if (cache.size <= cacheLimit) break
      if (key === target?.key || pinned.has(key)) continue
      image.close?.(); cache.delete(key)
    }
  }
  function imageFrame(entry, priority = false) {
    const key = keyOf(entry)
    if (cache.has(key)) return Promise.resolve(cache.get(key))
    if (jobs.has(key)) return jobs.get(key).promise
    const controller = new AbortController()
    if (priority) {
      if (urgent && urgent.key !== key && !pinned.has(urgent.key)) urgent.controller.abort()
      urgent = { key, controller }
    }
    const started = performance.now()
    const promise = fetch(base + entry.asset, { signal: controller.signal, cache: 'force-cache' })
      .then(response => { if (!response.ok) throw new Error(`Cinematic frame HTTP ${response.status}`); return response.blob() })
      .then(async blob => {
        let image
        if (typeof createImageBitmap === 'function') image = await createImageBitmap(blob)
        else {
          const url = URL.createObjectURL(blob)
          image = new Image()
          try { image.src = url; await image.decode() } finally { URL.revokeObjectURL(url) }
        }
        if (disposed || controller.signal.aborted) { image.close?.(); return null }
        cache.set(key, image); decodes++
        imageTimes.push(performance.now() - started)
        if (imageTimes.length > 256) imageTimes.shift()
        evict()
        return image
      })
      .finally(() => { jobs.delete(key); if (urgent?.key === key) urgent = null })
    jobs.set(key, { promise, controller })
    return promise
  }
  function fallback(entry) {
    imageFrame(entry, true).then(image => { if (image) emit(entry, image, 'image-fallback') }).catch(error => {
      if (disposed || error.name === 'AbortError' || target?.key !== entry.key) return
      errors++; callbacks.onError('This scene could not load. Your last complete image is held. You can retry by scrolling or open your workspace.')
    })
  }
  function createPlayer(clipId) {
    if (players.has(clipId)) return players.get(clipId)
    const video = document.createElement('video')
    const player = { video, loaded: false, busy: false, failed: false, last: -1, wanted: null, callback: 0, timer: 0 }
    players.set(clipId, player)
    video.className = 'cinematic-decoder'
    video.muted = true; video.playsInline = true; video.preload = 'auto'
    video.setAttribute('aria-hidden', 'true'); video.tabIndex = -1
    host.append(video)
    video.addEventListener('loadeddata', () => { player.loaded = true; pump(player) })
    video.addEventListener('error', () => fail(player))
    video.src = base + timeline.clips[clipId].video
    return player
  }
  function fail(player) {
    if (disposed || player.failed) return
    player.failed = true; player.busy = false
    clearTimeout(player.timer)
    if (player.callback) player.video.cancelVideoFrameCallback?.(player.callback)
    player.video.pause()
    if (player.wanted && target?.clip === player.wanted.clip) fallback(target)
  }
  function pump(player) {
    if (disposed || player.failed || !player.loaded || player.busy || !player.wanted || callbacks.isPaused()) return
    const entry = player.wanted
    if (target?.key !== entry.key) return
    if (player.last === entry.index) { emit(entry, player.video, 'video'); return }
    player.busy = true
    const start = performance.now()
    const complete = actualTime => {
      clearTimeout(player.timer); player.callback = 0; player.busy = false
      if (disposed || player.failed) return
      if (Math.abs(actualTime - entry.timestamp) <= .002) {
        player.last = entry.index; seeks++
        seekTimes.push(performance.now() - start)
        if (seekTimes.length > 256) seekTimes.shift()
        emit(entry, player.video, 'video')
      } else {
        // Never expose a decoder's stale/incorrect frame.
        stale++; player.last = -1
        if (target?.key === entry.key) fallback(entry)
      }
      if (player.wanted?.key !== entry.key) pump(player)
    }
    player.callback = player.video.requestVideoFrameCallback((_now, metadata) => complete(metadata.mediaTime))
    player.timer = setTimeout(() => fail(player), 900)
    player.video.currentTime = entry.timestamp + Math.min(.001, entry.duration * .1)
  }
  function request(entry, reduced = false) {
    target = entry
    if (cache.has(entry.key)) { cacheHits++; emit(entry, cache.get(entry.key), 'cached-image'); return }
    if (reduced || !('requestVideoFrameCallback' in HTMLVideoElement.prototype)) { fallback(entry); return }
    const player = createPlayer(entry.clip)
    player.wanted = entry
    if (player.failed) fallback(entry)
    else {
      pump(player)
      // A new clip must not wait on a slow video download to produce its target.
      if (!player.loaded) fallback(entry)
    }
  }
  function pumpImages() {
    if (disposed || callbacks.isPaused()) return
    while (imageJobs < 2 && preloadQueue.length) {
      const entry = preloadQueue.shift()
      if (cache.has(keyOf(entry))) continue
      imageJobs++
      imageFrame(entry).catch(() => {}).finally(() => { imageJobs--; pumpImages() })
    }
  }
  function preload(reduced) {
    if (reduced) return
    const boundaries = timeline.segments.flatMap(segment => [timeline.entries[segment.first], timeline.entries[segment.last]])
    preloadQueue = [...new Map(boundaries.map(entry => [entry.key, entry])).values()]
    // Six unique clip endpoints, plus the adjacent reversal frame.
    for (const entry of preloadQueue) pinned.add(entry.key)
    pumpImages()
  }
  function nearby(entry, direction) {
    const future = timeline.atTime(entry.time + direction * 1.5)
    if (future.clip !== entry.clip && 'requestVideoFrameCallback' in HTMLVideoElement.prototype) createPlayer(future.clip)
  }
  const statistics = values => {
    const sorted = [...values].sort((a, b) => a - b)
    return { count: values.length, mean: values.reduce((sum, n) => sum + n, 0) / (values.length || 1), p95: sorted[Math.floor(sorted.length * .95)] || 0, max: sorted.at(-1) || 0 }
  }
  return {
    request, preload, nearby,
    diagnostics() { return { cachedFrames: cache.size, cacheLimit, decodedBytes: cache.size * 1280 * 720 * 4, inFlight: jobs.size, videoPlayers: players.size, videoSeeks: seeks, staleCompletionsRejected: stale, decodes, cacheHits, mediaErrors: errors, seekLatencyMs: statistics(seekTimes), imageLoadDecodeMs: statistics(imageTimes), fallbackPlayers: [...players.values()].filter(p => p.failed).length } },
    destroy() {
      disposed = true
      for (const { controller } of jobs.values()) controller.abort()
      for (const image of cache.values()) image.close?.()
      cache.clear(); jobs.clear(); preloadQueue = []
      for (const player of players.values()) {
        clearTimeout(player.timer)
        if (player.callback) player.video.cancelVideoFrameCallback?.(player.callback)
        player.video.pause(); player.video.removeAttribute('src'); player.video.load(); player.video.remove()
      }
      players.clear()
    }
  }
}
