import { execFileSync } from 'node:child_process'
import ffmpeg from 'ffmpeg-static'
import sharp from 'sharp'
import { matteFrame } from './arteon-matte.mjs'
import { mkdirSync } from 'node:fs'

mkdirSync('artifacts/arteon', { recursive: true })
const times = [0, 2, 4, 5.5, 6.25, 6.5, 7, 7.75, 8, 8.25, 9.958333]
const tiles = []
for (const [i, time] of times.entries()) {
  const raw = execFileSync(ffmpeg, ['-loglevel', 'error', '-ss', String(time), '-i', '../../arteon.mp4', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: 1280 * 720 * 4 })
  const keyed = await matteFrame(raw, 1280, 720, time)
  await keyed.clone().png().toFile(`artifacts/arteon/keyed-${time}.png`)
  for (const [j, background] of ['#11181d', '#ffffff', '#e6e9e8'].entries()) {
    const input = await keyed.clone().flatten({ background }).resize(480, 270).png().toBuffer()
    tiles.push({ input, left: j * 480, top: i * 294 })
  }
  tiles.push({ input: Buffer.from(`<svg width="1440" height="24"><text x="12" y="18" fill="white" font-size="16">${time}s — dark / white / ChampionsClub</text></svg>`), left: 0, top: i * 294 + 270 })
}
await sharp({ create: { width: 1440, height: times.length * 294, channels: 3, background: '#333333' } }).composite(tiles).jpeg({ quality: 90 }).toFile('artifacts/arteon/keyed-contact.jpg')
