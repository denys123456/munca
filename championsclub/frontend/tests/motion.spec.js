import { test, expect, start, navigate } from './helpers.js'

test('intro types individual characters once per session and reveals the workspace', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    window.introTextSamples = []
    const observer = new MutationObserver(() => {
      const text = document.querySelector('.intro-identity p')?.textContent
      if (typeof text === 'string' && window.introTextSamples.at(-1) !== text) window.introTextSamples.push(text)
    })
    observer.observe(document, { childList: true, subtree: true, characterData: true })
    setTimeout(() => observer.disconnect(), 5000)
  })
  await page.goto('/')
  await expect(page.locator('.intro-sequence')).toBeVisible()
  await expect(page.locator('.intro-sequence')).toHaveCount(0)
  const samples = await page.evaluate(() => window.introTextSamples)
  expect(samples.at(-1)).toBe('Turn performance into progress.')
  const lengths = samples.map((sample) => sample.length)
  expect(lengths).toContain(1)
  expect(lengths).toContain(2)
  for (let index = 1; index < lengths.length; index += 1) expect(lengths[index] - lengths[index - 1]).toBe(1)
  await expect(page.locator('.product-workspace')).not.toHaveAttribute('inert')
  await page.reload()
  await expect(page.locator('.intro-sequence')).toHaveCount(0)
  const separateSession = await page.context().browser().newContext()
  const freshPage = await separateSession.newPage()
  await freshPage.goto('http://127.0.0.1:5173')
  await expect(freshPage.locator('.intro-sequence')).toBeVisible()
  await separateSession.close()
})

test('focus dwell cancels early and quick movement never opens the wrong card', async ({ page }) => {
  await start(page, 'alex-manager', 'overview', 'no-preference')
  const cards = page.locator('[data-focusable]')
  await cards.first().hover()
  await page.waitForTimeout(400)
  await page.mouse.move(800, 150)
  await page.waitForTimeout(800)
  await expect(page.locator('[data-focus-layer]')).toHaveCount(0)
  for (let index = 0; index < 4; index += 1) { await cards.nth(index).hover(); await page.waitForTimeout(140) }
  await page.mouse.move(900, 150)
  await page.waitForTimeout(1100)
  await expect(page.locator('[data-focus-layer]')).toHaveCount(0)
  await cards.nth(2).hover()
  await expect(page.locator('.focused-card')).toBeVisible()
  await expect(page.locator('.focused-card')).toHaveAttribute('aria-label', 'Projected close')
  await page.waitForTimeout(300)
  const focused = await page.locator('.focused-card').boundingBox()
  expect(focused.x).toBeGreaterThanOrEqual(0)
  expect(focused.y).toBeGreaterThanOrEqual(0)
  expect(focused.x + focused.width).toBeLessThanOrEqual(1440)
  expect(focused.y + focused.height).toBeLessThanOrEqual(1000)
  expect(await page.locator('.focus-backdrop').evaluate((element) => getComputedStyle(element).backdropFilter)).toBe('blur(11px)')
  expect(await page.locator('.focused-card').evaluate((element) => getComputedStyle(element).filter)).toBe('none')
  await page.screenshot({ path: 'artifacts/focus-view.png' })
  await page.mouse.move(1300, 700)
  await expect(page.locator('[data-focus-layer]')).toHaveCount(0)
  await expect(cards.nth(2)).toHaveAttribute('data-focused', 'false')
})

test('focus cleans up on Escape, scroll, resize and route change', async ({ page }) => {
  await start(page, 'alex-manager', 'overview', 'no-preference')
  const card = page.locator('[data-focusable]').first()
  for (const dismissal of ['Escape', 'scroll', 'resize', 'route']) {
    await navigate(page, 'overview')
    await page.evaluate(() => scrollTo(0, 0))
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
    await page.mouse.move(1000, 150)
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    await card.hover()
    await expect(page.locator('.focused-card')).toBeVisible()
    if (dismissal === 'Escape') await page.keyboard.press('Escape')
    if (dismissal === 'scroll') {
      await page.evaluate(() => {
        window.focusScrollFinished = false
        document.addEventListener('scrollend', () => { window.focusScrollFinished = true }, { once: true })
      })
      await page.mouse.wheel(0, 300)
      await expect.poll(() => page.evaluate(() => window.focusScrollFinished)).toBe(true)
    }
    if (dismissal === 'resize') await page.setViewportSize({ width: 1200, height: 800 })
    if (dismissal === 'route') await navigate(page, 'rewards')
    await expect(page.locator('[data-focus-layer]')).toHaveCount(0)
    await page.mouse.move(1000, 160)
  }
})

test('touch and reduced motion disable delayed focus', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const page = await context.newPage()
  await start(page, 'alex-manager', 'overview', 'no-preference')
  await page.locator('[data-focusable]').first().tap()
  await page.waitForTimeout(1200)
  await expect(page.locator('[data-focus-layer]')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.intro-sequence')).toHaveCount(0)
  await context.close()
})

test('pointer movement produces no React commits or persistent animation loops', async ({ page }) => {
  await page.addInitScript(() => {
    window.championsCommits = 0
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true, inject: () => 1,
      onCommitFiberRoot: () => { window.championsCommits += 1 },
      onCommitFiberUnmount: () => {},
      onPostCommitFiberRoot: () => {}
    }
  })
  await start(page, 'alex-manager', 'overview', 'no-preference')
  await page.waitForTimeout(600)
  const initial = await page.evaluate(() => window.championsCommits)
  for (let step = 0; step < 48; step += 1) await page.mouse.move(150 + (step % 12) * 90, 260 + (step % 4) * 20)
  await page.mouse.move(800, 130)
  const final = await page.evaluate(() => window.championsCommits)
  expect(final).toBe(initial)
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0)
})

