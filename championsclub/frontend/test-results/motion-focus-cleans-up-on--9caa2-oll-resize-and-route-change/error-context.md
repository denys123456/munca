# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: motion.spec.js >> focus cleans up on Escape, scroll, resize and route change
- Location: tests\motion.spec.js:62:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.focused-card')
Expected: visible
Timeout: 6000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.focused-card') with timeout 6000ms
  - waiting for locator('.focused-card')

```

```yaml
- main:
  - link "Skip to content":
    - /url: "#workspace-content"
  - complementary "Primary navigation":
    - strong: ChampionsClub
    - text: THE PERFORMANCE STANDARD
    - navigation "Main navigation":
      - link "Executive Overview":
        - /url: "#overview"
      - link "Team Performance":
        - /url: "#team-performance"
      - link "Advisors":
        - /url: "#advisors"
      - link "Targets":
        - /url: "#targets"
      - link "Forecasts":
        - /url: "#forecasts"
      - link "Alerts":
        - /url: "#alerts"
      - link "Leaderboard":
        - /url: "#leaderboard"
      - link "Rewards":
        - /url: "#rewards"
      - link "AI Insights":
        - /url: "#ai-insights"
      - link "Dealership Activity":
        - /url: "#dealership-activity"
    - text: CHAMPIONSCLUB / 01
    - button "Your profile":
      - text: AS
      - strong: Alex Smith
      - text: Performance Manager
  - strong: ChampionsClub
  - text: THE PERFORMANCE STANDARD
  - combobox "Search ChampionsClub"
  - button "Open notifications"
  - text: Demo account switcher
  - combobox "Demo account switcher":
    - option "Jane Doe - Sales Advisor"
    - option "Alex Smith - Manager" [selected]
    - option "John Doe - Administrator"
  - text: Apex North Motors Manager workspace
  - heading "Executive Overview" [level=1]
  - paragraph: Welcome back, Alex. Every move counts.
  - text: September 2026
  - region "Performance summary":
    - article:
      - text: Booked volume
      - strong: €312,400
      - text: +9.9% versus previous cycle
    - article:
      - text: Target achievement
      - strong: 74%
      - text: €107,600 to your target
    - article:
      - text: Projected close
      - strong: €438,000
      - text: 84% model confidence
    - article:
      - text: Advisors to support
      - strong: "02"
      - text: A little attention. A measurable difference.
  - text: THE BIG PICTURE
  - heading "Your trajectory. In perspective." [level=2]
  - text: SEPTEMBER
  - strong: €312,400
  - text: +9.9% vs. last cycle Actual Forecast Confidence region Target
  - img "Actual €312,400, predicted €438,000, target €420,000":
    - text: 0k 128k 256k 384k 512k TARGET 420K
    - 'button "Apr: €188,000"'
    - text: Apr
    - 'button "May: €204,000"'
    - text: May
    - 'button "Jun: €238,000"'
    - text: Jun
    - 'button "Jul: €252,000"'
    - text: Jul
    - 'button "Aug: €284,200"'
    - text: Aug
    - 'button "Sep 10: €312,400"'
    - text: Sep 10
    - 'button "Sep 30: €438,000"'
    - text: Sep 30
  - text: EUR MONTHLY VOLUME Current cycle to projected close Projected to finish
  - strong: 4% above target
  - button "Explore performance"
  - complementary:
    - text: CHAMPIONS INTELLIGENCE 01
    - heading "Momentum is yours. Make it count." [level=2]
    - paragraph: The dealership is building strong renewal momentum while Service Protection needs sharper attachment discipline.
    - text: 01 WHAT CHANGED
    - paragraph: Fleet Advantage moved from third to second largest product contributor
    - text: 02 WATCH CLOSELY
    - paragraph: John Doe needs immediate coaching on qualification and follow-up cadence
    - text: 03 YOUR NEXT MOVE
    - paragraph: Run a 20 minute renewal pipeline review with advisors below 60 percent target progress
    - button "Open your intelligence brief"
    - text: Demo intelligence Human judgment. Amplified.
  - text: PEOPLE BEHIND THE PROGRESS
  - heading "Leading the way" [level=2]
  - button "Full rankings"
  - button "01 JD Jane Doe Sales Advisor SILVER €118,500":
    - text: 01 JD
    - strong: Jane Doe
    - text: Sales Advisor SILVER
    - strong: €118,500
  - button "02 AS Alex Smith Senior Sales Advisor SILVER €92,200":
    - text: 02 AS
    - strong: Alex Smith
    - text: Senior Sales Advisor SILVER
    - strong: €92,200
  - button "03 RC Riley Carter Sales Advisor SILVER €39,800":
    - text: 03 RC
    - strong: Riley Carter
    - text: Sales Advisor SILVER
    - strong: €39,800
  - img "Volkswagen vehicles in a contemporary dealership showroom"
  - text: THE CHAMPIONSCLUB COLLECTION
  - heading "Performance deserves something exceptional." [level=2]
  - button "Discover your rewards"
  - text: CHAMPIONSCLUB THE PERFORMANCE STANDARD Demo workspace. Changes saved on this device.
