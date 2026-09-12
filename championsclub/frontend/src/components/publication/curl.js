const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const dot = (point, normal, midpoint) => (point.x - midpoint.x) * normal.x + (point.y - midpoint.y) * normal.y

function halfPlane(polygon, normal, midpoint, sign) {
  const output = []
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index]
    const b = polygon[(index + 1) % polygon.length]
    const da = dot(a, normal, midpoint) * sign
    const db = dot(b, normal, midpoint) * sign
    if (da >= 0) output.push(a)
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db)
      output.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  return output
}

export function foldGeometry(width, height, pointer) {
  const corner = { x: width, y: height }
  const distance = Math.hypot(corner.x - pointer.x, corner.y - pointer.y)
  if (distance < .5) return null
  const normal = { x: (corner.x - pointer.x) / distance, y: (corner.y - pointer.y) / distance }
  const midpoint = { x: (corner.x + pointer.x) / 2, y: (corner.y + pointer.y) / 2 }
  const rectangle = [{ x: 0, y: 0 }, { x: width, y: 0 }, corner, { x: 0, y: height }]
  const stationary = halfPlane(rectangle, normal, midpoint, -1)
  const folded = halfPlane(rectangle, normal, midpoint, 1)
  const underside = folded.map((point) => {
    const offset = 2 * dot(point, normal, midpoint)
    return { x: point.x - offset * normal.x, y: point.y - offset * normal.y }
  })
  const crease = folded.filter((point) => Math.abs(dot(point, normal, midpoint)) < .1)
  const progress = clamp(distance / (2 * Math.hypot(width, height)), 0, 1)
  return { stationary, underside, crease, normal, midpoint, progress, corner: pointer }
}

const path = (points) => points.length ? `M${points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('L')}Z` : 'M0,0Z'

