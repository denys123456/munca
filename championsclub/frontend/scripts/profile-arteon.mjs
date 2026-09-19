import { chromium } from '@playwright/test'
import { writeFile, mkdir } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:5173/')
  await page.waitForFunction(() => document.querySelector('.experience-canvas')?.getDiagnostics?.().displayedFrame === 0)
  await page.evaluate(() => {
    window.sample = { intervals: [], longTasks: [], active: true }
    window.observer = new PerformanceObserver((list) => window.sample.longTasks.push(...list.getEntries().map((entry) => entry.duration)))
    window.observer.observe({ type: 'longtask' })
    let previous
    function tick(time) { if (!window.sample.active) return; if (previous) window.sample.intervals.push(time - previous); previous = time; requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  })
  for (let i = 0; i < 130; i++) {
    await page.mouse.wheel(0, i > 80 && i < 100 ? -170 : 105)
    await page.waitForTimeout(45)
  }
  await page.waitForTimeout(1000)
  const report = await page.evaluate(() => {
    window.sample.active = false
    window.observer.disconnect()
    const intervals = window.sample.intervals.sort((a, b) => a - b)
    return { viewport: [innerWidth, innerHeight], medianFrameMs: intervals[Math.floor(intervals.length / 2)], p95FrameMs: intervals[Math.floor(intervals.length * .95)], intervalsOver50Ms: intervals.filter((value) => value > 50).length, longTasks: window.sample.longTasks, renderer: document.querySelector('.experience-canvas').getDiagnostics(), transferBytes: performance.getEntriesByType('resource').filter((entry) => entry.name.includes('/media/arteon/')).reduce((sum, entry) => sum + entry.transferSize, 0) }
  })
  await page.waitForTimeout(600)
  report.idleDraws = await page.evaluate(() => document.querySelector('.experience-canvas').getDiagnostics().frames) - report.renderer.frames
  report.errors = errors
  await mkdir('artifacts/arteon', { recursive: true })
  await writeFile('artifacts/arteon/performance.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  if (errors.length || report.idleDraws || report.renderer.buffering) process.exitCode = 1
} finally { await browser.close() }
