import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await page.goto('http://127.0.0.1:5173')
await page.waitForTimeout(3200)
await page.evaluate(() => {
  window.profileFrames = []
  window.profileLongTasks = []
  window.profileMutations = 0
  new PerformanceObserver((list) => window.profileLongTasks.push(...list.getEntries().map((entry) => entry.duration))).observe({ type: 'longtask', buffered: true })
  window.profileObserver = new MutationObserver((entries) => { window.profileMutations += entries.length })
  window.profileObserver.observe(document.querySelector('main'), { subtree: true, childList: true, characterData: true })
  let previous = performance.now()
  const end = previous + 3500
  function sample(now) {
    window.profileFrames.push(now - previous)
    previous = now
    if (now < end) requestAnimationFrame(sample)
  }
  requestAnimationFrame(sample)
})
for (let step = 0; step < 60; step += 1) {
  await page.mouse.move(160 + (step % 12) * 92, 260 + (step % 5) * 66)
}
await page.waitForTimeout(2200)
const report = await page.evaluate(() => {
  const elements = [...document.querySelectorAll('*')]
  const frames = window.profileFrames.slice(1).sort((first, second) => first - second)
  window.profileObserver.disconnect()
  return {
    promotedElements: elements.filter((element) => getComputedStyle(element).willChange !== 'auto').length,
    backdropFilters: elements.filter((element) => getComputedStyle(element).backdropFilter !== 'none').length,
    frameMedian: frames[Math.floor(frames.length / 2)],
    frameP95: frames[Math.floor(frames.length * 0.95)],
    longTasks: window.profileLongTasks,
    contentMutationsDuringPointerMovement: window.profileMutations,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth
  }
})
await mkdir('artifacts', { recursive: true })
const name = process.argv[2] ?? 'baseline'
await page.screenshot({ path: `artifacts/${name}.png`, fullPage: true })
await writeFile(`artifacts/${name}.json`, JSON.stringify({ ...report, errors }, null, 2))
console.log(JSON.stringify({ ...report, errors }, null, 2))
await browser.close()