export function createCurl({ root, svg, onComplete, onCancel }) {
  let front = null
  let frame = 0
  let disposed = false
  let animation = null
  let width = root.clientWidth
  let height = root.clientHeight
  let pointer = { x: width, y: height }
  let dirty = false
  const face = svg.querySelector('[data-fold-face]')
  const shadow = svg.querySelector('[data-fold-shadow]')
  const creaseLine = svg.querySelector('[data-fold-crease]')
  const creaseLight = svg.querySelector('[data-fold-light]')
  const gradient = svg.querySelector('[data-fold-gradient]')
  const preference = matchMedia('(prefers-reduced-motion: reduce)')

  function paint() {
    dirty = false
    const geometry = foldGeometry(width, height, pointer)
    const progress = geometry?.progress ?? 0
    root.style.setProperty('--curl-progress', progress)
    root.dataset.curlProgress = progress.toFixed(4)
    root.dataset.cornerX = pointer.x.toFixed(1)
    root.dataset.cornerY = pointer.y.toFixed(1)
    if (!front || !geometry || progress >= .9995) {
      if (front) front.style.clipPath = progress >= .9995 ? 'polygon(0 0, 0 0, 0 0)' : 'none'
      svg.style.visibility = 'hidden'
      return
    }
    svg.style.visibility = 'visible'
    const { stationary, underside, crease, normal, midpoint } = geometry
    front.style.clipPath = stationary.length ? `polygon(${stationary.map((point) => `${point.x.toFixed(2)}px ${point.y.toFixed(2)}px`).join(',')})` : 'polygon(0 0, 0 0, 0 0)'
    const bendDepth = Math.sin(progress * Math.PI) * Math.min(width, height) * .055
    const facePath = underside.length ? `M${underside[0].x},${underside[0].y}${underside.slice(1).map((point, index) => {
      const previous = underside[index]
      const edgeAtCrease = Math.abs(dot(point, normal, midpoint)) < .1 && Math.abs(dot(previous, normal, midpoint)) < .1
      if (edgeAtCrease) return `L${point.x},${point.y}`
      return `Q${(point.x + previous.x) / 2 - normal.x * bendDepth},${(point.y + previous.y) / 2 - normal.y * bendDepth} ${point.x},${point.y}`
    }).join('')}Z` : path(underside)
    face.setAttribute('d', facePath)
    shadow.setAttribute('d', facePath)
    const lift = Math.sin(Math.min(1, progress * 1.8) * Math.PI * .85)
    shadow.setAttribute('transform', `translate(${normal.x * (3 + 12 * lift)}, ${normal.y * (3 + 12 * lift)})`)
    shadow.style.opacity = String(.07 + lift * .10)
    const bend = 26 + 110 * Math.sin(progress * Math.PI)
    gradient.setAttribute('x1', midpoint.x - normal.x * bend)
    gradient.setAttribute('y1', midpoint.y - normal.y * bend)
    gradient.setAttribute('x2', midpoint.x + normal.x * 5)
    gradient.setAttribute('y2', midpoint.y + normal.y * 5)
    const line = crease.length >= 2 ? `M${crease[0].x},${crease[0].y}L${crease[1].x},${crease[1].y}` : ''
    creaseLine.setAttribute('d', line)
    creaseLight.setAttribute('d', line)
    creaseLine.style.strokeWidth = String(1 + lift * 3)
    root.dataset.foldVertices = String(underside.length)
  }

  function tick(time) {
    frame = 0
    if (disposed) return
    if (animation) {
      if (animation.started === null) animation.started = time
      const t = clamp((time - animation.started) / animation.duration, 0, 1)
      const eased = t * t * (3 - 2 * t)
      pointer = { x: animation.from.x + (animation.to.x - animation.from.x) * eased, y: animation.from.y + (animation.to.y - animation.from.y) * eased }
      dirty = true
      if (t === 1) {
        const done = animation.done
        animation = null
        paint()
        done?.()
        return
      }
    }
    if (dirty) paint()
    if (animation) frame = requestAnimationFrame(tick)
  }

  function schedule() { if (!frame) frame = requestAnimationFrame(tick) }

  function setProgress(progress, immediate = false) {
    animation = null
    pointer = { x: width * (1 - progress * 2), y: height * (1 - progress * 2) }
    dirty = true
    if (immediate) paint()
    else schedule()
  }

  function animate(to, done, duration) {
    animation = { from: { ...pointer }, to, done, started: null, duration: preference.matches ? 1 : duration }
    schedule()
  }

  function resize() {
    const scaleX = root.clientWidth / width
    const scaleY = root.clientHeight / height
    width = root.clientWidth
    height = root.clientHeight
    pointer = { x: pointer.x * scaleX, y: pointer.y * scaleY }
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    if (animation) {
      animation.from = { x: animation.from.x * scaleX, y: animation.from.y * scaleY }
      animation.to = { x: animation.to.x * scaleX, y: animation.to.y * scaleY }
    }
    paint()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(root)

  return {
    connect(element) { front?.style.removeProperty('clip-path'); front = element; resize() },
    setProgress,
    follow(x, y) {
      animation = null
      pointer = { x: clamp(x, -width, width - .1), y: clamp(y, -height, height - .1) }
      dirty = true
      schedule()
    },
    finish(backward = false, duration = 700) { animate(backward ? { x: width, y: height } : { x: -width, y: -height }, onComplete, duration) },
    cancel() { animate({ x: width, y: height }, onCancel, 360) },
    lift() { animate({ x: width - 44, y: height - 38 }, null, 220) },
    get progress() { return clamp(Math.hypot(width - pointer.x, height - pointer.y) / (2 * Math.hypot(width, height)), 0, 1) },
    reset() { animation = null; cancelAnimationFrame(frame); frame = 0; front?.style.removeProperty('clip-path'); pointer = { x: width, y: height }; paint() },
    destroy() { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); front?.style.removeProperty('clip-path') }
  }
}
