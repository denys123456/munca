import { test, expect, start, navigate } from './helpers.js'

const accounts = [
  { id: 'alex-manager', role: 'manager', routes: ['overview', 'team-performance', 'advisors', 'targets', 'forecasts', 'alerts', 'leaderboard', 'rewards', 'ai-insights', 'dealership-activity', 'profile', 'advisor-detail/3'] },
  { id: 'jane-advisor', role: 'advisor', routes: ['overview', 'my-performance', 'targets', 'rewards', 'ai-insights', 'alerts', 'sales-history', 'profile'] },
  { id: 'john-admin', role: 'admin', routes: ['admin-overview', 'admin-users', 'admin-dealerships', 'admin-products', 'admin-point-rules', 'admin-rewards', 'admin-gamification', 'admin-targets', 'admin-health', 'admin-audit', 'admin-settings', 'profile'] }
]

for (const account of accounts) {
  test(`${account.role} workspaces render at desktop and mobile widths`, async ({ page }) => {
    test.setTimeout(90000)
    await start(page, account.id, account.routes[0])
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
      for (const route of account.routes) {
        await navigate(page, route)
        const workspace = page.locator('.operational-workspace')
        await expect(workspace.locator('h1')).toHaveCount(1)
        await expect(workspace).not.toContainText('NaN')
        await expect(workspace).not.toContainText('undefined')
        expect(await workspace.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
        await expect(page.locator('vite-error-overlay')).toHaveCount(0)
      }
      await page.screenshot({ path: `artifacts/automotive/${account.role}-workspace-${width}.png` })
    }
  })
}
