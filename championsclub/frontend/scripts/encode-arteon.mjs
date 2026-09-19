import sharp from 'sharp'

function hasGreenSpill(data) {
  for (let p = 0; p < data.length; p += 4) {
    if (data[p + 3] > 80 && data[p + 1] > Math.max(data[p], data[p + 2]) + 10) return true
  }
  return false
}

export async function encodeArteon(frame, variant) {
  const { data, info } = await frame.clone().resize(variant.width, variant.height).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  // Lanczos can overshoot color at alpha edges after downsampling. Despill
  // again at the actual delivery resolution, before compression.
  for (let p = 0; p < data.length; p += 4) data[p + 1] = Math.min(data[p + 1], Math.max(data[p], data[p + 2]))
  const image = sharp(data, { raw: info })
  let encoded = await image.clone().webp({ quality: variant.quality, alphaQuality: 100, effort: 5 }).toBuffer()
  // Most frames use small lossy RGB + lossless alpha. If the codec introduces
  // visible chroma ringing, use near-lossless RGB only for that frame.
  if (hasGreenSpill(await sharp(encoded).ensureAlpha().raw().toBuffer())) {
    encoded = await image.clone().webp({ nearLossless: true, quality: 70, alphaQuality: 100, effort: 5 }).toBuffer()
    if (hasGreenSpill(await sharp(encoded).ensureAlpha().raw().toBuffer())) encoded = await image.clone().webp({ lossless: true, effort: 5 }).toBuffer()
  }
  return encoded
}
