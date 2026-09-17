# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: experience.spec.js >> mobile full motion fits the car and keeps touch scrolling reversible
- Location: tests\experience.spec.js:122:1

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 0.25
Received: 0.29346

Expected precision:    3
Expected difference: < 0.0005
Received difference:   0.04346

Call Log:
- Timeout 6000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner:
    - button "ChampionsClub experience" [ref=e3] [cursor=pointer]:
      - text: CHAMPIONSCLUB
      - generic [ref=e4]: ®
    - generic [ref=e5]:
      - button "Choose demo account" [ref=e6] [cursor=pointer]: Alex Smith
      - button "WORKSPACE" [ref=e10] [cursor=pointer]
  - main "ChampionsClub automotive experience" [ref=e14]:
    - generic [ref=e15]:
      - generic "Performance is a system" [ref=e17]:
        - generic [aria-hidden] [ref=e18]:
          - generic [ref=e19]: 04 / THE SOURCE OF MOTION
          - heading [level=2] [ref=e20]: GREATNESS COMES FROM WITHIN.
        - generic [aria-hidden] [ref=e21]:
          - generic [ref=e22]: 05 / SALES PERFORMANCE
          - heading [level=2] [ref=e23]: THIS IS YOUR DRIVING FORCE.
      - generic:
        - img "Interactive automotive performance story"
      - generic:
        - generic [aria-hidden]:
          - generic:
            - generic:
              - generic: Apex North Motors / TEAM PERFORMANCE
              - strong: €312,400
              - generic: SALES RECORDED / CURRENT CYCLE
            - generic: SEEDED DEMO DATA
      - generic [ref=e24]:
        - button "Open chapter index" [ref=e25] [cursor=pointer]:
          - generic [ref=e26]: "05"
          - generic [ref=e27]: / 13
        - button "CC—01 / CONCEPT STUDY ↗" [ref=e29] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test as base } from '@playwright/test'
  2  | 
  3  | export const test = base.extend({
  4  |   appErrors: [async ({ page }, use) => {
  5  |     const errors = []
  6  |     page.on('pageerror', (error) => errors.push(error.message))
  7  |     page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  8  |     await use(errors)
  9  |     expect(errors).toEqual([])
  10 |   }, { auto: true }]
  11 | })
  12 | 
  13 | export { expect }
  14 | 
  15 | export async function enterWorking(page) {
  16 |   await expect(page.locator('#workspace-content')).toBeVisible()
  17 | }
  18 | 
  19 | export async function start(page, account = 'alex-manager', route = 'overview', motion = 'reduce') {
  20 |   await page.emulateMedia({ reducedMotion: motion })
  21 |   await page.addInitScript((id) => {
  22 |     if (!sessionStorage.getItem('championsclub-account')) sessionStorage.setItem('championsclub-account', id)
  23 |   }, account)
  24 |   await page.goto('/#/workspace/' + route)
  25 |   await expect(page.locator('.operational-workspace')).toHaveAttribute('data-route', route.split('/')[0])
  26 |   await enterWorking(page)
  27 | }
  28 | 
  29 | export async function navigate(page, route) {
  30 |   await page.evaluate((next) => { location.hash = '/workspace/' + next }, route)
  31 |   await expect(page.locator('.operational-workspace')).toHaveAttribute('data-route', route.split('/')[0])
  32 |   await enterWorking(page)
  33 | }
  34 | 
  35 | export async function changeAccount(page, id) {
  36 |   const names = { 'jane-advisor': 'Jane Doe', 'alex-manager': 'Alex Smith', 'john-admin': 'John Doe' }
  37 |   await page.getByLabel('Choose demo account').click()
  38 |   await page.locator('.account-options button').filter({ hasText: names[id] }).click()
  39 |   await expect(page.locator('.identity-transition')).toHaveCount(0)
  40 |   await expect(page.locator('.account-toggle')).toContainText(names[id])
  41 | }
  42 | 
  43 | export async function travelTo(page, destination) {
  44 |   await page.evaluate((progress) => {
  45 |     const root = document.querySelector('.automotive-experience')
  46 |     window.scrollTo(0, progress * (root.offsetHeight - innerHeight))
  47 |   }, destination)
> 48 |   await expect.poll(async () => Number(await page.locator('.automotive-experience').getAttribute('data-progress'))).toBeCloseTo(destination, 3)
     |                                                                                                                     ^ Error: expect(received).toBeCloseTo(expected, precision)
  49 | }
  50 | 
  51 | export async function state(page) {
  52 |   return page.evaluate(() => JSON.parse(localStorage.getItem('championsclub-workspace-v3'))?.data)
  53 | }
  54 | 
```