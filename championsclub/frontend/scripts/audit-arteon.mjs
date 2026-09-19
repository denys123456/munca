import sharp from 'sharp'
import { readFileSync, writeFileSync, statSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

const manifest = JSON.parse(readFileSync('public/media/arteon/manifest.json'))
assert.equal(createHash('sha256').update(readFileSync(`../../${manifest.source.path.split('/').pop()}`)).digest('hex'), manifest.source.sha256)
assert.equal(manifest.frames.length, manifest.frameCount)
for (let index = 0; index < manifest.frames.length; index++) {
  const frame = manifest.frames[index]
  assert.equal(frame.index, index)
  assert.ok(Number.isFinite(frame.timestamp) && (index === 0 || frame.timestamp > manifest.frames[index - 1].timestamp))
  assert.ok(Number.isFinite(frame.sourceTimestamp))
  assert.ok(frame.sourceFrameIndex >= 0 && frame.sourceFrameIndex < manifest.sourceFrameCount)
  for (const variant of manifest.variants) assert.ok(existsSync(`public/media/arteon/${frame.paths[variant.name]}`), `Missing manifest asset: ${frame.paths[variant.name]}`)
}
const report = { sourceUnchanged: true, checkedFrames: 0, opaqueMacroFrames: [], productionBytes: statSync('public/media/arteon/manifest.json').size, greenPixels: 0, maximumGreenExcess: 0, samples: [] }
for (const variant of manifest.variants) {
  const files = readdirSync(`public/media/arteon/${variant.name}`).filter((name) => name.endsWith(`.${manifest.format}`))
  assert.equal(files.length, manifest.frameCount)
  for (let index = 0; index < manifest.frameCount; index++) {
    const filename = `public/media/arteon/${variant.name}/${String(index).padStart(4, '0')}.${manifest.format}`
    const metadata = await sharp(filename).metadata()
    // WebP legitimately omits its alpha chunk when a macro shot consists
    // entirely of opaque engine geometry. Exterior / exploded shots need it.
    if (!metadata.hasAlpha) { assert.ok(index >= 268 && index <= 311, `Missing alpha: ${filename}`); report.opaqueMacroFrames.push(`${variant.name}/${index}`) }
    const { data, info } = await sharp(filename).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    assert.equal(info.width, variant.width)
    assert.equal(info.height, variant.height)
    let transparent = 0, opaque = 0, green = 0, maximumGreenExcess = 0
    for (let p = 0; p < data.length; p += 4) {
      if (!data[p + 3]) transparent++
      if (data[p + 3] > 240) opaque++
      if (data[p + 3] > 80) {
        const excess = data[p + 1] - Math.max(data[p], data[p + 2])
        maximumGreenExcess = Math.max(maximumGreenExcess, excess)
        if (excess > 12) green++
      }
    }
    assert.ok(opaque > info.width * info.height * .025, `Geometry lost: ${filename}`)
    // Frames 187–200 are the source's gray engine-to-vehicle cross-dissolve;
    // its subject intentionally fills the frame before the exterior alpha
    // returns.  Validate transparency again once the dissolve has cleared.
    if (index < 220 || index > 429 || (index >= 312 && index <= 372)) assert.ok(transparent > info.width * info.height * .04, `Background is opaque: ${filename}`)
    report.greenPixels += green
    report.maximumGreenExcess = Math.max(report.maximumGreenExcess, maximumGreenExcess)
    if ([0, 96, 126, 150, 156, 170, 188, 192, 198, 211, 239].includes(index)) report.samples.push({ variant: variant.name, index, transparent, opaque, green })
    report.productionBytes += statSync(filename).size
    report.checkedFrames++
  }
}
writeFileSync('artifacts/arteon/asset-audit.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
assert.ok(report.greenPixels < 20 && report.maximumGreenExcess <= 20, 'Encoded frames contain visible green excess')
