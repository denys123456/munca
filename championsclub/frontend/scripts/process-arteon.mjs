import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import ffmpeg from 'ffmpeg-static'
import probe from 'ffprobe-static'
import { chapterFrames } from '../src/experience/arteonTimeline.js'
import sharp from 'sharp'

const project = resolve('../..')
const source = resolve(process.argv[2] ?? '../../arteonCorect.mp4')
const output = resolve('public/media/arteon')
if (source.startsWith(output)) throw new Error('The source must remain outside the production output.')
const hash = () => createHash('sha256').update(readFileSync(source)).digest('hex')
const sourceHash = hash()
const metadata = JSON.parse(execFileSync(probe.path, ['-v', 'quiet', '-show_format', '-show_streams', '-of', 'json', source], { encoding: 'utf8' }))
const stream = metadata.streams.find((item) => item.codec_type === 'video')
if (stream.width !== 1280 || stream.height !== 720 || stream.avg_frame_rate !== '24/1') throw new Error('Expected the reviewed 1280x720 24fps arteonCorect source.')
const sourceHasAlpha = /^(yuva|gbrap|rgba|bgra|argb|abgr)/.test(stream.pix_fmt) || stream.tags?.alpha_mode === '1'
const sourceFrames = JSON.parse(execFileSync(probe.path, ['-v', 'quiet', '-select_streams', 'v:0', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time,pkt_duration_time', '-of', 'json', source], { encoding: 'utf8' })).frames ?? []
const sourceTimestamps = sourceFrames.map((frame, index) => Number(frame.best_effort_timestamp_time ?? index / 24))
const variants = [{ name: 'desktop', width: 1280, height: 720, quality: 88 }, { name: 'mobile', width: 640, height: 360, quality: 84 }]
for (const variant of variants) mkdirSync(`${output}/${variant.name}`, { recursive: true })
const channels = sourceHasAlpha ? 4 : 3
const bytesPerFrame = stream.width * stream.height * channels
// Decode every native source frame. No matte, key, segmentation, interpolation,
// color correction or alpha processing is applied to the original footage.
const deliveryFps = 24
const expectedFrames = Number(stream.nb_frames)
const decoder = spawn(ffmpeg, ['-v', 'error', '-i', source, '-map', '0:v:0', '-frames:v', String(expectedFrames), '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', sourceHasAlpha ? 'rgba' : 'rgb24', 'pipe:1'], { windowsHide: true })
let stderr = ''
decoder.stderr.on('data', (chunk) => { stderr += chunk })
const finished = new Promise((done, fail) => { decoder.on('error', fail); decoder.on('close', (code) => code === 0 ? done() : fail(new Error(stderr))) })
let pending = Buffer.alloc(0)
let count = 0
for await (const chunk of decoder.stdout) {
  pending = Buffer.concat([pending, chunk])
  while (pending.length >= bytesPerFrame) {
    const raw = pending.subarray(0, bytesPerFrame)
    const frame = sharp(raw, { raw: { width: stream.width, height: stream.height, channels } })
    for (const variant of variants) {
      const encoded = await frame.clone().resize(variant.width, variant.height, { fit: 'fill' }).avif({ quality: variant.quality, effort: 5, chromaSubsampling: '4:4:4' }).toBuffer()
      writeFileSync(`${output}/${variant.name}/${String(count).padStart(4, '0')}.avif`, encoded)
    }
    pending = pending.subarray(bytesPerFrame)
    count++
    if (count % deliveryFps === 0) console.log(`Processed ${count}/${expectedFrames} delivery frames`)
  }
}
await finished
if (count !== expectedFrames || pending.length) throw new Error(`Incomplete decode: ${count} frames`)
if (hash() !== sourceHash) throw new Error('Source integrity check failed')
for (const variant of variants) {
  variant.bytes = readdirSync(`${output}/${variant.name}`).filter((name) => name.endsWith('.avif')).reduce((sum, name) => sum + statSync(`${output}/${variant.name}/${name}`).size, 0)
  variant.path = `${variant.name}/{frame}.avif`
}
const manifest = {
  version: 1,
  source: { path: relative(project, source).replaceAll('\\', '/'), sha256: sourceHash, bytes: statSync(source).size, duration: Number(stream.duration), containerDuration: Number(metadata.format.duration), width: stream.width, height: stream.height, fps: 24, codec: stream.codec_name, pixelFormat: stream.pix_fmt, hasAlpha: sourceHasAlpha },
  frameCount: count, fps: deliveryFps, sourceFrameCount: Number(stream.nb_frames), sourceFps: 24, interpolation: null, firstFrame: 0, lastFrame: count - 1, lastFrameTime: (count - 1) / deliveryFps,
  alpha: false, format: 'avif', variants, chapterFrames, scrollVh: 900,
  frames: Array.from({ length: count }, (_, index) => ({ index, timestamp: index / deliveryFps, sourceFrameIndex: index, sourceTimestamp: sourceTimestamps[index] ?? index / deliveryFps, interpolated: false, paths: Object.fromEntries(variants.map((variant) => [variant.name, `${variant.name}/${String(index).padStart(4, '0')}.avif`])) })),
  processing: { method: 'native decoded source frames; original opaque RGB appearance preserved without background removal, alpha, segmentation, interpolation, color adjustment or cropping', limitations: ['The source checkerboard and exterior shadows remain intentionally visible. AVIF delivery re-encodes decoded source frames for browser delivery.'] },
  events: [
    { event: 'complete vehicle and orbit', start: 0, end: 3.75, frames: [0, 89] },
    { event: 'hood opening', start: 3.75, end: 4.625, frames: [90, 110] },
    { event: 'camera approaches and enters engine bay', start: 4.625, end: 6, frames: [111, 143] },
    { event: 'dissolve into exploded internals', start: 6, end: 6.5, frames: [144, 155] },
    { event: 'exploded components, moving pistons and crankshaft', start: 6.5, end: 7.875, frames: [156, 188] },
    { event: 'dissolve back to open-hood vehicle', start: 7.875, end: 8.375, frames: [189, 200] },
    { event: 'hood closes and camera withdraws', start: 8.375, end: 8.958333, frames: [201, 215] },
    { event: 'complete vehicle held through final frame', start: 8.958333, end: 10, frames: [216, 239] }
  ],
  reconstruction: { completeVehicleReturns: true, explicitPartByPartAssembly: false, note: 'Return uses a source cross-dissolve, followed by hood closure. No continuous internal camera traversal or full physical reassembly is present.' },
  loop: { seamless: false, note: 'First and last views are similar but vehicle position, scale and body details differ slightly. Hold frame 239; reverse only on user scroll.' },
  productionFrameBytes: variants.reduce((sum, variant) => sum + variant.bytes, 0)
}
writeFileSync(`${output}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ frameCount: count, variants, sourceHash }, null, 2))
