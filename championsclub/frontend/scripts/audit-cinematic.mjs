import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import probe from 'ffprobe-static'
import ffmpeg from 'ffmpeg-static'
const manifestPath = 'public/media/cinematic/manifest.json'
const manifest = JSON.parse(readFileSync(manifestPath))
const report = { verifiedFrames: 0, verifiedVideos: 0, sourceHashesUnchanged: true, assetBytes: statSync(manifestPath).size, clips: [] }
mkdirSync('artifacts/cinematic', { recursive: true })
for (const clip of manifest.clips) {
  const original = `../../${clip.source.path}`
  assert.equal(createHash('sha256').update(readFileSync(original)).digest('hex'), clip.source.sha256)
  for (const frame of clip.frames) {
    const file = `public/media/cinematic/${frame.asset}`
    const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
    assert.equal(info.channels, 3)
    assert.equal(info.width, frame.width); assert.equal(info.height, frame.height)
    assert.equal(data.length, frame.width * frame.height * 3)
    report.verifiedFrames++; report.assetBytes += statSync(file).size
  }
  const video = `public/media/cinematic/${clip.video}`
  const metadata = JSON.parse(execFileSync(probe.path, ['-v', 'error', '-count_frames', '-show_streams', '-select_streams', 'v:0', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time,key_frame', '-of', 'json', video], { encoding: 'utf8', maxBuffer: 8e6 }))
  assert.equal(metadata.frames.length, clip.frames.length)
  assert.equal(Number(metadata.streams[0].nb_read_frames), clip.frames.length)
  for (const [index, frame] of metadata.frames.entries()) {
    assert.equal(frame.key_frame, 1)
    assert.ok(Math.abs(Number(frame.best_effort_timestamp_time) - clip.frames[index].timestamp) < .000002)
  }
  const quality = spawnSync(ffmpeg, ['-hide_banner', '-i', original, '-i', video, '-lavfi', 'ssim', '-an', '-f', 'null', '-'], { encoding: 'utf8', windowsHide: true })
  assert.equal(quality.status, 0, quality.stderr)
  const ssim = Number(quality.stderr.match(/All:([\d.]+)/)?.[1])
  assert.ok(ssim > .99, `Unexpected video quality: ${ssim}`)
  report.verifiedVideos++; report.assetBytes += statSync(video).size
  report.clips.push({ id: clip.id, decodedFrames: metadata.frames.length, allKeyframes: true, timestampErrorMaxSeconds: Math.max(...metadata.frames.map((f, i) => Math.abs(Number(f.best_effort_timestamp_time) - clip.frames[i].timestamp))), bytes: clip.videoBytes + clip.imageBytes, videoSsim: ssim })
}
writeFileSync('artifacts/cinematic/asset-audit.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