```

# Test source

```ts
  1   | ﻿import { test, expect, start, navigate } from './helpers.js'
  2   | 
  3   | test('intro types individual characters once per session and reveals the workspace', async ({ page }) => {
  4   |   await page.emulateMedia({ reducedMotion: 'no-preference' })
  5   |   await page.addInitScript(() => {
  6   |     window.introTextSamples = []
  7   |     const observer = new MutationObserver(() => {
  8   |       const text = document.querySelector('.intro-identity p')?.textContent
  9   |       if (typeof text === 'string' && window.introTextSamples.at(-1) !== text) window.introTextSamples.push(text)
  10  |     })
  11  |     observer.observe(document, { childList: true, subtree: true, characterData: true })
  12  |     setTimeout(() => observer.disconnect(), 5000)
  13  |   })
  14  |   await page.goto('/')
  15  |   await expect(page.locator('.intro-sequence')).toBeVisible()
  16  |   await expect(page.locator('.intro-sequence')).toHaveCount(0)
  17  |   const samples = await page.evaluate(() => window.introTextSamples)
  18  |   expect(samples.at(-1)).toBe('Turn performance into progress.')
  19  |   const lengths = samples.map((sample) => sample.length)
  20  |   expect(lengths).toContain(1)
  21  |   expect(lengths).toContain(2)
  22  |   for (let index = 1; index < lengths.length; index += 1) expect(lengths[index] - lengths[index - 1]).toBe(1)
  23  |   await expect(page.locator('.product-workspace')).not.toHaveAttribute('inert')
  24  |   await page.reload()
  25  |   await expect(page.locator('.intro-sequence')).toHaveCount(0)
  26  |   const separateSession = await page.context().browser().newContext()
  27  |   const freshPage = await separateSession.newPage()
  28  |   await freshPage.goto('http://127.0.0.1:5173')
  29  |   await expect(freshPage.locator('.intro-sequence')).toBeVisible()
  30  |   await separateSession.close()
  31  | })
  32  | 
  33  | test('focus dwell cancels early and quick movement never opens the wrong card', async ({ page }) => {
  34  |   await start(page, 'alex-manager', 'overview', 'no-preference')
  35  |   const cards = page.locator('[data-focusable]')
  36  |   await cards.first().hover()
  37  |   await page.waitForTimeout(400)
  38  |   await page.mouse.move(800, 150)
  39  |   await page.waitForTimeout(800)
  40  |   await expect(page.locator('[data-focus-layer]')).toHaveCount(0)
  41  |   for (let index = 0; index < 4; index += 1) { await cards.nth(index).hover(); await page.waitForTimeout(140) }
  42  |   await page.mouse.move(900, 150)
  43  |   await page.waitForTimeout(1100)
  44  |   await expect(page.locator('[data-focus-layer]')).toHaveCount(0)
  45  |   await cards.nth(2).hover()
  46  |   await expect(page.locator('.focused-card')).toBeVisible()
  47  |   await expect(page.locator('.focused-card')).toHaveAttribute('aria-label', 'Projected close')
  48  |   await page.waitForTimeout(300)
  49  |   const focused = await page.locator('.focused-card').boundingBox()
  50  |   expect(focused.x).toBeGreaterThanOrEqual(0)
  51  |   expect(focused.y).toBeGreaterThanOrEqual(0)
  52  |   expect(focused.x + focused.width).toBeLessThanOrEqual(1440)
  53  |   expect(focused.y + focused.height).toBeLessThanOrEqual(1000)
  54  |   expect(await page.locator('.focus-backdrop').evaluate((element) => getComputedStyle(element).backdropFilter)).toBe('blur(11px)')
  55  |   expect(await page.locator('.focused-card').evaluate((element) => getComputedStyle(element).filter)).toBe('none')
  56  |   await page.screenshot({ path: 'artifacts/focus-view.png' })
  57  |   await page.mouse.move(1300, 700)
  58  |   await expect(page.locator('[data-focus-layer]')).toHaveCount(0)
  59  |   await expect(cards.nth(2)).toHaveAttribute('data-focused', 'false')
  60  | })
  61  | 
  62  | test('focus cleans up on Escape, scroll, resize and route change', async ({ page }) => {
  63  |   await start(page, 'alex-manager', 'overview', 'no-preference')
  64  |   const card = page.locator('[data-focusable]').first()
  65  |   for (const dismissal of ['Escape', 'scroll', 'resize', 'route']) {
  66  |     await navigate(page, 'overview')
  67  |     await page.evaluate(() => scrollTo(0, 0))
  68  |     await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  69  |     await page.mouse.move(1000, 150)
  70  |     await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  71  |     await card.hover()
> 72  |     await expect(page.locator('.focused-card')).toBeVisible()
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  73  |     if (dismissal === 'Escape') await page.keyboard.press('Escape')
  74  |     if (dismissal === 'scroll') {
  75  |       await page.evaluate(() => {
  76  |         window.focusScrollFinished = false
  77  |         document.addEventListener('scrollend', () => { window.focusScrollFinished = true }, { once: true })
  78  |       })
  79  |       await page.mouse.wheel(0, 300)
  80  |       await expect.poll(() => page.evaluate(() => window.focusScrollFinished)).toBe(true)
  81  |     }
  82  |     if (dismissal === 'resize') await page.setViewportSize({ width: 1200, height: 800 })
  83  |     if (dismissal === 'route') await navigate(page, 'rewards')
  84  |     await expect(page.locator('[data-focus-layer]')).toHaveCount(0)
  85  |     await page.mouse.move(1000, 160)
  86  |   }
  87  | })
  88  | 
  89  | test('touch and reduced motion disable delayed focus', async ({ browser }) => {
  90  |   const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  91  |   const page = await context.newPage()
  92  |   await start(page, 'alex-manager', 'overview', 'no-preference')
  93  |   await page.locator('[data-focusable]').first().tap()
  94  |   await page.waitForTimeout(1200)
  95  |   await expect(page.locator('[data-focus-layer]')).toHaveCount(0)
  96  |   await page.emulateMedia({ reducedMotion: 'reduce' })
  97  |   await expect(page.locator('.intro-sequence')).toHaveCount(0)
  98  |   await context.close()
  99  | })
  100 | 
  101 | test('pointer movement produces no React commits or persistent animation loops', async ({ page }) => {
  102 |   await page.addInitScript(() => {
  103 |     window.championsCommits = 0
  104 |     window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
  105 |       supportsFiber: true, inject: () => 1,
  106 |       onCommitFiberRoot: () => { window.championsCommits += 1 },
  107 |       onCommitFiberUnmount: () => {},
  108 |       onPostCommitFiberRoot: () => {}
  109 |     }
  110 |   })
  111 |   await start(page, 'alex-manager', 'overview', 'no-preference')
  112 |   await page.waitForTimeout(600)
  113 |   const initial = await page.evaluate(() => window.championsCommits)
  114 |   for (let step = 0; step < 48; step += 1) await page.mouse.move(150 + (step % 12) * 90, 260 + (step % 4) * 20)
  115 |   await page.mouse.move(800, 130)
  116 |   const final = await page.evaluate(() => window.championsCommits)
  117 |   expect(final).toBe(initial)
  118 |   await expect.poll(() => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0)
  119 | })
  120 | 
  121 | 
```