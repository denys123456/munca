import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('requestfailed', (request) => errors.push(request.url()))
await page.addInitScript(() => {
  sessionStorage.setItem('championsclub-book-opened', 'true')
  sessionStorage.setItem('championsclub-account', 'alex-manager')
  window.championsCommits = 0
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: () => { window.championsCommits += 1 }, onCommitFiberUnmount: () => {}, onPostCommitFiberRoot: () => {} }
})
await page.goto('http://127.0.0.1:5173/#/team-performance')
await page.mouse.move(45, 920)
await page.mouse.wheel(0, 120)
await page.waitForTimeout(600)

async function beginSample() {
  await page.evaluate(() => {
    window.readerSample = { frames: [], longTasks: [], commits: window.championsCommits, started: performance.now(), active: true }
    window.readerObserver = new PerformanceObserver((list) => window.readerSample.longTasks.push(...list.getEntries().map((entry) => entry.duration)))
    window.readerObserver.observe({ type: 'longtask' })
    let previous
    function sample(time) {
      if (!window.readerSample.active) return
      if (previous) window.readerSample.frames.push(time - previous)
      previous = time
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
}

async function finishSample() {
  return page.evaluate(() => {
    const sample = window.readerSample
    sample.active = false
    window.readerObserver.disconnect()
    const frames = sample.frames.sort((first, second) => first - second)
    const sheet = document.querySelector('.is-front .paper-layer')
    return { duration: performance.now() - sample.started, frameMedian: frames[Math.floor(frames.length / 2)], frameP95: frames[Math.floor(frames.length * .95)], framesOver50ms: frames.filter((value) => value > 50).length, longTasks: sample.longTasks, reactCommits: window.championsCommits - sample.commits, cameraProgress: sheet.dataset.progress, cameraX: sheet.dataset.cameraX, cameraY: sheet.dataset.cameraY, curlProgress: document.querySelector('.publication').dataset.curlProgress, activeBackdropFilters: [...document.querySelectorAll('*')].filter((element) => getComputedStyle(element).backdropFilter !== 'none').length, horizontalOverflow: document.documentElement.scrollWidth > innerWidth }
  })
}

await beginSample()
for (let step = 0; step < 65; step += 1) {
  await page.mouse.wheel(0, step > 40 && step < 49 ? -65 : 110)
  await page.waitForTimeout(24)
}
await page.waitForTimeout(300)
const camera = await finishSample()
await page.keyboard.press('End')
await page.waitForTimeout(650)
await page.mouse.wheel(0, 120)
await page.waitForTimeout(200)
await page.mouse.wheel(0, 120)
await page.waitForTimeout(150)
await beginSample()
for (const delta of [80, 95, 35, -60, 140, 120, -35, 100, 75]) {
  await page.mouse.wheel(0, delta)
  await page.waitForTimeout(45)
}
await page.waitForTimeout(150)
const curl = await finishSample()
await mkdir('artifacts', { recursive: true })
await page.screenshot({ path: 'artifacts/profile-curl.png' })
const report = { camera, curl, errors }
await writeFile('artifacts/reader-performance.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
await browser.close()
