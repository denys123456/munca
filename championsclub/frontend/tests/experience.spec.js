import { test, expect } from '@playwright/test'
import { chapterFrames } from '../src/experience/arteonTimeline.js'

const diagnostics = (page) => page.evaluate(() => document.querySelector('.experience-canvas').getDiagnostics())
async function startExperience(page) {
  await page.goto('/')
  await expect(page.locator('.experience-canvas')).toBeAttached()
  await expect(page.locator('.experience-loading')).toHaveCount(0, { timeout: 20000 })
  await expect(page.locator('.graphics-fallback')).toHaveCount(0)
  await expect.poll(async () => (await diagnostics(page)).displayedFrame).toBe(0)
}
async function seek(page, frame) {
  await page.evaluate((index) => {
    const root = document.querySelector('.automotive-experience')
    window.scrollTo(0, index / 239 * (root.offsetHeight - innerHeight))
  }, frame)
  await expect.poll(async () => (await diagnostics(page)).displayedFrame).toBe(frame)
}

test('all source events scrub, stop, reverse and hold the ending without React frame updates', async ({ page }) => {
  test.setTimeout(90000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.addInitScript(() => {
    window.championsCommits = 0
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: () => { window.championsCommits++ }, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {} }
  })
  await startExperience(page)
  const commits = await page.evaluate(() => window.championsCommits)
  expect(await page.evaluate(() => (document.querySelector('.automotive-experience').offsetHeight - innerHeight) / innerHeight)).toBeCloseTo(9, 1)
  for (const frame of [0, 30, 72, 96, 111, 126, 142, 150, 156, 165, 174, 181, 188, 192, 198, 201, 211, 239]) {
    await seek(page, frame)
    const info = await diagnostics(page)
    expect(info.cachedFrames).toBeLessThanOrEqual(info.cacheLimit)
    expect(info.decodedBytes).toBeLessThanOrEqual(104000000)
    expect(info.inFlight).toBeLessThanOrEqual(3)
    expect(info.requestedFrame).toBe(frame)
    await page.screenshot({ path: `artifacts/arteon/frame-${frame}.png` })
  }
  const final = await diagnostics(page)
  await page.waitForTimeout(600)
  expect((await diagnostics(page)).frames).toBe(final.frames)
  expect((await diagnostics(page)).displayedFrame).toBe(239)
  await seek(page, 170)
  const pixels = await page.locator('canvas').evaluate((canvas) => canvas.toDataURL())
  await seek(page, 90)
  await seek(page, 170)
  expect(await page.locator('canvas').evaluate((canvas) => canvas.toDataURL())).toBe(pixels)
  const before = await diagnostics(page)
  await page.waitForTimeout(700)
  expect((await diagnostics(page)).frames).toBe(before.frames)
  expect(await page.evaluate(() => window.championsCommits)).toBe(commits)
  await page.mouse.wheel(0, 550)
  await expect.poll(async () => (await diagnostics(page)).displayedFrame).toBeGreaterThan(170)
  await page.waitForTimeout(1000)
  const stopped = await diagnostics(page)
  await page.waitForTimeout(400)
  expect((await diagnostics(page)).frames).toBe(stopped.frames)
  await page.mouse.wheel(0, -550)
  await expect.poll(async () => (await diagnostics(page)).displayedFrame).toBeLessThan(stopped.displayedFrame)
  expect(errors).toEqual([])
})

test('chapter selection and workspace round trips preserve the source frame and bounded cache', async ({ page }) => {
  await startExperience(page)
  await page.getByLabel('Open chapter index').click()
  await page.getByRole('button', { name: '06 Mechanical harmony ↗', exact: true }).click()
  await expect.poll(async () => (await diagnostics(page)).displayedFrame).toBe(156)
  await expect(page.locator('.automotive-experience')).toHaveAttribute('data-chapter', '5')
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', { name: 'WORKSPACE', exact: true }).click()
    await expect(page.locator('#workspace-content')).toBeVisible()
    const paused = await diagnostics(page)
    await page.waitForTimeout(200)
    expect((await diagnostics(page)).frames).toBe(paused.frames)
    await page.getByRole('button', { name: 'EXPERIENCE', exact: true }).click()
    await expect(page.locator('.operational-workspace')).toHaveCount(0)
  }
  expect((await diagnostics(page)).displayedFrame).toBe(156)
  expect((await diagnostics(page)).cachedFrames).toBeLessThanOrEqual(28)
  expect(await page.locator('canvas').count()).toBe(1)
  await page.getByRole('button', { name: 'CC—01 / ARTEON CINEMATIC ↗' }).click()
  await expect(page.locator('.model-information')).toContainText('Volkswagen Arteon source footage')
})

