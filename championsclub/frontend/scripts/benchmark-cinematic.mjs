import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto('http://127.0.0.1:5173/')
await page.locator('.experience-canvas').waitFor()
await page.locator('.experience-loading').waitFor({ state: 'detached' })
const reports = []
for (const clipId of ['clip1', 'clip2', 'clip3']) {
const report = await page.evaluate(async clipId => {
  const manifest = await fetch('/artifacts/cinematic/bench/manifest.json').then(r => r.json())
  const clip = manifest.clips.find(clip => clip.id === clipId)
  const canvas = document.createElement('canvas')
  canvas.width = 1280; canvas.height = 720
  const context = canvas.getContext('2d', { alpha: false })
  const summary = samples => {
    const sorted = [...samples].sort((a, b) => a - b)
    return { samples: samples.length, mean: samples.reduce((a, b) => a + b, 0) / samples.length, p50: sorted[Math.floor(sorted.length * .5)], p95: sorted[Math.floor(sorted.length * .95)], max: sorted.at(-1) }
  }
  const patterns = {
    forward: Array.from({ length: 48 }, (_, i) => 30 + i),
    reverse: Array.from({ length: 48 }, (_, i) => 130 - i),
    random: Array.from({ length: 48 }, (_, i) => (i * 73 + 17) % 240),
    reversals: Array.from({ length: 48 }, (_, i) => i % 2 ? 175 - i : 55 + i)
  }
  const results = { environment: { userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency, deviceMemory: navigator.deviceMemory, devicePixelRatio, webCodecs: typeof VideoDecoder !== 'undefined' }, patterns: {}, payload: manifest.clips.map(c => ({ clip: c.id, webpBytes: c.imageBytes, intraVideoBytes: c.bitstreamBytes, originalBytes: c.source.bytes })) }
  for (const mode of ['original-video-seek', 'all-intra-video-seek', 'webcodecs', 'webp-images']) {
    let video, data, decoder, pending
    const latencies = [], draws = [], inaccuracies = []
    const startSetup = performance.now()
    if (mode.includes('video-seek')) {
      video = document.createElement('video')
      video.muted = true; video.playsInline = true; video.preload = 'auto'
      video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none'
      document.body.append(video)
      const loaded = new Promise((resolve, reject) => { video.addEventListener('loadeddata', resolve, { once: true }); video.addEventListener('error', reject, { once: true }) })
      video.src = `/artifacts/cinematic/bench/${clip.id}-${mode.startsWith('original') ? 'original' : 'intra'}.mp4`
      await loaded
    } else if (mode === 'webcodecs') {
      data = await fetch(clip.bitstream).then(r => r.arrayBuffer())
      decoder = new VideoDecoder({ output: frame => pending?.(frame), error: error => { throw error } })
      decoder.configure({ codec: clip.codec, codedWidth: 1280, codedHeight: 720, optimizeForLatency: true })
    }
    const setupMs = performance.now() - startSetup
    results.patterns[mode] = { setupMs, tests: {} }
    for (const [name, indices] of Object.entries(patterns)) {
      const samples = []
      for (const index of indices) {
        const frame = clip.frames[index]
        const start = performance.now()
        let drawable, actualTime
        if (video) {
          const presented = new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`Video seek timed out: ${mode} ${index}`)), 4000)
            video.requestVideoFrameCallback((_now, metadata) => { clearTimeout(timer); resolve(metadata.mediaTime) })
          })
          video.currentTime = frame.timestamp + .001
          actualTime = await presented
          drawable = video
        } else if (decoder) {
          const output = new Promise(resolve => { pending = resolve })
          decoder.decode(new EncodedVideoChunk({ type: 'key', timestamp: Math.round(frame.timestamp * 1e6), data: new Uint8Array(data, frame.packet.offset, frame.packet.size) }))
          const flushed = decoder.flush()
          drawable = await output
          await flushed
          actualTime = drawable.timestamp / 1e6
        } else {
          const blob = await fetch('/media/cinematic/' + frame.asset).then(r => r.blob())
          drawable = await createImageBitmap(blob)
          actualTime = frame.timestamp
        }
        const drawStart = performance.now()
        context.drawImage(drawable, 0, 0)
        draws.push(performance.now() - drawStart)
        drawable.close?.()
        const elapsed = performance.now() - start
        samples.push(elapsed); latencies.push(elapsed)
        if (Math.abs(actualTime - frame.timestamp) > .002) inaccuracies.push({ index, expected: frame.timestamp, actualTime })
      }
      results.patterns[mode].tests[name] = summary(samples)
    }
    if (video) {
      const actual = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Rapid-seek timeout')), 4000)
        video.requestVideoFrameCallback((_now, metadata) => { clearTimeout(timer); resolve(metadata.mediaTime) })
        for (const index of [2, 230, 16, 178, 35, 220, 65]) video.currentTime = clip.frames[index].timestamp + .001
      })
      results.patterns[mode].rapidLatestSeek = { expected: clip.frames[65].timestamp, actual, accurate: Math.abs(actual - clip.frames[65].timestamp) < .002 }
      video.remove(); video.removeAttribute('src'); video.load()
    }
    decoder?.close()
    results.patterns[mode].latencyMs = summary(latencies)
    results.patterns[mode].drawSubmissionMs = summary(draws)
    results.patterns[mode].inaccuracies = inaccuracies
  }
  return results
}, clipId)
reports.push({ clip: clipId, ...report })
}
mkdirSync('artifacts/cinematic', { recursive: true })
writeFileSync('artifacts/cinematic/benchmark.json', JSON.stringify(reports, null, 2))
console.log(JSON.stringify(reports.map(report => ({ clip: report.clip, modes: Object.fromEntries(Object.entries(report.patterns).map(([mode, value]) => [mode, { latencyMs: value.latencyMs, inaccuracies: value.inaccuracies.length, rapidLatestSeek: value.rapidLatestSeek }])) })), null, 2))
await browser.close()
