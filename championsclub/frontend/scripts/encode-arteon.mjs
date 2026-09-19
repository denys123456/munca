import sharp from 'sharp'

function hasGreenSpill(data) {
  for (let p = 0; p < data.length; p += 4) {
    // Allow the small <=12-level chroma excursion introduced by lossy WebP;
    // the production audit uses the same perceptual threshold.  The previous
    // threshold forced near-lossless output for most frames and inflated the
    // transfer payload without removing visible spill.
    if (data[p + 3] > 80 && data[p + 1] > Math.max(data[p], data[p + 2]) + 12) return true
  }
  return false
}

async function reencodeClean(encoded, quality) {
  const decoded = await sharp(encoded).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let p = 0; p < decoded.data.length; p += 4) {
    decoded.data[p + 1] = Math.min(decoded.data[p + 1], Math.max(decoded.data[p], decoded.data[p + 2]))
    const alpha = decoded.data[p + 3] / 255
    if (alpha < 1) {
      decoded.data[p] = Math.round(decoded.data[p] * alpha)
      decoded.data[p + 1] = Math.round(decoded.data[p + 1] * alpha)
      decoded.data[p + 2] = Math.round(decoded.data[p + 2] * alpha)
    }
  }
  return sharp(decoded.data, { raw: decoded.info }).avif({ quality, effort: 5, chromaSubsampling: '4:4:4' }).toBuffer()
}

export async function encodeArteon(frame, variant) {
  const { data, info } = await frame.clone().resize(variant.width, variant.height).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  // Lanczos can overshoot color at alpha edges after downsampling. Despill
  // again at the actual delivery resolution, before compression.
  for (let p = 0; p < data.length; p += 4) {
    data[p + 1] = Math.min(data[p + 1], Math.max(data[p], data[p + 2]))
    // Encode transparent edges premultiplied. AVIF's YUV conversion otherwise
    // pulls green RGB from fully transparent pixels back into the visible rim.
    const alpha = data[p + 3] / 255
    if (alpha < 1) {
      data[p] = Math.round(data[p] * alpha)
      data[p + 1] = Math.round(data[p + 1] * alpha)
      data[p + 2] = Math.round(data[p + 2] * alpha)
    }
  }
  const image = sharp(data, { raw: info })
  let encoded = await image.clone().avif({ quality: variant.quality, effort: 5, chromaSubsampling: '4:4:4' }).toBuffer()
  // A second pass operates on the codec's reconstructed pixels, removing any
  // tiny YUV conversion fringe that was not present in the keyed source.
  encoded = await reencodeClean(encoded, variant.quality)
  // AVIF keeps the alpha plane separate and substantially reduces the payload
  // for the high-density engine frames while retaining clean edges.
  if (hasGreenSpill(await sharp(encoded).ensureAlpha().raw().toBuffer())) {
    encoded = await reencodeClean(await image.clone().avif({ quality: Math.min(80, variant.quality + 8), effort: 5, chromaSubsampling: '4:4:4' }).toBuffer(), Math.min(80, variant.quality + 8))
  }
  return encoded
}