test('mobile reduced motion uses static chapters and still reaches the final source frame', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await startExperience(page)
  expect((await diagnostics(page)).variant).toBe('mobile')
  expect((await diagnostics(page)).decodes).toBe(1)
  for (const frame of chapterFrames) {
    await seek(page, frame)
    expect((await diagnostics(page)).reducedMotion).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.screenshot({ path: 'artifacts/arteon/mobile-reduced-final.png' })
  await page.getByRole('button', { name: 'ENTER YOUR WORKSPACE', exact: true }).click()
  await expect(page.locator('#workspace-content')).toBeVisible()
})

test('mobile full motion keeps framing and reverses touch scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await startExperience(page)
  await page.screenshot({ path: 'artifacts/arteon/mobile-hero.png' })
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true })
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 620 }] })
  for (const y of [580, 530, 470, 410, 350]) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] })
    await page.waitForTimeout(25)
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(async () => (await diagnostics(page)).displayedFrame).toBeGreaterThan(0)
  // Let the browser's native touch momentum finish before absolute seeking.
  await page.waitForTimeout(1200)
  await session.detach()
  await seek(page, 170)
  await page.screenshot({ path: 'artifacts/arteon/mobile-engine.png' })
  await seek(page, 0)
  expect((await diagnostics(page)).variant).toBe('mobile')
  expect((await diagnostics(page)).decodedBytes).toBeLessThanOrEqual(24 * 640 * 360 * 4)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('late images cannot overwrite a newer requested frame and misses hold the canvas', async ({ page }) => {
  await page.route('**/desktop/0100.webp', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700))
    await route.continue().catch(() => {})
  })
  await startExperience(page)
  await page.evaluate(() => window.scrollTo(0, 100 / 239 * (document.querySelector('.automotive-experience').offsetHeight - innerHeight)))
  await expect.poll(async () => (await diagnostics(page)).requestedFrame).toBe(100)
  expect((await diagnostics(page)).displayedFrame).toBeGreaterThanOrEqual(0)
  await seek(page, 192)
  const before = await page.locator('canvas').evaluate((canvas) => canvas.toDataURL())
  await page.waitForTimeout(1000)
  expect((await diagnostics(page)).displayedFrame).toBe(192)
  expect(await page.locator('canvas').evaluate((canvas) => canvas.toDataURL())).toBe(before)
})

test('transparent assets render over dark, light and existing backgrounds', async ({ page }) => {
  await startExperience(page)
  for (const frame of [0, 96, 170, 198, 239]) {
    await seek(page, frame)
    for (const [name, color] of [['dark', '#11181d'], ['light', '#ffffff'], ['existing', '#e6e9e8']]) {
      await page.locator('.experience-stage').evaluate((element, background) => { element.style.background = background }, color)
      await page.screenshot({ path: `artifacts/arteon/background-${frame}-${name}.png` })
    }
    const pixels = await page.locator('canvas').evaluate((canvas) => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
      let clear = 0, opaque = 0, green = 0
      for (let p = 0; p < data.length; p += 4) {
        if (data[p + 3] === 0) clear++
        if (data[p + 3] > 240) opaque++
        if (data[p + 3] > 80 && data[p + 1] > Math.max(data[p], data[p + 2]) + 12) green++
      }
      return { clear, opaque, green }
    })
    expect(pixels.clear).toBeGreaterThan(10000)
    expect(pixels.opaque).toBeGreaterThan(10000)
    expect(pixels.green).toBe(0)
  }
})

test('unavailable media and a lost canvas leave a usable workspace exit', async ({ page }) => {
  await page.route('**/media/arteon/manifest.json', (route) => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.goto('/')
  await expect(page.locator('.graphics-fallback')).toBeVisible()
  await page.getByRole('button', { name: 'OPEN WORKSPACE ↗', exact: true }).click()
  await expect(page.locator('#workspace-content')).toBeVisible()
  await page.unroute('**/media/arteon/manifest.json')
  await startExperience(page)
  await page.evaluate(() => document.querySelector('canvas').dispatchEvent(new Event('contextlost', { cancelable: true })))
  await expect(page.locator('.graphics-fallback')).toBeVisible()
  await page.getByRole('button', { name: 'OPEN WORKSPACE ↗', exact: true }).click()
  await expect(page.locator('#workspace-content')).toBeVisible()
})
