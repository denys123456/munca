import { test, expect } from '@playwright/test'

async function openTeam(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('championsclub-account', 'alex-manager')
    sessionStorage.setItem('championsclub-book-opened', 'true')
  })
  await page.goto('/#/team-performance')
  await page.mouse.move(700, 700)
  await expect(page.locator('.publication')).toHaveAttribute('data-route', 'team-performance')
}

async function progress(page) {
  return Number(await page.locator('.sheet-slot.is-front .paper-layer').getAttribute('data-progress'))
}

async function travel(page, destination) {
  await page.mouse.move(50, 920)
  for (let step = 0; step < 160 && await progress(page) < destination - .001; step += 1) {
    await page.mouse.wheel(0, Math.min(200, Math.max(12, (destination - await progress(page)) * 8800)))
    await page.waitForTimeout(45)
  }
  await page.waitForTimeout(300)
}

test('Team is a long lateral and diagonal journey with a held scroll curl', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('requestfailed', (request) => errors.push(request.url()))
  await openTeam(page)
  await page.screenshot({ path: 'artifacts/spatial-team-opening.png' })
  await page.mouse.wheel(0, 120)
  await page.mouse.wheel(0, 120)
  await page.waitForTimeout(350)
  expect(await progress(page)).toBeLessThan(.05)
  expect(Number(await page.locator('.is-front .paper-layer').getAttribute('data-camera-x'))).toBeGreaterThan(0)
  expect(Number(await page.locator('.is-front .paper-layer').getAttribute('data-camera-y'))).toBe(0)
  await travel(page, .2)
  await page.screenshot({ path: 'artifacts/spatial-team-target.png' })
  expect(Number(await page.locator('.is-front .paper-layer').getAttribute('data-camera-y'))).toBeGreaterThan(.1)
  await travel(page, .35)
  await page.screenshot({ path: 'artifacts/spatial-team-trajectory.png' })
  await travel(page, 1)
  await expect(page.locator('.publication')).toHaveAttribute('data-edge', 'end')
  await page.screenshot({ path: 'artifacts/spatial-team-end.png' })
  await page.mouse.wheel(0, 120)
  await page.waitForTimeout(250)
  for (let index = 0; index < 5; index += 1) { await page.mouse.wheel(0, 160); await page.waitForTimeout(50) }
  await expect(page.locator('.publication')).toHaveAttribute('data-mode', 'CURLING_WITH_SCROLL')
  const fold = Number(await page.locator('.publication').getAttribute('data-curl-progress'))
  expect(fold).toBeGreaterThan(.15)
  expect(fold).toBeLessThan(.82)
  await page.waitForTimeout(900)
  expect(Number(await page.locator('.publication').getAttribute('data-curl-progress'))).toBe(fold)
  await page.screenshot({ path: 'artifacts/spatial-curl-held.png' })
  await expect(page.locator('.is-under [data-sheet="advisors"]')).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth && scrollY === 0)).toBe(true)
  expect(errors).toEqual([])
})

test('corner drag holds, reverses, cancels and completes one turn', async ({ page }) => {
  await openTeam(page)
  await page.keyboard.press('End')
  await page.waitForTimeout(750)
  const corner = page.getByRole('button', { name: 'Pull bottom-right corner toward top-left to turn page' })
  await corner.hover()
  const bounds = await corner.boundingBox()
  const x = bounds.x + bounds.width - 20
  const y = bounds.y + bounds.height - 20
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x - 340, y - 230, { steps: 15 })
  const held = Number(await page.locator('.publication').getAttribute('data-curl-progress'))
  await page.waitForTimeout(400)
  expect(Number(await page.locator('.publication').getAttribute('data-curl-progress'))).toBeCloseTo(held, 2)
  await page.mouse.move(x - 120, y - 80, { steps: 8 })
  expect(Number(await page.locator('.publication').getAttribute('data-curl-progress'))).toBeLessThan(held)
  await page.mouse.up()
  await page.waitForTimeout(600)
  await expect(page.locator('.publication')).toHaveAttribute('data-route', 'team-performance')
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(50, 50, { steps: 25 })
  await page.screenshot({ path: 'artifacts/spatial-drag.png' })
  await page.mouse.up()
  await expect(page.locator('.publication')).toHaveAttribute('data-route', 'advisors')
  await expect(page).toHaveURL('http://127.0.0.1:5173/#/advisors')
})

