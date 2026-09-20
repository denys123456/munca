import { test, expect } from '@playwright/test'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { buildCinematicTimeline } from '../src/experience/arteonTimeline.js'

const manifest = JSON.parse(readFileSync(new URL('../public/media/cinematic/manifest.json', import.meta.url)))
const timeline = buildCinematicTimeline(manifest)
const diagnostics = page => page.evaluate(() => document.querySelector('.experience-canvas').getDiagnostics())
const film = page => page.locator('.cinematic-film')
const progressFor = ordinal => (timeline.entries[ordinal].time + .012) / timeline.duration
async function startExperience(page) {
  await page.goto('/')
  await expect(page.locator('.experience-canvas')).toBeAttached()
  await expect(page.locator('.experience-loading')).toHaveCount(0, { timeout: 20000 })
  await expect(page.locator('.graphics-fallback')).toHaveCount(0)
  await expect.poll(async () => (await diagnostics(page)).displayedOrdinal).toBe(0)
}
async function scrollTo(page, progress) {
  await page.evaluate(value => {
    const root = document.querySelector('.automotive-experience')
    window.scrollTo(0, value * (root.offsetHeight - innerHeight))
  }, progress)
}
async function seek(page, ordinal) {
  await scrollTo(page, progressFor(ordinal))
  await page.waitForFunction(index => document.querySelector('.experience-canvas').getDiagnostics().displayedOrdinal === index, ordinal)
}

test('all 15 source moments and every boundary in both directions preserve stable opaque framing', async ({ page }) => {
  test.setTimeout(90000)
  const errors = [], broken = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => { if (response.url().includes('/media/cinematic/') && response.status() >= 400) broken.push(response.url()) })
  await page.addInitScript(() => {
    window.championsCommits = 0
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: () => { window.championsCommits++ }, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {} }
  })
  await startExperience(page)
  const commits = await page.evaluate(() => window.championsCommits)
  const initialSize = await film(page).boundingBox()
  const moments = [0, 120, 239, 240, 355, 479, timeline.segments[2].first, timeline.segments[2].first + 24, timeline.segments[2].first + 50, timeline.segments[2].first + 130, timeline.segments[2].last, timeline.segments[3].first + 100, timeline.segments[4].first, timeline.segments[4].first + 130, timeline.entries.length - 1]
  for (const ordinal of moments) {
    await seek(page, ordinal)
    const info = await diagnostics(page)
    expect(info.requestedOrdinal).toBe(ordinal)
    expect(info.buffering).toBe(false)
    expect(info.cachedFrames).toBeLessThanOrEqual(info.cacheLimit)
    expect(info.mediaErrors).toBe(0)
    expect(info.canvasWidth).toBe(1280)
    const box = await film(page).boundingBox()
    expect(box.width).toBeCloseTo(initialSize.width, 1)
    expect(box.height).toBeCloseTo(initialSize.height, 1)
    await page.screenshot({ path: `artifacts/cinematic/moment-${ordinal}.png` })
  }
  for (const boundary of timeline.segments.slice(1)) {
    for (const ordinal of [boundary.first - 2, boundary.first - 1, boundary.first, boundary.first + 1, boundary.first, boundary.first - 1]) {
      await seek(page, ordinal)
      expect((await diagnostics(page)).displayedClip).toBe(timeline.entries[ordinal].clip)
    }
  }
  await seek(page, 0)
  const beginning = await film(page).evaluate(canvas => canvas.toDataURL())
  await seek(page, timeline.entries.length - 1)
  expect(await film(page).evaluate(canvas => canvas.toDataURL())).toBe(beginning)
  const end = await diagnostics(page)
  await page.waitForTimeout(450)
  expect((await diagnostics(page)).frames).toBe(end.frames)
  expect(await page.evaluate(() => window.championsCommits)).toBe(commits)
  expect(errors).toEqual([]); expect(broken).toEqual([])
})

