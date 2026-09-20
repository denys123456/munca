import { execFileSync } from 'node:child_process'
import ffmpeg from 'ffmpeg-static'
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('artifacts/arteon', { recursive: true })
const source = '../../arteonCorect.mp4'
const times = [0, 2, 4, 5.5, 6.25, 6.5, 7, 7.75, 8, 8.25, 9.958333]
const tiles = []
for (const [index, time] of times.entries()) {
  const frame = execFileSync(ffmpeg, ['-loglevel', 'error', '-ss', String(time), '-i', source, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-y', 'pipe:1'], { maxBuffer: 8 * 1024 * 1024 })
  const input = await sharp(frame).resize(480, 270).jpeg({ quality: 90 }).toBuffer()
  tiles.push({ input, left: 0, top: index * 294 })
  tiles.push({ input: Buffer.from(`<svg width="480" height="24"><text x="12" y="18" fill="white" font-size="16">${time}s — original source</text></svg>`), left: 0, top: index * 294 + 270 })
}
await sharp({ create: { width: 480, height: times.length * 294, channels: 3, background: '#333333' } }).composite(tiles).jpeg({ quality: 90 }).toFile('artifacts/arteon/original-contact.jpg')
