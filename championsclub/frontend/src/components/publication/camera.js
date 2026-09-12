export const teamStops = [
  { x: 0, y: 0, label: 'The collective' },
  { x: 1.08, y: 0, label: 'Sales booked' },
  { x: 2.16, y: .16, label: 'Target achievement' },
  { x: 1.08, y: 1.18, label: 'Performance trajectory' },
  { x: 0, y: 1.18, label: 'The longer view' },
  { x: 0, y: 2.36, label: 'Contribution mix' },
  { x: 1.08, y: 2.36, label: 'The people' },
  { x: 2.16, y: 2.36, label: 'Projected finish' },
  { x: 2.16, y: 3.54, label: 'Champions Intelligence' },
  { x: 1.08, y: 3.54, label: 'The conclusion' },
  { x: 0, y: 3.54, label: 'The next chapter' }
]

export function cameraPosition(stops, progress) {
  const position = Math.max(0, Math.min(1, progress)) * (stops.length - 1)
  const index = Math.min(stops.length - 2, Math.floor(position))
  const fraction = position - index
  const eased = fraction * fraction * (3 - 2 * fraction)
  const from = stops[index]
  const to = stops[index + 1]
  return { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased }
}

export function createCamera({ viewport, canvas, stops, distance = 8.8, initial = 0, onEdge, onProgress }) {
  let current = initial
  let target = initial
  let frame = 0
  let previousTime = 0
  let width = viewport.clientWidth
  let height = viewport.clientHeight
  let edge = null
  let disposed = false
  const scenes = [...canvas.querySelectorAll('[data-scene]')]
  const preference = matchMedia('(prefers-reduced-motion: reduce)')
  canvas.style.setProperty('--view-w', `${width}px`)
  canvas.style.setProperty('--view-h', `${height}px`)

  function draw() {
    const point = cameraPosition(stops, current)
    canvas.style.transform = `translate3d(${-point.x * width}px, ${-point.y * height}px, 0)`
    viewport.dataset.cameraX = point.x.toFixed(4)
    viewport.dataset.cameraY = point.y.toFixed(4)
    viewport.dataset.progress = current.toFixed(5)
    const nextEdge = current >= .9998 ? 'end' : current <= .0002 ? 'start' : 'inside'
    if (nextEdge !== edge) { edge = nextEdge; onEdge?.(nextEdge) }
    const stop = Math.round(current * (stops.length - 1))
    scenes.forEach((scene) => {
      const position = current * (stops.length - 1)
      const visible = position > Number(scene.dataset.scene) - .8 && position < Number(scene.dataset.sceneEnd ?? scene.dataset.scene) + .8
      if (scene.inert === visible) scene.inert = !visible
    })
    onProgress?.(current, stops[stop].label, stop)
  }

  function tick(time) {
    frame = 0
    if (disposed) return
    const elapsed = previousTime ? Math.min(48, time - previousTime) : 16
    previousTime = time
    current += (target - current) * (1 - Math.exp(-elapsed / 58))
    if (Math.abs(target - current) < .000015) current = target
    draw()
    if (current !== target) frame = requestAnimationFrame(tick)
    else previousTime = 0
  }

  function seek(value, immediate = false) {
    target = Math.max(0, Math.min(1, value))
    if (immediate || preference.matches) {
      cancelAnimationFrame(frame)
      frame = 0
      previousTime = 0
      current = target
      draw()
    } else if (!frame) frame = requestAnimationFrame(tick)
  }

  const resize = new ResizeObserver(() => {
    width = viewport.clientWidth
    height = viewport.clientHeight
    canvas.style.setProperty('--view-w', `${width}px`)
    canvas.style.setProperty('--view-h', `${height}px`)
    draw()
  })
  resize.observe(viewport)
  draw()

  return {
    advance(delta) {
      const intent = Math.max(-240, Math.min(240, delta)) / Math.max(4200, height * distance)
      seek(Math.max(current - .08, Math.min(current + .08, target + intent)))
    },
    seek,
    stop() { target = current; cancelAnimationFrame(frame); frame = 0; previousTime = 0 },
    get position() { return current },
    get atEnd() { return current >= .9998 },
    get atStart() { return current <= .0002 },
    destroy() { disposed = true; cancelAnimationFrame(frame); resize.disconnect() }
  }
}
