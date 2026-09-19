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
const source = resolve(process.argv[2] ?? '../../arteonCorect.mp4')
const output = resolve('public/media/arteon')
if (source.startsWith(output)) throw new Error('The source must remain outside the production output.')
const hash = () => createHash('sha256').update(readFileSync(source)).digest('hex')
const sourceHash = hash()
const metadata = JSON.parse(execFileSync(probe.path, ['-v', 'quiet', '-show_format', '-show_streams', '-of', 'json', source], { encoding: 'utf8' }))
const stream = metadata.streams.find((item) => item.codec_type === 'video')
if (stream.width !== 1280 || stream.height !== 720 || stream.avg_frame_rate !== '24/1') throw new Error('Expected the reviewed 1280x720 24fps arteonCorect source.')
const sourceHasAlpha = /^(yuva|gbrap|rgba|bgra|argb|abgr)/.test(stream.pix_fmt) || stream.tags?.alpha_mode === '1'
const variants = [{ name: 'desktop', width: 1280, height: 720, quality: 55 }, { name: 'mobile', width: 640, height: 360, quality: 50 }]
for (const variant of variants) mkdirSync(`${output}/${variant.name}`, { recursive: true })
const channels = sourceHasAlpha ? 4 : 3
const bytesPerFrame = stream.width * stream.height * channels
// Create a 48 fps delivery from the untouched source using motion-compensated
// interpolation. This adds temporal samples without dropping source moments;
// it is still decoded and matted offline before entering the browser.
const deliveryFps = 48
const expectedFrames = 480
const decoder = spawn(ffmpeg, ['-v', 'error', '-i', source, '-map', '0:v:0', '-vf', `minterpolate=fps=${deliveryFps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,tpad=stop_mode=clone:stop_duration=0.2`, '-frames:v', String(expectedFrames), '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', sourceHasAlpha ? 'rgba' : 'rgb24', 'pipe:1'], { windowsHide: true })
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
      : await matteFrame(raw, stream.width, stream.height, count / deliveryFps)
    for (const variant of variants) {
      writeFileSync(`${output}/${variant.name}/${String(count).padStart(4, '0')}.avif`, await encodeArteon(frame, variant))
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
  frameCount: count, fps: deliveryFps, sourceFrameCount: Number(stream.nb_frames), sourceFps: 24, interpolation: 'motion-compensated minterpolate from original 24fps source', firstFrame: 0, lastFrame: count - 1, lastFrameTime: (count - 1) / deliveryFps,
  alpha: true, format: 'avif', variants, chapterFrames, scrollVh: 900,
  processing: { method: sourceHasAlpha ? 'source-alpha-preserved' : 'border-seeded checkerboard segmentation with neutral-tile clustering, connected-background flood fill, edge alpha refinement and bounded AVIF premultiplication', limitations: ['The source contains baked checkerboard pixels at anti-aliased subject edges; narrow neutral fringes may remain in high-contrast transition frames.', 'Interpolated frames preserve motion timing but are not additional source photography.'] },
  events: [
    { event: 'complete vehicle and orbit', start: 0, end: 3.75, frames: [0, 179] },
    { event: 'hood opening', start: 3.75, end: 4.625, frames: [180, 221] },
    { event: 'camera approaches and enters engine bay', start: 4.625, end: 6, frames: [222, 287] },
    { event: 'dissolve into exploded internals', start: 6, end: 6.5, frames: [288, 311] },
    { event: 'exploded components, moving pistons and crankshaft', start: 6.5, end: 7.875, frames: [312, 377] },
    { event: 'dissolve back to open-hood vehicle', start: 7.875, end: 8.375, frames: [378, 401] },
    { event: 'hood closes and camera withdraws', start: 8.375, end: 8.958333, frames: [402, 429] },
    { event: 'complete vehicle held through final frame', start: 8.958333, end: 10, frames: [430, 479] }
  ],
  reconstruction: { completeVehicleReturns: true, explicitPartByPartAssembly: false, note: 'Return uses a source cross-dissolve, followed by hood closure. No continuous internal camera traversal or full physical reassembly is present.' },
  loop: { seamless: false, note: 'First and last views are similar but vehicle position, scale and body details differ slightly. Hold frame 239; reverse only on user scroll.' },
  productionFrameBytes: variants.reduce((sum, variant) => sum + variant.bytes, 0)
}
writeFileSync(`${output}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ frameCount: count, variants, sourceHash }, null, 2))
