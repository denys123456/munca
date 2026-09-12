import { test, expect, start, navigate, changeAccount, enterWorking } from './helpers.js'
import { mkdir } from 'node:fs/promises'

const accounts = [
  { id: 'alex-manager', role: 'manager', routes: ['overview', 'team-performance', 'advisors', 'targets', 'forecasts', 'alerts', 'leaderboard', 'rewards', 'ai-insights', 'dealership-activity', 'profile', 'advisor-detail/3', 'closing'] },
  { id: 'jane-advisor', role: 'advisor', routes: ['overview', 'my-performance', 'targets', 'rewards', 'ai-insights', 'alerts', 'sales-history', 'profile', 'closing'] },
  { id: 'john-admin', role: 'admin', routes: ['admin-overview', 'admin-users', 'admin-dealerships', 'admin-products', 'admin-point-rules', 'admin-rewards', 'admin-gamification', 'admin-targets', 'admin-health', 'admin-audit', 'admin-settings', 'profile', 'closing'] }
]

for (const account of accounts) {
  test(account.role + ' chapters render at desktop, tablet and phone widths', async ({ page }) => {
    test.setTimeout(120000)
    await start(page, account.id, account.routes[0], 'reduce', false)
    await mkdir('artifacts/reader', { recursive: true })
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 })
      for (const route of account.routes) {
        await navigate(page, route, false)
        const sheet = page.locator('.is-front .paper-layer')
        await expect(sheet.locator('h1')).toHaveCount(1)
        await expect(sheet).not.toContainText('NaN')
        await expect(sheet).not.toContainText('undefined')
        expect(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth && scrollY === 0)).toBe(true)
        await expect(page.locator('vite-error-overlay')).toHaveCount(0)
        if ([1440, 390].includes(width) && ['team-performance', 'forecasts', 'rewards', 'leaderboard', 'ai-insights', 'admin-overview'].includes(route)) await page.screenshot({ path: 'artifacts/reader/' + account.role + '-' + route + '-' + width + '.png' })
      }
    }
  })
}

test('bookmarks skim with one destination underneath and browser Back restores the sheet', async ({ page }) => {
  await start(page, 'alex-manager', 'team-performance', 'no-preference', false)
  await page.keyboard.press('PageDown')
  await page.waitForTimeout(400)
  await page.getByRole('link', { name: 'Rewards', exact: true }).click()
  await expect(page.locator('.publication')).toHaveAttribute('data-mode', 'NAVIGATING_DIRECTLY')
  const position = await page.locator('.is-front .paper-layer').getAttribute('data-progress')
  expect(await page.locator('.paper-layer').count()).toBe(2)
  await expect(page).toHaveURL('http://127.0.0.1:5173/#/team-performance')
  await expect(page.locator('.publication')).toHaveAttribute('data-route', 'rewards')
  await page.waitForTimeout(350)
  await page.goBack()
  await expect(page.locator('.publication')).toHaveAttribute('data-route', 'team-performance')
  await expect(page.locator('.is-front .paper-layer')).toHaveAttribute('data-progress', position)
  await page.reload()
  await expect(page.locator('.publication')).toHaveAttribute('data-route', 'team-performance')
})

test('search, account identity and route permission remain synchronized', async ({ page }) => {
  await start(page)
  await page.getByLabel('Search the book').click()
  await page.getByRole('combobox', { name: 'Search ChampionsClub' }).fill('Alex Smith')
  await page.getByRole('option').first().click()
  await expect(page.locator('.publication')).toHaveAttribute('data-route', 'advisor-detail/3')
  await enterWorking(page)
  await expect(page.locator('.is-front .profile-hero h2')).toHaveText('Alex Smith')
  await changeAccount(page, 'jane-advisor')
  await expect(page.locator('.ownership-mark')).toContainText('Jane Doe')
  await expect(page.getByRole('link', { name: 'Team Performance', exact: true })).toHaveCount(0)
  await page.evaluate(() => { location.hash = '/admin-users' })
  await expect(page).toHaveURL('http://127.0.0.1:5173/#/overview')
  await changeAccount(page, 'john-admin')
  await expect(page.locator('.ownership-mark')).toContainText('John Doe')
  await expect(page.locator('.publication')).toHaveAttribute('data-route', 'admin-overview')
  await expect(page.getByRole('link', { name: 'Users', exact: true })).toHaveCount(1)
})
