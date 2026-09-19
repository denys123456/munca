import sharp from 'sharp'

const clamp = (value) => Math.max(0, Math.min(1, value))
const smooth = (a, b, value) => { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t) }
const basis = (x, y) => [1, x, y, x * x, x * y, y * y, x ** 4, y ** 4, x * x * y * y]

function solve(matrix, vector) {
  const n = vector.length
  const rows = matrix.map((row, i) => [...row, vector[i]])
  for (let i = 0; i < n; i++) {
    let pivot = i
    for (let j = i + 1; j < n; j++) if (Math.abs(rows[j][i]) > Math.abs(rows[pivot][i])) pivot = j
    ;[rows[i], rows[pivot]] = [rows[pivot], rows[i]]
    const scale = rows[i][i] || 1e-8
    for (let k = i; k <= n; k++) rows[i][k] /= scale
    for (let j = 0; j < n; j++) {
      if (j === i) continue
      const factor = rows[j][i]
      for (let k = i; k <= n; k++) rows[j][k] -= factor * rows[i][k]
    }
  }
  return rows.map((row) => row[n])
}

// The engine has a neutral blue-gray gradient plate. Fit that plate only from
// flat, bright background patches; never key the car by luminance.
function fitPlate(rgb, width, height, transition) {
  let samples = []
  for (let y = 8; y < height - 8; y += 12) for (let x = 8; x < width - 8; x += 12) {
    const values = [[], [], []]
    for (const dy of [-3, 0, 3]) for (const dx of [-3, 0, 3]) {
      const p = ((y + dy) * width + x + dx) * 3
      for (let c = 0; c < 3; c++) values[c].push(rgb[p + c])
    }
    const means = values.map((v) => v.reduce((a, b) => a + b, 0) / v.length)
    const variation = Math.max(...values.map((v) => Math.max(...v) - Math.min(...v)))
    if (variation < 5 && means[0] > (transition ? 65 : 125) && means[2] - means[0] > 3 && means[2] - means[0] < (transition ? 90 : 33) && means[1] > means[0]) {
      samples.push({ b: basis(x / width * 2 - 1, y / height * 2 - 1), color: means })
    }
  }
  if (samples.length < 40) return null
  let coefficients
  for (let pass = 0; pass < 4; pass++) {
    const matrix = Array.from({ length: 9 }, () => Array(9).fill(0))
    const vectors = Array.from({ length: 3 }, () => Array(9).fill(0))
    for (const sample of samples) for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) matrix[i][j] += sample.b[i] * sample.b[j]
      for (let c = 0; c < 3; c++) vectors[c][i] += sample.b[i] * sample.color[c]
    }
    coefficients = vectors.map((vector) => solve(matrix, vector))
    samples = samples.filter((s) => Math.abs(s.color[0] - coefficients[0].reduce((sum, v, i) => sum + v * s.b[i], 0)) < 9)
    if (samples.length < 40) break
  }
  return coefficients
}

export async function matteFrame(rgb, width, height, time) {
  const rgba = Buffer.alloc(width * height * 4)
  const grayWeight = smooth(6.125, 6.5, time) * (1 - smooth(7.833333, 7.916667, time))
  const plate = grayWeight > 0 ? fitPlate(rgb, width, height, time > 7.8) : null
  const returnDissolve = time >= 7.875 && time < 8.375
  const corner = (20 * width + width - 20) * 3
  const cornerGreen = (rgb[corner + 1] - Math.max(rgb[corner], rgb[corner + 2])) / Math.max(1, rgb[corner + 1])
  const keyHigh = returnDissolve ? Math.max(.045, cornerGreen * .8) : .46
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x
    let [r, g, b] = rgb.subarray(p * 3, p * 3 + 3)
    const green = (g - Math.max(r, b)) / Math.max(g, 1)
    let alpha = 1 - smooth(returnDissolve ? keyHigh * .25 : .16, keyHigh, green) * smooth(returnDissolve ? 2 : 10, returnDissolve ? 12 : 40, g - Math.max(r, b))
    const darkProtection = (1 - smooth(65, 95, Math.max(r, b))) * (1 - smooth(.4, .54, green))
    alpha = Math.max(alpha, darkProtection)
    if (plate) {
      const terms = basis(x / width * 2 - 1, y / height * 2 - 1)
      const background = plate.map((co) => co.reduce((sum, v, i) => sum + v * terms[i], 0))
      const difference = Math.max(Math.abs(r - background[0]), Math.abs(g - background[1]), Math.abs(b - background[2]))
      const grayAlpha = smooth(4, 14, difference)
      alpha *= 1 - grayWeight * (1 - grayAlpha)
      if (grayWeight === 1 && grayAlpha > .02 && grayAlpha < 1) {
        // Refine edge luminance without amplifying tiny compressed chroma
        // differences into colored ringing around neutral metal.
        const luminance = (r + g + b) / 3
        const plateLuminance = background.reduce((sum, value) => sum + value, 0) / 3
        const refined = Math.max(0, Math.min(255, (luminance - plateLuminance * (1 - grayAlpha)) / grayAlpha))
        r = Math.max(0, refined + r - luminance)
        g = Math.max(0, refined + g - luminance)
        b = Math.max(0, refined + b - luminance)
      }
    }
    // Remove spill from both partially covered edges and opaque reflections.
    // Red/blue detail and the original opaque black surfaces are retained.
    g = Math.min(g, Math.max(r, b))
    rgba[p * 4] = Math.min(255, r)
    rgba[p * 4 + 1] = Math.min(255, g)
    rgba[p * 4 + 2] = Math.min(255, b)
    rgba[p * 4 + 3] = Math.round(alpha * 255)
  }
  const source = sharp(rgba, { raw: { width, height, channels: 4 } })
  // A subpixel alpha refinement suppresses 4:2:0 chroma stair-steps without
  // blurring the original bodywork, chrome or engine RGB detail.
  const alpha = await source.clone().extractChannel(3).median(3).blur(.6).raw().toBuffer()
  for (let p = 0; p < width * height; p++) rgba[p * 4 + 3] = alpha[p]
  return sharp(rgba, { raw: { width, height, channels: 4 } })
}
