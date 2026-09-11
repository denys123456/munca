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

export async function start(page, account = 'alex-manager', route = 'overview', motion = 'reduce') {
  await page.emulateMedia({ reducedMotion: motion })
  await page.addInitScript((id) => {
    if (!sessionStorage.getItem('championsclub-account')) sessionStorage.setItem('championsclub-account', id)
    sessionStorage.setItem('championsclub-intro-seen', 'true')
  }, account)
  await page.goto('/#' + route)
  await expect(page.locator('#workspace-content')).toBeVisible()
}

export async function navigate(page, route) {
  await page.evaluate((next) => { location.hash = next }, route)
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#' + route)
  await expect(page.locator('#workspace-content')).toBeVisible()
}

export async function state(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('championsclub-workspace-v3'))?.data)
}
