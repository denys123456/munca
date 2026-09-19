import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import ffmpeg from 'ffmpeg-static'
import probe from 'ffprobe-static'
import { matteFrame } from './arteon-matte.mjs'
import { encodeArteon } from './encode-arteon.mjs'
import { chapterFrames } from '../src/experience/arteonTimeline.js'

const project = resolve('../..')
const source = resolve(process.argv[2] ?? '../../arteon.mp4')
const output = resolve('public/media/arteon')
if (source.startsWith(output)) throw new Error('The source must remain outside the production output.')
const hash = () => createHash('sha256').update(readFileSync(source)).digest('hex')
const sourceHash = hash()
const metadata = JSON.parse(execFileSync(probe.path, ['-v', 'quiet', '-show_format', '-show_streams', '-of', 'json', source], { encoding: 'utf8' }))
const stream = metadata.streams.find((item) => item.codec_type === 'video')
if (stream.width !== 1280 || stream.height !== 720 || stream.nb_frames !== '240' || stream.avg_frame_rate !== '24/1') {
  throw new Error('This matte and event manifest were reviewed for the supplied 240-frame Arteon source. Reinspect different footage before processing.')
}
const sourceHasAlpha = /^(yuva|gbrap|rgba|bgra|argb|abgr)/.test(stream.pix_fmt) || stream.tags?.alpha_mode === '1'
const variants = [{ name: 'desktop', width: 1280, height: 720, quality: 84 }, { name: 'mobile', width: 640, height: 360, quality: 80 }]
for (const variant of variants) mkdirSync(`${output}/${variant.name}`, { recursive: true })
const channels = sourceHasAlpha ? 4 : 3
const bytesPerFrame = stream.width * stream.height * channels
const decoder = spawn(ffmpeg, ['-v', 'error', '-i', source, '-map', '0:v:0', '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', sourceHasAlpha ? 'rgba' : 'rgb24', 'pipe:1'], { windowsHide: true })
let stderr = ''
decoder.stderr.on('data', (chunk) => { stderr += chunk })
const finished = new Promise((done, fail) => { decoder.on('error', fail); decoder.on('close', (code) => code === 0 ? done() : fail(new Error(stderr))) })
let pending = Buffer.alloc(0)
let count = 0
for await (const chunk of decoder.stdout) {
  pending = Buffer.concat([pending, chunk])
  while (pending.length >= bytesPerFrame) {
    const raw = pending.subarray(0, bytesPerFrame)
    const frame = sourceHasAlpha
      ? (await import('sharp')).default(raw, { raw: { width: stream.width, height: stream.height, channels } })
      : await matteFrame(raw, stream.width, stream.height, count / 24)
    for (const variant of variants) {
      writeFileSync(`${output}/${variant.name}/${String(count).padStart(4, '0')}.webp`, await encodeArteon(frame, variant))
    }
    pending = pending.subarray(bytesPerFrame)
    count++
    if (count % 24 === 0) console.log(`Processed ${count}/240 source frames`)
  }
}
await finished
if (count !== 240 || pending.length) throw new Error(`Incomplete decode: ${count} frames`)
if (hash() !== sourceHash) throw new Error('Source integrity check failed')
for (const variant of variants) {
  variant.bytes = readdirSync(`${output}/${variant.name}`).filter((name) => name.endsWith('.webp')).reduce((sum, name) => sum + statSync(`${output}/${variant.name}/${name}`).size, 0)
  variant.path = `${variant.name}/{frame}.webp`
}
const manifest = {
  version: 1,
  source: { path: relative(project, source).replaceAll('\\', '/'), sha256: sourceHash, bytes: statSync(source).size, duration: Number(stream.duration), containerDuration: Number(metadata.format.duration), width: stream.width, height: stream.height, fps: 24, codec: stream.codec_name, pixelFormat: stream.pix_fmt, hasAlpha: sourceHasAlpha },
  frameCount: count, fps: 24, firstFrame: 0, lastFrame: count - 1, lastFrameTime: (count - 1) / 24,
  alpha: true, format: 'webp', variants, chapterFrames, scrollVh: 900,
  processing: { method: sourceHasAlpha ? 'source-alpha-preserved' : 'green chroma matte with dark-surface protection, RGB despill, fitted gray gradient difference matte for engine', limitations: ['The source bakes cross-dissolves into opaque footage; transition mattes are approximate.', 'Fine gray-on-gray metal edges can retain some matte fringe.', 'Source resolution is 720p; no synthetic detail or frames are generated.'] },
  events: [
    { event: 'complete vehicle and orbit', start: 0, end: 3.75, frames: [0, 89] },
    { event: 'hood opening', start: 3.75, end: 4.625, frames: [90, 110] },
    { event: 'camera approaches and enters engine bay', start: 4.625, end: 6, frames: [111, 143] },
    { event: 'dissolve into exploded internals', start: 6, end: 6.5, frames: [144, 155] },
    { event: 'exploded components, moving pistons and crankshaft', start: 6.5, end: 7.875, frames: [156, 188] },
    { event: 'dissolve back to open-hood vehicle', start: 7.875, end: 8.375, frames: [189, 200] },
    { event: 'hood closes and camera withdraws', start: 8.375, end: 8.958333, frames: [201, 214] },
    { event: 'complete vehicle held through final frame', start: 8.958333, end: 10, frames: [215, 239] }
  ],
  reconstruction: { completeVehicleReturns: true, explicitPartByPartAssembly: false, note: 'Return uses a source cross-dissolve, followed by hood closure. No continuous internal camera traversal or full physical reassembly is present.' },
  loop: { seamless: false, note: 'First and last views are similar but vehicle position, scale and body details differ slightly. Hold frame 239; reverse only on user scroll.' },
  productionFrameBytes: variants.reduce((sum, variant) => sum + variant.bytes, 0)
}
writeFileSync(`${output}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ frameCount: count, variants, sourceHash }, null, 2))
