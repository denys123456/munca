export function initialQuality() {
  const mobile = window.innerWidth < 720
  const constrained = (navigator.hardwareConcurrency ?? 8) <= 4 || (navigator.deviceMemory ?? 8) <= 4
  return { pixelRatio: Math.min(window.devicePixelRatio || 1, mobile || constrained ? 1.15 : 1.65), shadows: !mobile && !constrained, tier: mobile || constrained ? 'balanced' : 'high' }
}

export function createPerformanceController(renderer, lighting, quality) {
  let samples = []
  let last = 0
  let cooldown = 0
  let frameCount = 0
  let average = 0
  return {
    measure(time, moving) {
      frameCount += 1
      if (moving && last && time - last < 150) samples.push(time - last)
      last = moving ? time : 0
      if (samples.length < 50) return
      average = samples.reduce((total, value) => total + value, 0) / samples.length
      samples = []
      if (average > 24 && time > cooldown && quality.pixelRatio > .8) {
        quality.pixelRatio = Math.max(.8, quality.pixelRatio - .25)
        quality.tier = 'adaptive'
        renderer.setPixelRatio(quality.pixelRatio)
        lighting.reduce()
        cooldown = time + 4000
      }
    },
    snapshot() {
      return { tier: quality.tier, pixelRatio: quality.pixelRatio, frames: frameCount, frameTime: Number(average.toFixed(2)), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }
    }
  }
}