test('slow forward and reverse scrubbing reaches every original frame, without stale presentation', async ({ page }) => {
  test.setTimeout(240000)
  await startExperience(page)
  // Every one of the 720 unique source frames is reached through actual page scroll.
  for (let ordinal = 0; ordinal <= timeline.segments[2].last; ordinal++) await seek(page, ordinal)
  for (const ordinal of [721, 750, 800, 900, 950, 959, 1000, 1100, 1198, 1199, 1300, 1438]) await seek(page, Math.min(ordinal, timeline.entries.length - 1))
  const info = await diagnostics(page)
  expect(info.sourceFrameCount).toBe(720)
  expect(info.history.every(frame => frame.ordinal === frame.requested)).toBe(true)
  expect(info.fallbackPlayers).toBe(0)
  mkdirSync('artifacts/cinematic', { recursive: true })
  writeFileSync('artifacts/cinematic/exhaustive-scroll.json', JSON.stringify({ uniqueSourceFramesVisited: 720, diagnostics: info }, null, 2))
})

test('fast jumps, direction reversals, stops, and boundary interruption settle with one controller', async ({ page }) => {
  test.setTimeout(60000)
  await startExperience(page)
  await seek(page, 100)
  const before = await diagnostics(page)
  await page.mouse.wheel(0, 120)
  await page.waitForTimeout(35)
  const early = await diagnostics(page)
  await page.waitForTimeout(300)
  const settled = await diagnostics(page)
  expect(early.displayedOrdinal).toBeGreaterThan(before.displayedOrdinal)
  expect(settled.displayedOrdinal).toBeGreaterThanOrEqual(early.displayedOrdinal)
  expect(Math.abs(settled.lagSeconds)).toBe(0)
  expect(settled.settledMs).toBeLessThan(350)
  await page.waitForTimeout(350)
  expect((await diagnostics(page)).frames).toBe(settled.frames)
  for (const p of [.7, .15, .5, .85, .1, .6, .35, .98, .2]) { await scrollTo(page, p); await page.waitForTimeout(18) }
  await seek(page, 320)
  await page.mouse.wheel(0, -550)
  await page.waitForTimeout(30)
  expect((await diagnostics(page)).requestedOrdinal).toBeLessThan(320)
  for (const boundary of timeline.segments.slice(1)) {
    for (const ordinal of [boundary.first - 1, boundary.first + 1]) {
      await seek(page, ordinal)
      const stopped = await diagnostics(page)
      await page.waitForTimeout(300)
      expect((await diagnostics(page)).displayedClip).toBe(stopped.displayedClip)
    }
  }
  expect((await diagnostics(page)).history.every(frame => frame.ordinal === frame.requested)).toBe(true)
})

test('resize, repeated cycles and workspace round trips retain bounded resources', async ({ page }) => {
  test.setTimeout(60000)
  await startExperience(page)
  const client = await page.context().newCDPSession(page)
  await client.send('HeapProfiler.collectGarbage')
  const samples = []
  for (let cycle = 0; cycle < 4; cycle++) {
    for (const ordinal of [0, 300, 520, 719, 800, 1000, timeline.entries.length - 1]) await seek(page, ordinal)
    await client.send('HeapProfiler.collectGarbage')
    samples.push(await client.send('Runtime.getHeapUsage'))
  }
  expect(samples.at(-1).usedSize - samples[1].usedSize).toBeLessThan(5 * 1024 * 1024)
  await seek(page, 610)
  const buffer = await film(page).evaluate(canvas => [canvas.width, canvas.height])
  for (const viewport of [{ width: 1200, height: 700 }, { width: 900, height: 1000 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport)
    await page.waitForTimeout(350)
    expect(await film(page).evaluate(canvas => [canvas.width, canvas.height])).toEqual(buffer)
    const box = await film(page).boundingBox()
    expect(box.width / box.height).toBeCloseTo(16 / 9, 2)
    expect((await diagnostics(page)).displayedClip).toBe('clip3')
  }
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'WORKSPACE', exact: true }).click()
    await expect(page.locator('#workspace-content')).toBeVisible()
    const frames = (await diagnostics(page)).frames
    await page.waitForTimeout(200)
    expect((await diagnostics(page)).frames).toBe(frames)
    await page.getByRole('button', { name: 'EXPERIENCE', exact: true }).click()
    await expect(page.locator('.operational-workspace')).toHaveCount(0)
  }
  expect((await diagnostics(page)).videoPlayers).toBeLessThanOrEqual(3)
  expect((await diagnostics(page)).cachedFrames).toBeLessThanOrEqual(12)
  expect(await page.locator('.cinematic-film').count()).toBe(1)
  expect(await page.locator('.cinematic-particles').count()).toBe(1)
  writeFileSync('artifacts/cinematic/memory-cycles.json', JSON.stringify({ samples, diagnostics: await diagnostics(page) }, null, 2))
})

