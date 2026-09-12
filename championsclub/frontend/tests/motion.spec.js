import { test, expect, start } from './helpers.js'

test('fountain pen draws paths once per session then holds and reveals', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/#/team-performance')
  await expect(page.getByRole('button', { name: 'Open book', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Open book', exact: true }).click()
  await expect(page.locator('.book-intro')).toHaveAttribute('data-phase', 'writing')
  await expect(page.locator('.publication-environment')).toHaveAttribute('inert')
  await page.waitForTimeout(1500)
  const ink = await page.locator('[data-ink]').evaluateAll((paths) => paths.map((path) => Number(path.style.strokeDashoffset)))
  expect(ink.some((value) => value === 0)).toBe(true)
  expect(ink.some((value) => value > 0)).toBe(true)
  await page.screenshot({ path: 'artifacts/reader-pen-writing.png' })
  await expect(page.locator('.book-intro')).toHaveAttribute('data-phase', 'holding', { timeout: 8000 })
  await page.screenshot({ path: 'artifacts/reader-inscription.png' })
  await page.waitForTimeout(2200)
  await expect(page.locator('.book-intro')).toHaveAttribute('data-phase', 'holding')
  await expect(page.locator('.book-intro')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('.book-intro')).toHaveCount(0)
})

test('mouse movement and scroll frames do not rerender the React tree', async ({ page }) => {
  await page.addInitScript(() => {
    window.championsCommits = 0
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: () => { window.championsCommits += 1 }, onCommitFiberUnmount: () => {}, onPostCommitFiberRoot: () => {} }
  })
  await start(page, 'alex-manager', 'team-performance', 'no-preference', false)
  await page.mouse.move(45, 920)
  await page.mouse.wheel(0, 100)
  await page.waitForTimeout(500)
  const initial = await page.evaluate(() => window.championsCommits)
  for (let step = 0; step < 30; step += 1) {
    await page.mouse.move(45 + step, 920)
    await page.mouse.wheel(0, 18)
  }
  await page.waitForTimeout(500)
  expect(await page.evaluate(() => window.championsCommits)).toBe(initial)
  expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0)
  const frames = await page.evaluate(() => new Promise((resolve) => {
    const samples = []
    let last = performance.now()
    function sample(time) {
      samples.push(time - last)
      last = time
      if (samples.length < 60) requestAnimationFrame(sample)
      else resolve(samples.sort((first, second) => first - second))
    }
    requestAnimationFrame(sample)
  }))
  expect(frames[55]).toBeLessThan(50)
  console.log('Frame intervals: median ' + frames[30].toFixed(1) + 'ms, p93 ' + frames[55].toFixed(1) + 'ms')
})

test('large wheel bursts stay in one chapter and direction reversal follows the same sheet', async ({ page }) => {
  await start(page, 'alex-manager', 'team-performance', 'no-preference', false)
  await page.mouse.move(45, 920)
  await page.mouse.wheel(0, 50000)
  await page.waitForTimeout(400)
  const first = Number(await page.locator('.is-front .paper-layer').getAttribute('data-progress'))
  expect(first).toBeLessThan(.04)
  await page.mouse.wheel(0, -80)
  await page.waitForTimeout(400)
  expect(Number(await page.locator('.is-front .paper-layer').getAttribute('data-progress'))).toBeLessThan(first)
  for (const delta of [60, 12, 4, -20, 5, 100, -75, 60]) { await page.mouse.wheel(0, delta); await page.waitForTimeout(20) }
  await expect(page.locator('.publication')).toHaveAttribute('data-route', 'team-performance')
})

test('reduced motion opens immediately and touch advances the spatial camera', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5173/#/team-performance')
  await expect(page.locator('.book-intro')).toHaveCount(0)
  const session = await context.newCDPSession(page)
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 90, y: 660 }] })
  for (const y of [620, 580, 530, 480]) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 90, y }] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  expect(Number(await page.locator('.is-front .paper-layer').getAttribute('data-progress'))).toBeGreaterThan(0)
  await context.close()
})

