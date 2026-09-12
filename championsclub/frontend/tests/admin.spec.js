import { test, expect, start, navigate, state, enterWorking, changeAccount } from './helpers.js'

const collections = [
  { route: 'admin-users', name: 'Taylor Grant', fields: { Name: 'Taylor Grant', Email: 'taylor@example.com' }, search: 'Search users' },
  { route: 'admin-dealerships', name: 'Apex East', fields: { Name: 'Apex East', City: 'Iasi', Region: 'East' }, search: 'Search dealerships' },
  { route: 'admin-products', name: 'Electric Advantage', fields: { Name: 'Electric Advantage', Points: '25', Purpose: 'Sustainable mobility' }, search: 'Search financial products' },
  { route: 'admin-point-rules', name: 'Renewal Advantage', fields: { Name: 'Renewal Advantage', Points: '18', Purpose: 'Renewal growth' }, search: 'Search point rules' },
  { route: 'admin-rewards', name: 'A weekend away', fields: { Name: 'A weekend away', Category: 'Travel', Points: '4000' }, search: 'Search reward catalog' }
]

for (const collection of collections) {
  test(collection.route + ' supports create, edit, search and confirmed deletion', async ({ page }) => {
    await start(page, 'john-admin', collection.route)
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    for (const [name, value] of Object.entries(collection.fields)) await page.getByRole('dialog').getByLabel(name, { exact: true }).fill(value)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByLabel(collection.search, { exact: true }).fill(collection.name)
    await expect(page.locator('.is-front .admin-row')).toHaveCount(1)
    await page.getByRole('button', { name: 'Edit ' + collection.name, exact: true }).click()
    await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill(collection.name + ' Plus')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.reload()
    await enterWorking(page)
    await page.getByLabel(collection.search, { exact: true }).fill(collection.name)
    await expect(page.locator('.is-front .admin-row')).toContainText(collection.name + ' Plus')
    await page.getByRole('button', { name: 'Delete ' + collection.name + ' Plus', exact: true }).click()
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(page.locator('.is-front .admin-row')).toHaveCount(1)
    await page.getByRole('button', { name: 'Delete ' + collection.name + ' Plus', exact: true }).click()
    await page.getByRole('button', { name: 'Delete entry', exact: true }).click()
    await expect(page.locator('.is-front .admin-row')).toHaveCount(0)
    await expect(page.locator('.is-front .empty-state')).toContainText('No results')
    await navigate(page, 'admin-audit')
    await expect(page.locator('.is-front .audit-timeline article')).toHaveCount(3)
  })
}

test('membership thresholds update all affected advisors and persist', async ({ page }) => {
  await start(page, 'john-admin', 'admin-gamification')
  await page.getByLabel('Gold threshold').fill('1300')
  await page.getByRole('button', { name: 'Save settings' }).click()
  const saved = await state(page)
  expect(saved.advisors[0].level).toBe('GOLD')
  await page.reload()
    await enterWorking(page)
  await expect(page.getByLabel('Gold threshold')).toHaveValue('1300')
  await changeAccount(page, 'jane-advisor')
  await navigate(page, 'rewards')
  await expect(page.locator('.is-front .paper-world')).toContainText('gold member')
  await changeAccount(page, 'john-admin')
  await navigate(page, 'admin-settings')
  await page.getByLabel('Default target cycle in days').fill('45')
  await page.getByRole('button', { name: 'Save settings' }).click()
  expect((await state(page)).settings.targetDays).toBe(45)
})
