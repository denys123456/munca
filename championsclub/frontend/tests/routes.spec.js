import { test, expect, start, navigate } from './helpers.js'
import { mkdir } from 'node:fs/promises'

const accounts = [
  { id: 'alex-manager', role: 'manager', routes: ['overview', 'team-performance', 'advisors', 'targets', 'forecasts', 'alerts', 'leaderboard', 'rewards', 'ai-insights', 'dealership-activity', 'profile', 'advisor-detail/3'] },
  { id: 'jane-advisor', role: 'advisor', routes: ['overview', 'my-performance', 'targets', 'rewards', 'ai-insights', 'alerts', 'sales-history', 'profile'] },
  { id: 'john-admin', role: 'admin', routes: ['admin-overview', 'admin-users', 'admin-dealerships', 'admin-products', 'admin-point-rules', 'admin-rewards', 'admin-gamification', 'admin-targets', 'admin-health', 'admin-audit', 'admin-settings', 'profile'] }
]

for (const account of accounts) {
  test(account.role + ' routes render at desktop, tablet and phone widths', async ({ page }) => {
    await start(page, account.id, account.routes[0])
    await mkdir('artifacts/screenshots', { recursive: true })
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 })
      for (const route of account.routes) {
        await navigate(page, route)
        await expect(page.locator('h1')).toHaveCount(1)
        await expect(page.locator('#workspace-content')).not.toContainText('NaN')
        await expect(page.locator('#workspace-content')).not.toContainText('undefined')
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
        expect(overflow, account.role + ' / ' + route + ' / ' + width).toBe(false)
        await expect(page.locator('vite-error-overlay')).toHaveCount(0)
        if ((width === 1440 || width === 390) && ['overview', 'rewards', 'forecasts', 'leaderboard', 'ai-insights', 'admin-overview', 'admin-gamification', 'profile'].includes(route)) {
          await page.screenshot({ path: 'artifacts/screenshots/' + account.role + '-' + route + '-' + width + '.png', fullPage: true })
        }
      }
    }
  })
}

test('rail expansion leaves the content fixed and separates active, hover and focus', async ({ page }) => {
  await start(page, 'alex-manager', 'overview', 'no-preference')
  const before = await page.locator('.product-workspace').boundingBox()
  await page.locator('.main-navigation a').nth(2).hover()
  await expect.poll(() => page.locator('.sidebar').evaluate((element) => element.getBoundingClientRect().width)).toBe(252)
  const expanded = await page.locator('.product-workspace').boundingBox()
  expect(expanded.x).toBe(before.x)
  expect(expanded.width).toBe(before.width)
  await page.mouse.move(800, 120)
  await expect.poll(() => page.locator('.sidebar').evaluate((element) => element.getBoundingClientRect().width)).toBe(82)
  await expect(page.locator('.main-navigation [aria-current="page"]')).toHaveCount(1)
  await expect(page.locator('.main-navigation a:hover')).toHaveCount(0)
  await page.locator('.main-navigation a[href="#advisors"]').click()
  await expect(page.locator('h1')).toHaveText('Advisors')
  await page.goBack()
  await expect(page.locator('h1')).toHaveText('Executive Overview')
})

test('search opens the correct advisor and stays within role permissions', async ({ page }) => {
  await start(page)
  const search = page.getByRole('combobox', { name: 'Search ChampionsClub' })
  await search.fill('Alex Smith')
  await page.getByRole('option').first().click()
  await expect(page.locator('.profile-hero h2')).toHaveText('Alex Smith')
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#advisor-detail/3')
  await search.fill('nonexistent query')
  await expect(page.locator('.search-empty')).toBeVisible()
  await search.press('Escape')
  await expect(page.locator('.search-panel')).toHaveCount(0)
  await page.getByLabel('Demo account switcher').selectOption('jane-advisor')
  await expect(page.locator('h1')).toHaveText('Overview')
  await search.fill('Classic')
  await search.press('Enter')
  await expect(page.locator('h1')).toHaveText('Sales History')
  await navigate(page, 'admin-users')
  await expect(page.locator('h1')).toHaveText('Overview')
  await page.getByLabel('Demo account switcher').selectOption('john-admin')
  await search.fill('Premium Fuel')
  await search.press('Enter')
  await expect(page.locator('h1')).toHaveText('Reward Catalog')
})
