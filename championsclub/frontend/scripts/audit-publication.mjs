import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { journeyFor } from '../src/components/publication/chapterJourneys.js'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ reducedMotion: 'reduce' })
const errors = []
const requests = []
const compositions = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
page.on('requestfailed', (request) => errors.push(request.url()))
page.on('response', (response) => { if (response.status() >= 400) requests.push({ url: response.url(), status: response.status() }) })
await page.addInitScript(() => {
  sessionStorage.setItem('championsclub-account', 'alex-manager')
  sessionStorage.setItem('championsclub-book-opened', 'true')
})
await mkdir('artifacts/compositions', { recursive: true })

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 1280, height: 720 }]) {
  await page.setViewportSize(viewport)
  for (const route of ['team-performance', 'forecasts', 'ai-insights', 'rewards', 'leaderboard', 'advisors']) {
    await page.goto('http://127.0.0.1:5173/?composition=' + viewport.width + '-' + route + '#/' + route)
    await page.locator('.publication').waitFor()
    await page.waitForFunction((chapter) => document.querySelector('.publication')?.dataset.route === chapter, route)
    await page.waitForTimeout(300)
    const journey = journeyFor(route)
    for (let index = 0; index < journey.stops.length; index += 1) {
      await page.evaluate(({ destination, distance }) => {
        const reader = document.querySelector('.publication')
        const sheet = reader.querySelector('.is-front .paper-layer')
        for (let step = 0; step < 100; step += 1) {
          const progress = Number(sheet.dataset.progress)
          if (Math.abs(destination - progress) < .00002) break
          const deltaY = Math.max(-240, Math.min(240, (destination - progress) * Math.max(4200, innerHeight * distance)))
          reader.dispatchEvent(new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true }))
        }
      }, { destination: index / (journey.stops.length - 1), distance: journey.distance })
      await page.waitForTimeout(30)
      const result = await page.evaluate((sceneIndex) => {
        const sheet = document.querySelector('.is-front .paper-layer')
        const scene = [...sheet.querySelectorAll('[data-scene]')].find((element) => Number(element.dataset.scene) <= sceneIndex && Number(element.dataset.sceneEnd ?? element.dataset.scene) >= sceneIndex)
        const clipped = [...scene.querySelectorAll('h1,h2,blockquote,.print-amount,.print-label,.chapter-deck,.printed-scroll,.editorial-note,.print-link,.end-colophon')].flatMap((element) => {
          if (element.closest('[data-local-scroll],.local-workspace')) return []
          const bounds = element.getBoundingClientRect()
          if (!bounds.height || bounds.right < 0 || bounds.left > innerWidth) return []
          return bounds.top < 76 || bounds.bottom > innerHeight - 50 ? [{ text: element.textContent.slice(0, 65), top: Math.round(bounds.top), bottom: Math.round(bounds.bottom) }] : []
        })
        return { progress: sheet.dataset.progress, x: sheet.dataset.cameraX, y: sheet.dataset.cameraY, clipped, horizontalOverflow: document.documentElement.scrollWidth > innerWidth }
      }, index)
      compositions.push({ route, width: viewport.width, height: viewport.height, scene: index, ...result })
      if (viewport.width !== 1280 && ((route === 'team-performance' && [0, 3, 5, 6, 8, 10].includes(index)) || (route === 'forecasts' && [1, 2, 4, 6].includes(index)) || (route === 'advisors' && index === 0))) await page.screenshot({ path: `artifacts/compositions/${route}-${index}-${viewport.width}.png` })
    }
  }
}

await writeFile('artifacts/composition-audit.json', JSON.stringify({ errors, requests, compositions }, null, 2))
console.log(JSON.stringify({ errors, requests, stopsInspected: compositions.length, clipped: compositions.filter((item) => item.clipped.length), overflow: compositions.filter((item) => item.horizontalOverflow) }, null, 2))
await browser.close()