test('mobile and reduced motion preserve the complete frame and accessible navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await startExperience(page)
  expect((await diagnostics(page)).videoPlayers).toBe(0)
  expect((await diagnostics(page)).particleCount).toBe(0)
  for (let index = 0; index < timeline.chapterEntries.length; index++) {
    await scrollTo(page, timeline.chapterProgress[index])
    await expect.poll(async () => (await diagnostics(page)).displayedOrdinal).toBe(timeline.chapterEntries[index].ordinal)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.screenshot({ path: 'artifacts/cinematic/mobile-reduced-final.png' })
  await page.getByRole('button', { name: 'ENTER YOUR WORKSPACE', exact: true }).click()
  await expect(page.locator('#workspace-content')).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('button', { name: 'EXPERIENCE', exact: true }).click()
  await seek(page, 0)
  await page.screenshot({ path: 'artifacts/cinematic/mobile-hero.png' })
  await seek(page, 620)
  await page.screenshot({ path: 'artifacts/cinematic/mobile-engine.png' })
  expect((await diagnostics(page)).reducedMotion).toBe(false)
  expect((await film(page).boundingBox()).width).toBeCloseTo(390, 1)
})

test('delayed media cannot flash stale scenes; image compatibility fallback and failure exits work', async ({ page }) => {
  test.setTimeout(60000)
  await page.route('**/clip3/scrub.mp4', async route => { await new Promise(resolve => setTimeout(resolve, 700)); await route.continue().catch(() => {}) })
  await page.route('**/clip3/frames/0130.webp', async route => { await new Promise(resolve => setTimeout(resolve, 600)); await route.continue().catch(() => {}) })
  await startExperience(page)
  await scrollTo(page, progressFor(610))
  await page.waitForTimeout(40)
  await seek(page, 370)
  await page.waitForTimeout(1000)
  expect((await diagnostics(page)).displayedClip).toBe('clip2')
  expect((await diagnostics(page)).displayedOrdinal).toBe(370)
  await page.unrouteAll({ behavior: 'wait' })
  await page.addInitScript(() => { delete HTMLVideoElement.prototype.requestVideoFrameCallback })
  await startExperience(page)
  for (const ordinal of [120, 370, 550, 719, 850, 1000, 1438]) await seek(page, ordinal)
  expect((await diagnostics(page)).videoPlayers).toBe(0)
  expect((await diagnostics(page)).cachedFrames).toBeLessThanOrEqual(12)
  await page.route('**/media/cinematic/manifest.json', route => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.reload()
  await expect(page.locator('.graphics-fallback')).toBeVisible()
  await page.getByRole('button', { name: 'OPEN WORKSPACE ↗', exact: true }).click()
  await expect(page.locator('#workspace-content')).toBeVisible()
})

test('native touch scrolling reverses and a short landscape viewport contains the complete source', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await startExperience(page)
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true })
  async function drag(points) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: points[0] }] })
    for (const y of points.slice(1)) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] })
      await page.waitForTimeout(30)
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(700)
  }
  await drag([650, 590, 520, 460, 380, 300])
  const forward = (await diagnostics(page)).displayedOrdinal
  expect(forward).toBeGreaterThan(0)
  await drag([300, 380, 460, 520, 590, 650])
  expect((await diagnostics(page)).displayedOrdinal).toBeLessThan(forward)
  await session.detach()
  await page.setViewportSize({ width: 844, height: 390 })
  await seek(page, 719)
  const rect = await film(page).boundingBox()
  expect(rect.y).toBeGreaterThanOrEqual(-1)
  expect(rect.y + rect.height).toBeLessThanOrEqual(391)
  expect(rect.width / rect.height).toBeCloseTo(16 / 9, 2)
  await page.screenshot({ path: 'artifacts/cinematic/landscape-engine.png' })
})
