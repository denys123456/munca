import { expect, test as base } from '@playwright/test'

export const test = base.extend({
  appErrors: [async ({ page }, use) => {
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    await use(errors)
    expect(errors).toEqual([])
  }, { auto: true }]
})

export { expect }

export async function enterWorking(page) {
  await expect(page.locator('#workspace-content')).toBeVisible()
}

export async function start(page, account = 'alex-manager', route = 'overview', motion = 'reduce') {
  await page.emulateMedia({ reducedMotion: motion })
  await page.addInitScript((id) => {
    if (!sessionStorage.getItem('championsclub-account')) sessionStorage.setItem('championsclub-account', id)
  }, account)
  await page.goto('/#/workspace/' + route)
  await expect(page.locator('.operational-workspace')).toHaveAttribute('data-route', route.split('/')[0])
  await enterWorking(page)
}

export async function navigate(page, route) {
  await page.evaluate((next) => { location.hash = '/workspace/' + next }, route)
  await expect(page.locator('.operational-workspace')).toHaveAttribute('data-route', route.split('/')[0])
  await enterWorking(page)
}

export async function changeAccount(page, id) {
  const names = { 'jane-advisor': 'Jane Doe', 'alex-manager': 'Alex Smith', 'john-admin': 'John Doe' }
  await page.getByLabel('Choose demo account').click()
  await page.locator('.account-options button').filter({ hasText: names[id] }).click()
  await expect(page.locator('.identity-transition')).toHaveCount(0)
  await expect(page.locator('.account-toggle')).toContainText(names[id])
}

export async function travelTo(page, destination) {
  await page.evaluate((progress) => {
    const root = document.querySelector('.automotive-experience')
    window.scrollTo(0, progress * (root.offsetHeight - innerHeight))
  }, destination)
  await expect.poll(async () => Number(await page.locator('.automotive-experience').getAttribute('data-progress'))).toBeCloseTo(destination, 3)
}

export async function state(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('championsclub-workspace-v3'))?.data)
}
