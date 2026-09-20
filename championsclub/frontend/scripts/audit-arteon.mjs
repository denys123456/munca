import sharp from 'sharp'
import { readFileSync, writeFileSync, statSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

const manifest = JSON.parse(readFileSync('public/media/arteon/manifest.json'))
assert.equal(createHash('sha256').update(readFileSync(`../../${manifest.source.path.split('/').pop()}`)).digest('hex'), manifest.source.sha256)
assert.equal(manifest.alpha, false)
assert.equal(manifest.frames.length, manifest.frameCount)
for (let index = 0; index < manifest.frames.length; index++) {
  const frame = manifest.frames[index]
  assert.equal(frame.index, index)
  assert.ok(Number.isFinite(frame.timestamp) && (index === 0 || frame.timestamp > manifest.frames[index - 1].timestamp))
  assert.ok(Number.isFinite(frame.sourceTimestamp) && frame.sourceFrameIndex === index)
  for (const variant of manifest.variants) assert.ok(existsSync(`public/media/arteon/${frame.paths[variant.name]}`), `Missing manifest asset: ${frame.paths[variant.name]}`)
}
const report = { sourceUnchanged: true, checkedFrames: 0, opaqueFrames: 0, productionBytes: statSync('public/media/arteon/manifest.json').size, samples: [] }
for (const variant of manifest.variants) {
  const files = readdirSync(`public/media/arteon/${variant.name}`).filter((name) => name.endsWith(`.${manifest.format}`))
  assert.equal(files.length, manifest.frameCount)
  for (let index = 0; index < manifest.frameCount; index++) {
    const filename = `public/media/arteon/${variant.name}/${String(index).padStart(4, '0')}.${manifest.format}`
    const metadata = await sharp(filename).metadata()
    assert.equal(Boolean(metadata.hasAlpha), false)
    const { data, info } = await sharp(filename).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    assert.equal(info.width, variant.width)
    assert.equal(info.height, variant.height)
    let opaque = 0
    for (let p = 0; p < data.length; p += 4) if (data[p + 3] > 240) opaque++
    assert.ok(opaque > info.width * info.height * .95, `Unexpected transparency: ${filename}`)
    report.opaqueFrames++
    if ([0, 30, 96, 126, 142, 156, 165, 174, 181, 188, 198, 211, 239].includes(index)) report.samples.push({ variant: variant.name, index, opaque })
    report.productionBytes += statSync(filename).size
    report.checkedFrames++
  }
}
writeFileSync('artifacts/arteon/asset-audit.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
