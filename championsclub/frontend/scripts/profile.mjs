import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
await page.addInitScript(() => {
  window.championsCommits = 0
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: () => { window.championsCommits += 1 }, onCommitFiberUnmount: () => {}, onPostCommitFiberRoot: () => {} }
})
await page.goto(process.env.PROFILE_URL ?? 'http://127.0.0.1:5173/')
await page.waitForFunction(() => document.querySelector('.experience-canvas')?.getDiagnostics?.().ready, { timeout: 20000 })
await page.waitForTimeout(300)
await page.evaluate(() => {
  window.sample = { frames: [], longTasks: [], commits: window.championsCommits, active: true }
  window.observer = new PerformanceObserver((list) => window.sample.longTasks.push(...list.getEntries().map((entry) => ({ duration: entry.duration, progress: document.querySelector('.experience-canvas').getDiagnostics().progress }))))
  window.observer.observe({ type: 'longtask' })
  let previous
  function tick(time) {
    if (!window.sample.active) return
    if (previous) window.sample.frames.push(time - previous)
    previous = time
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})
for (let index = 0; index < 140; index += 1) {
  await page.mouse.wheel(0, index > 80 && index < 100 ? -180 : 210)
  await page.waitForTimeout(35)
}
await page.waitForTimeout(1000)
const profile = await page.evaluate(() => {
  window.sample.active = false
  window.observer.disconnect()
  const frames = window.sample.frames.sort((first, second) => first - second)
  return { frameMedian: frames[Math.floor(frames.length / 2)], frameP95: frames[Math.floor(frames.length * .95)], framesOver50ms: frames.filter((frame) => frame > 50).length, longTasks: window.sample.longTasks, reactCommits: window.championsCommits - window.sample.commits, renderer: document.querySelector('.experience-canvas').getDiagnostics() }
})
const beforeIdle = await page.evaluate(() => document.querySelector('.experience-canvas').getDiagnostics().frames)
await page.waitForTimeout(1000)
const afterIdle = await page.evaluate(() => document.querySelector('.experience-canvas').getDiagnostics().frames)
profile.idleRenderedFrames = afterIdle - beforeIdle
profile.errors = errors
await mkdir('artifacts/automotive', { recursive: true })
await writeFile('artifacts/automotive/performance.json', JSON.stringify(profile, null, 2))
console.log(JSON.stringify(profile, null, 2))
await browser.close()
if (errors.length || profile.reactCommits > 0 || profile.idleRenderedFrames > 0) process.exitCode = 1
