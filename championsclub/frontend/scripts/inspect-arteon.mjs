import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ffmpeg from 'ffmpeg-static'
import probe from 'ffprobe-static'

const source = resolve(process.argv[2] ?? '../../arteon.mp4')
const output = resolve('artifacts/arteon')
mkdirSync(output, { recursive: true })
const metadata = execFileSync(probe.path, ['-v', 'quiet', '-show_format', '-show_streams', '-of', 'json', source])
writeFileSync(`${output}/source-probe.json`, metadata)
execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', source, '-vf', 'fps=2,scale=384:216,tile=4x5', '-frames:v', '1', '-y', `${output}/source-contact.jpg`])
for (const time of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9.958333]) {
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-ss', String(time), '-i', source, '-frames:v', '1', '-y', `${output}/source-${time}.png`])
}
console.log(metadata.toString())
