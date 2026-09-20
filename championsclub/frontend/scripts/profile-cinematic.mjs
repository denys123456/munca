import { chromium } from '@playwright/test'
import { writeFileSync } from 'node:fs'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('pageerror', error => errors.push(error.message))
await page.addInitScript(() => {
  window.cinematicLongTasks = []
  new PerformanceObserver(list => window.cinematicLongTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true })
})
await page.goto('http://127.0.0.1:5173/')
await page.locator('.experience-canvas').waitFor()
await page.waitForFunction(() => document.querySelector('.experience-canvas').getDiagnostics().displayedFrame === 0)
const result = await page.evaluate(async () => {
  const host = document.querySelector('.experience-canvas')
  const root = document.querySelector('.automotive-experience')
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const summary = values => {
    const sorted = [...values].sort((a, b) => a - b)
    return { count: values.length, mean: values.reduce((s, n) => s + n, 0) / values.length, p50: sorted[Math.floor(values.length * .5)], p95: sorted[Math.floor(values.length * .95)], max: sorted.at(-1) }
  }
  const runs = []
  for (const [name, from, to, steps] of [['fast-forward', 0, 1, 360], ['fast-reverse', 1, 0, 360], ['slow-engine', .35, .42, 180]]) {
    const start = performance.now(), baseline = host.getDiagnostics().frames
    const samples = [], lags = [], latencies = []
    let previous = performance.now()
    for (let i = 0; i <= steps; i++) {
      const now = performance.now()
      samples.push(now - previous); previous = now
      const inputStart = performance.now(), drawsBefore = host.getDiagnostics().frames
      window.scrollTo(0, (from + (to - from) * i / steps) * (root.offsetHeight - innerHeight))
      await sleep(16)
      const info = host.getDiagnostics()
      lags.push(Math.abs(info.targetProgress - info.progress) * info.duration)
      if (info.frames > drawsBefore) latencies.push(performance.now() - inputStart)
    }
    await sleep(350)
    const end = host.getDiagnostics()
    const seconds = (performance.now() - start) / 1000
    runs.push({ name, seconds, presentedFrames: end.frames - baseline, presentationsPerSecond: (end.frames - baseline) / seconds, inputIntervalMs: summary(samples.slice(1)), observedResponseUpperBoundMs: summary(latencies), maxTimelineLagSeconds: Math.max(...lags), longTasksDuringRun: window.cinematicLongTasks.filter(t => t.start >= start), diagnostics: end })
  }
  const resources = performance.getEntriesByType('resource').filter(entry => entry.name.includes('/media/cinematic/'))
  return { userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight], runs, network: { resourceCount: resources.length, transferBytes: resources.reduce((sum, r) => sum + r.transferSize, 0), encodedBodyBytes: resources.reduce((sum, r) => sum + r.encodedBodySize, 0), note: 'Resource Timing from this localhost session; browser media buffering and range transfers can differ on remote networks.' }, notes: ['Canvas measurements are CPU draw submission, not isolated GPU upload/compositor time.', 'Presentation frequency follows source frame selection and scroll speed; it is not a claim of 60 FPS.', 'JavaScript heap measurements exclude browser decoder/GPU allocations.'] }
})
writeFileSync('artifacts/cinematic/performance.json', JSON.stringify({ ...result, errors }, null, 2))
console.log(JSON.stringify({ runs: result.runs.map(({ diagnostics, ...run }) => ({ ...run, seekMs: diagnostics.seekLatencyMs, drawMaxMs: diagnostics.drawMaxMs, particleDrawMaxMs: diagnostics.particleDrawMaxMs, fallbackPlayers: diagnostics.fallbackPlayers })), network: result.network, errors }, null, 2))
await browser.close()
