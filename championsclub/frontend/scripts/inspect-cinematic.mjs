import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ffmpeg from 'ffmpeg-static'
import probe from 'ffprobe-static'
import { buildCinematicTimeline } from '../src/experience/arteonTimeline.js'

const manifest = JSON.parse(readFileSync('public/media/cinematic/manifest.json'))
const out = resolve('artifacts/cinematic')
mkdirSync(out, { recursive: true })
for (const clip of manifest.clips) {
  const path = resolve('../..', clip.source.path)
  const metadata = JSON.parse(execFileSync(probe.path, ['-v', 'error', '-count_frames', '-show_format', '-show_streams', '-of', 'json', path], { encoding: 'utf8' }))
  const frames = JSON.parse(execFileSync(probe.path, ['-v', 'error', '-select_streams', 'v:0', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time,pkt_duration_time,key_frame,pict_type', '-of', 'json', path], { encoding: 'utf8' })).frames
  writeFileSync(`${out}/${clip.id}-probe.json`, JSON.stringify({ path, metadata, frames }, null, 2))
  writeFileSync(`${out}/${clip.id}-pts.csv`, 'index,pts,duration\n' + frames.map((f, i) => `${i},${f.best_effort_timestamp_time},${f.pkt_duration_time}`).join('\n'))
  const indices = Array.from({ length: 24 }, (_, i) => Math.round(i * (frames.length - 1) / 23))
  const select = indices.map(i => `eq(n\\,${i})`).join('+')
  execFileSync(ffmpeg, ['-v', 'error', '-i', path, '-vf', `select=${select},scale=320:-1,tile=4x6`, '-frames:v', '1', '-y', `${out}/${clip.id}-contact.jpg`])
  writeFileSync(`${out}/${clip.id}-contact-index.json`, JSON.stringify(indices.map(i => ({ index: i, timestamp: frames[i].best_effort_timestamp_time })), null, 2))
  for (const [label, index] of [['first', 0], ['last', frames.length - 1]]) execFileSync(ffmpeg, ['-v', 'error', '-i', path, '-vf', `select=eq(n\\,${index})`, '-frames:v', '1', '-y', `${out}/${clip.id}-${label}.png`])
}
const timeline = buildCinematicTimeline(manifest)
const report = {
  duration: timeline.duration,
  timelineFrames: timeline.entries.length,
  preservedSourceFrames: manifest.totalFrames,
  segments: timeline.segments.map(s => ({ ...s, normalizedStart: s.start / timeline.duration, normalizedEnd: s.end / timeline.duration })),
  review: {
    exteriorHandoff: 'Clip1 frame239 is a rear three-quarter/right-side view; clip2 frame0 is closer to a pure right-side profile. Vehicle dimensions and wheels also differ. No genuine duplicated overlap was identified. Opaque direct editorial cuts preserve all source motion without ghosting or invented transforms.',
    hood: 'Opening starts around source frame96 (4 seconds). It is substantially raised by frames130–150; the camera and hood retain small changes after that. The exact final provided pose is frame239 at 9.958333 seconds, not a reliably measurable earlier stationary hold.',
    engineOpening: 'Clip3 frame0 is black except for the source watermark. Frames1–15 contain a baked-in black shutter reveal. Frame16 (0.666667 seconds) is the first fully uncovered original image. Preserving every visible frame conflicts with an immediate unobscured engine cut.',
    decomposition: 'Complete engine remains assembled near frame47 (1.958333 seconds). Initial separation is visible around frame48 (2.000000 seconds), increasing clearly at frames50–55. No part of the decomposition is trimmed.',
    ending: 'Clip1 start/end differ materially. Reversing all of Clip1 is necessary to end on the exact opening source frame.'
  }
}
writeFileSync(`${out}/source-review.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
