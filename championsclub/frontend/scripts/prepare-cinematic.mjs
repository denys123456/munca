import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve, relative, extname, join } from 'node:path'
import ffmpeg from 'ffmpeg-static'
import probe from 'ffprobe-static'
import sharp from 'sharp'

// No temporal filter, matte, crop, color adjustment, or modification of a source.
const root = resolve('../..')
const output = resolve('public/media/cinematic')
const evidence = resolve('artifacts/cinematic')
const videoExtensions = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi', '.mpeg', '.mpg', '.mts'])
function discover(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', '.git', 'dist', 'artifacts', 'public'].includes(entry.name)) return []
    const path = join(directory, entry.name)
    return entry.isDirectory() ? discover(path) : videoExtensions.has(extname(entry.name).toLowerCase()) && /clip[123]/i.test(entry.name) ? [path] : []
  })
}
const sources = discover(root)
const probeJson = args => JSON.parse(execFileSync(probe.path, ['-v', 'error', ...args, '-of', 'json'], { encoding: 'utf8', maxBuffer: 32e6 }))
const run = args => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex')
mkdirSync(output, { recursive: true })
mkdirSync(`${evidence}/bench`, { recursive: true })
const manifest = { version: 2, clips: [], processing: 'All native frames, opaque source backgrounds, no interpolation, temporal resampling, crop, or color adjustment. WebP quality 92 fallback; H.264 CRF 16 all-intra video seeking.' }
const benchmarkClips = []
for (const id of ['clip1', 'clip2', 'clip3']) {
  const matches = sources.filter(path => new RegExp(id, 'i').test(path.split(/[\\/]/).at(-1)))
  if (matches.length !== 1) throw new Error(`Expected one original ${id}; found ${matches.join(', ')}`)
  const source = matches[0]
  const sha256 = hash(source)
  const metadata = probeJson(['-count_frames', '-show_format', '-show_streams', source])
  const stream = metadata.streams.find(item => item.codec_type === 'video')
  const originalFrames = probeJson(['-select_streams', 'v:0', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time,pkt_duration_time,key_frame,pict_type', source]).frames
  if (Number(stream.nb_read_frames) !== originalFrames.length) throw new Error('Decoded source count does not match PTS count')
  const timestamps = originalFrames.map(frame => Number(frame.best_effort_timestamp_time))
  const deltas = timestamps.slice(1).map((time, index) => time - timestamps[index])
  if (deltas.some(delta => !(delta > 0))) throw new Error('Non-monotonic source timestamps')
  mkdirSync(`${output}/${id}/frames`, { recursive: true })
  run(['-i', source, '-map', '0:v:0', '-an', '-fps_mode', 'passthrough', '-c:v', 'libwebp', '-quality', '92', '-compression_level', '4', '-start_number', '0', `${output}/${id}/frames/%04d.webp`])
  run(['-i', source, '-map', '0:v:0', '-an', '-fps_mode', 'passthrough', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-g', '1', '-bf', '0', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${evidence}/bench/${id}-intra.mp4`])
  run(['-i', source, '-map', '0:v:0', '-an', '-c:v', 'copy', '-movflags', '+faststart', `${evidence}/bench/${id}-original.mp4`])
  copyFileSync(`${evidence}/bench/${id}-intra.mp4`, `${output}/${id}/scrub.mp4`)
  run(['-i', `${evidence}/bench/${id}-intra.mp4`, '-c:v', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'h264', `${evidence}/bench/${id}.h264`])
  const optimized = probeJson(['-select_streams', 'v:0', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time', `${evidence}/bench/${id}-intra.mp4`]).frames
  if (optimized.length !== timestamps.length || optimized.some((f, i) => Math.abs(Number(f.best_effort_timestamp_time) - timestamps[i]) > 0.000002)) throw new Error(`${id}: encoder changed frame count/timestamps`)
  const packets = probeJson(['-show_packets', '-show_entries', 'packet=pos,size,flags', `${evidence}/bench/${id}.h264`]).packets
  if (packets.length !== timestamps.length || packets.some(packet => !packet.flags.includes('K'))) throw new Error(`${id}: random-access packet count/key flags invalid`)
  const files = readdirSync(`${output}/${id}/frames`).filter(file => file.endsWith('.webp'))
  if (files.length !== timestamps.length) throw new Error(`${id}: incomplete extraction`)
  let imageBytes = 0
  const frames = []
  for (let index = 0; index < timestamps.length; index++) {
    const asset = `${id}/frames/${String(index).padStart(4, '0')}.webp`
    const { data, info } = await sharp(`${output}/${asset}`).raw().toBuffer({ resolveWithObject: true })
    if (info.width !== stream.width || info.height !== stream.height || info.channels !== 3 || data.length !== stream.width * stream.height * 3) throw new Error(`${id}:${index} decode/dimensions/opacity invalid`)
    imageBytes += statSync(`${output}/${asset}`).size
    const sample = (x, y) => {
      const sum = [0, 0, 0]
      for (let dy = 0; dy < 8; dy++) for (let dx = 0; dx < 8; dx++) for (let c = 0; c < 3; c++) sum[c] += data[((y + dy) * info.width + x + dx) * 3 + c]
      return sum.map(value => Math.round(value / 64))
    }
    const stops = Array.from({ length: 9 }, (_, i) => i / 8)
    const sideStops = Array.from({ length: 33 }, (_, i) => i / 32)
    const edgeProfiles = { top: stops.map(t => sample(Math.round(t * (info.width - 8)), 0)), bottom: stops.map(t => sample(Math.round(t * (info.width - 8)), info.height - 8)), left: sideStops.map(t => sample(0, Math.round(t * (info.height - 8)))), right: sideStops.map(t => sample(info.width - 8, Math.round(t * (info.height - 8)))) }
    frames.push({ clip: id, index, timestamp: timestamps[index], duration: Number(originalFrames[index].pkt_duration_time) || deltas.at(-1), asset, width: stream.width, height: stream.height, packet: { offset: Number(packets[index].pos), size: Number(packets[index].size) }, edgeColors: { topLeft: sample(0, 0), topRight: sample(info.width - 8, 0), bottomLeft: sample(0, info.height - 8), bottomRight: sample(info.width - 8, info.height - 8) }, edgeProfiles })
  }
  // Decode the complete production bitstream as a second independent integrity check.
  const decoded = probeJson(['-count_frames', '-show_streams', `${output}/${id}/scrub.mp4`]).streams[0]
  if (Number(decoded.nb_read_frames) !== timestamps.length) throw new Error(`${id}: incomplete video decode`)
  if (hash(source) !== sha256) throw new Error(`${id}: source changed`)
  const clip = { id, source: { path: relative(root, source).replaceAll('\\', '/'), absolutePath: source, sha256, bytes: statSync(source).size, duration: Number(stream.duration), containerDuration: Number(metadata.format.duration), width: stream.width, height: stream.height, codec: stream.codec_name, pixelFormat: stream.pix_fmt, nativeFps: stream.r_frame_rate, averageFps: stream.avg_frame_rate, frameCount: timestamps.length, audio: metadata.streams.filter(s => s.codec_type === 'audio').map(s => ({ codec: s.codec_name, sampleRate: s.sample_rate, channels: s.channels })), constantFrameRate: Math.max(...deltas) - Math.min(...deltas) < 0.00001, minFrameDelta: Math.min(...deltas), maxFrameDelta: Math.max(...deltas) }, codec: 'avc1.64001f', video: `${id}/scrub.mp4`, videoBytes: statSync(`${output}/${id}/scrub.mp4`).size, imageBytes, frames: frames.map(({ packet, ...frame }) => frame) }
  benchmarkClips.push({ ...clip, frames, bitstream: `/artifacts/cinematic/bench/${id}.h264`, bitstreamBytes: statSync(`${evidence}/bench/${id}.h264`).size })
  manifest.clips.push(clip)
  writeFileSync(`${evidence}/${id}-probe.json`, JSON.stringify({ path: source, metadata, frames: originalFrames }, null, 2))
  console.log(JSON.stringify({ clip: id, verifiedFrames: frames.length, imageBytes, videoBytes: clip.videoBytes }))
}
manifest.totalFrames = manifest.clips.reduce((sum, clip) => sum + clip.frames.length, 0)
manifest.mediaBytes = manifest.clips.reduce((sum, clip) => sum + clip.imageBytes + clip.videoBytes, 0)
writeFileSync(`${output}/manifest.json`, JSON.stringify(manifest) + '\n')
writeFileSync(`${evidence}/bench/manifest.json`, JSON.stringify({ ...manifest, clips: benchmarkClips }))
console.log(`Verified ${manifest.totalFrames} original frames. Production media: ${manifest.mediaBytes} bytes.`)
