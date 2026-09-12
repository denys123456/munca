import { expect, test as base } from '@playwright/test'

export const test = base.extend({
  appErrors: [async ({ page }, use) => {
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('requestfailed', (request) => { if (!request.failure()?.errorText.includes('ERR_ABORTED')) errors.push(request.failure()?.errorText) })
    await use(errors)
    expect(errors).toEqual([])
  }, { auto: true }]
})

export { expect }

export async function enterWorking(page) {
  const entry = page.locator('.is-front .working-entry')
  if (await entry.count()) {
    await entry.click()
    await expect.poll(() => page.locator('.is-front .paper-layer').getAttribute('data-progress')).toBe('0.50000')
  }
}

export async function start(page, account = 'alex-manager', route = 'overview', motion = 'reduce', working = true) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.addInitScript((id) => {
    if (!sessionStorage.getItem('championsclub-account')) sessionStorage.setItem('championsclub-account', id)
    sessionStorage.setItem('championsclub-book-opened', 'true')
  }, account)
  await page.goto('/#/' + route)
  await expect(page.locator('.publication')).toHaveAttribute('data-route', route)
  await expect(page.locator('#workspace-content')).toBeVisible()
  if (working) await enterWorking(page)
}

export async function navigate(page, route, working = true) {
  await page.evaluate((next) => { location.hash = '/' + next }, route)
  await expect(page.locator('.publication')).toHaveAttribute('data-route', route)
  await expect(page.locator('#workspace-content')).toBeVisible()
  await page.waitForTimeout(240)
  if (working) await enterWorking(page)
}

export async function changeAccount(page, id) {
  await page.getByLabel('Choose demo account').click()
  await page.getByLabel('Demo account switcher').selectOption(id)
  await expect(page.locator('.identity-transition')).toHaveCount(0)
}

export async function travelTo(page, destination) {
  await page.mouse.move(45, (await page.viewportSize()).height - 75)
  for (let index = 0; index < 180; index += 1) {
    const progress = Number(await page.locator('.is-front .paper-layer').getAttribute('data-progress'))
    if (Math.abs(progress - destination) < .015) break
    await page.mouse.wheel(0, progress < destination ? 120 : -120)
    await page.waitForTimeout(25)
  }
  await page.waitForTimeout(250)
}

export async function state(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('championsclub-workspace-v3'))?.data)
}
