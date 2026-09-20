import { clamp } from './arteonTimeline.js'

// Source time is the only clock; reverse scrolling exactly unwinds the formations.
export function createCinematicParticles(host) {
  const canvas = document.createElement('canvas')
  canvas.className = 'cinematic-particles'
  canvas.setAttribute('aria-hidden', 'true')
  const context = canvas.getContext('2d', { alpha: true, desynchronized: true })
  host.parentElement.append(canvas)
  let width = 0, height = 0, dirty = true, visible = false, maxDrawMs = 0, disabled = false
  const compact = matchMedia('(max-width: 720px)').matches || navigator.connection?.saveData || (navigator.deviceMemory || 8) <= 4
  const count = compact ? 0 : 64
  const observer = new ResizeObserver(() => { dirty = true })
  observer.observe(host.parentElement)
  function draw(entry, reduced) {
    const active = Boolean(context && count && !reduced && !disabled && entry.clip === 'clip3')
    if (!active && !visible && !dirty) return
    const start = performance.now()
    if (dirty) {
      width = host.parentElement.clientWidth; height = host.parentElement.clientHeight
      canvas.width = width; canvas.height = height
      dirty = false
    }
    context?.clearRect(0, 0, width, height)
    visible = active
    if (!active) return
    const t = entry.timestamp
    const opacity = clamp((t - .65) / 1.2) * .42
    // Keep the central 90% clear, including the exploded components.
    for (let i = 0; i < count; i++) {
      const seed = ((i * 73) % 127) / 127
      const x = (i % 2 ? .97 : .03) * width + Math.sin(seed * 8 + t * .45) * width * .016
      const y = height * (.35 + seed * .34) + Math.sin(seed * 12 - t * .35) * 19
      context.fillStyle = i % 3 ? `rgba(41,44,46,${opacity})` : `rgba(231,230,226,${opacity * .85})`
      context.beginPath(); context.arc(x, y, .45 + seed * .8, 0, Math.PI * 2); context.fill()
    }
    maxDrawMs = Math.max(maxDrawMs, performance.now() - start)
    if (performance.now() - start > 4) { disabled = true; context.clearRect(0, 0, width, height) }
  }
  return { draw, diagnostics: () => ({ particleCount: disabled ? 0 : count, particleDrawMaxMs: maxDrawMs, particlesDisabledForPerformance: disabled }), destroy() { observer.disconnect(); canvas.remove() } }
}
