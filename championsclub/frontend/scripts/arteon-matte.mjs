import sharp from 'sharp'

const clamp = (value) => Math.max(0, Math.min(1, value))
const smooth = (a, b, value) => { const t = clamp((value - a) / Math.max(1e-6, b - a)); return t * t * (3 - 2 * t) }
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

function sampleBackground(rgb, width, height) {
  const samples = []
  const push = (x, y) => { const p = (y * width + x) * 3; samples.push([rgb[p], rgb[p + 1], rgb[p + 2]]) }
  for (let x = 0; x < width; x += 8) { push(x, 0); push(x, 1); push(x, height - 2); push(x, height - 1) }
  for (let y = 0; y < height; y += 8) { push(0, y); push(1, y); push(width - 2, y); push(width - 1, y) }
  const bright = samples.filter(([r, g, b]) => r > 175 && g > 175 && b > 175)
  if (bright.length < 20) return null
  const clusters = []
  for (const sample of bright) {
    const cluster = clusters.find((item) => distance(item.center, sample) < 35)
    if (!cluster) clusters.push({ center: [...sample], count: 1 })
    else { cluster.center = cluster.center.map((value, index) => (value * cluster.count + sample[index]) / (cluster.count + 1)); cluster.count++ }
  }
  clusters.sort((a, b) => b.count - a.count)
  return clusters.length > 1 ? [clusters[0].center, clusters[1].center] : [clusters[0].center, clusters[0].center]
}

function isBackgroundPixel(rgb, p, colors) {
  const color = [rgb[p], rgb[p + 1], rgb[p + 2]]
  const nearest = Math.min(distance(color, colors[0]), distance(color, colors[1]))
  const neutral = Math.max(color[0], color[1], color[2]) - Math.min(color[0], color[1], color[2]) < 24
  return neutral && nearest < 76
}

function growBackground(rgb, width, height, colors) {
  const total = width * height
  const background = new Uint8Array(total)
  const queue = new Int32Array(total)
  let head = 0; let tail = 0
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x
    if (x < 3 || y < 3 || x >= width - 3 || y >= height - 3) {
      if (isBackgroundPixel(rgb, p * 3, colors)) { background[p] = 1; queue[tail++] = p }
    }
  }
  while (head < tail) {
    const p = queue[head++]; const x = p % width
    for (const next of [p - 1, p + 1, p - width, p + width]) {
      if (next < 0 || next >= total || background[next]) continue
      const nx = next % width
      if (Math.abs(nx - x) > 1 || !isBackgroundPixel(rgb, next * 3, colors)) continue
      background[next] = 1; queue[tail++] = next
    }
  }
  return background
}

export async function matteFrame(rgb, width, height, time = 0) {
  const rgba = Buffer.alloc(width * height * 4)
  const colors = sampleBackground(rgb, width, height)
  const background = colors ? growBackground(rgb, width, height, colors) : new Uint8Array(width * height)
  for (let p = 0; p < width * height; p++) {
    const source = p * 3; const r = rgb[source]; const g = rgb[source + 1]; const b = rgb[source + 2]
    const color = [r, g, b]
    const nearest = colors ? Math.min(distance(color, colors[0]), distance(color, colors[1])) : 255
    let alpha = background[p] ? 0 : 1
    const y = Math.floor(p / width)
    const exterior = time < 5.2 || time > 8.4
    if (alpha && exterior && y > height * .70 && Math.min(r, g, b) > 35 && Math.max(r, g, b) - Math.min(r, g, b) < 34) {
      alpha *= 1 - smooth(height * .70, height * .88, y)
    }
    if (alpha && exterior && y > height * .89) alpha = 0
    if (alpha && nearest < 92 && Math.max(r, g, b) > 165) alpha = smooth(45, 92, nearest)
    const out = p * 4; rgba[out] = r; rgba[out + 1] = g; rgba[out + 2] = b; rgba[out + 3] = Math.round(alpha * 255)
  }
  const source = sharp(rgba, { raw: { width, height, channels: 4 } })
  const alpha = await source.clone().extractChannel(3).median(3).blur(.45).raw().toBuffer()
  for (let p = 0; p < width * height; p++) rgba[p * 4 + 3] = alpha[p]
  return sharp(rgba, { raw: { width, height, channels: 4 } })
}
