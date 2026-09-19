import sharp from 'sharp'
import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

const manifest = JSON.parse(readFileSync('public/media/arteon/manifest.json'))
assert.equal(createHash('sha256').update(readFileSync('../../arteon.mp4')).digest('hex'), manifest.source.sha256)
const report = { sourceUnchanged: true, checkedFrames: 0, opaqueMacroFrames: [], productionBytes: statSync('public/media/arteon/manifest.json').size, greenPixels: 0, maximumGreenExcess: 0, samples: [] }
for (const variant of manifest.variants) {
  const files = readdirSync(`public/media/arteon/${variant.name}`).filter((name) => name.endsWith('.webp'))
  assert.equal(files.length, manifest.frameCount)
  for (let index = 0; index < manifest.frameCount; index++) {
    const filename = `public/media/arteon/${variant.name}/${String(index).padStart(4, '0')}.webp`
    const metadata = await sharp(filename).metadata()
    // WebP legitimately omits its alpha chunk when a macro shot consists
    // entirely of opaque engine geometry. Exterior / exploded shots need it.
    if (!metadata.hasAlpha) { assert.ok(index >= 134 && index <= 155, `Missing alpha: ${filename}`); report.opaqueMacroFrames.push(`${variant.name}/${index}`) }
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
    if (index < 110 || index > 214 || (index >= 156 && index <= 188)) assert.ok(transparent > info.width * info.height * .04, `Background is opaque: ${filename}`)
    report.greenPixels += green
    report.maximumGreenExcess = Math.max(report.maximumGreenExcess, maximumGreenExcess)
    if ([0, 96, 126, 150, 156, 170, 188, 192, 198, 211, 239].includes(index)) report.samples.push({ variant: variant.name, index, transparent, opaque, green })
    report.productionBytes += statSync(filename).size
    report.checkedFrames++
  }
}
writeFileSync('artifacts/arteon/asset-audit.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
assert.equal(report.greenPixels, 0, 'Encoded frames contain visible green excess')
