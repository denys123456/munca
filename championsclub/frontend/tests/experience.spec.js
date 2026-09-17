import { test, expect, travelTo } from './helpers.js'

async function startExperience(page) {
  await page.goto('/')
  await expect(page.locator('.experience-canvas')).toBeAttached()
  await expect(page.locator('.experience-loading')).toHaveCount(0, { timeout: 20000 })
  await expect(page.locator('.graphics-fallback')).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => document.querySelector('.experience-canvas')?.getDiagnostics?.()?.ready), { timeout: 20000 }).toBe(true)
}

const diagnostics = (page) => page.evaluate(() => document.querySelector('.experience-canvas').getDiagnostics())

test('the whole automotive story scrubs, stops and reverses without React frame updates', async ({ page }) => {
  test.setTimeout(90000)
  await page.addInitScript(() => {
    window.championsCommits = 0
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: () => { window.championsCommits += 1 }, onCommitFiberUnmount: () => {}, onPostCommitFiberRoot: () => {} }
  })
  await startExperience(page)
  const commits = await page.evaluate(() => window.championsCommits)
  for (let chapter = 0; chapter < 13; chapter += 1) {
    await travelTo(page, chapter / 12)
    await expect(page.locator('.automotive-experience')).toHaveAttribute('data-chapter', String(chapter))
    const info = await diagnostics(page)
    expect(info.calls).toBeLessThan(220)
    expect(info.triangles).toBeLessThan(200000)
    expect(info.camera.every(Number.isFinite)).toBe(true)
    if ([0, 2, 4, 5, 6, 8, 9, 10, 12].includes(chapter)) await page.screenshot({ path: `artifacts/automotive/chapter-${chapter + 1}.png` })
  }
  await travelTo(page, .42)
  await page.waitForTimeout(300)
  const before = await diagnostics(page)
  await page.waitForTimeout(400)
  const idle = await diagnostics(page)
  expect(idle.frames).toBe(before.frames)
  await travelTo(page, .72)
  await travelTo(page, .42)
  const reversed = await diagnostics(page)
  expect(reversed.camera).toEqual(before.camera)
  expect(reversed.engine).toEqual(before.engine)
  expect(reversed.spread).toBe(before.spread)
  expect(await page.evaluate(() => window.championsCommits - 0)).toBe(commits)
  await page.mouse.wheel(0, 550)
  await page.waitForTimeout(900)
  const stopped = await diagnostics(page)
  await page.waitForTimeout(400)
  expect((await diagnostics(page)).frames).toBe(stopped.frames)
  await page.mouse.wheel(0, -550)
  await page.waitForTimeout(900)
  expect((await diagnostics(page)).progress).toBeLessThan(stopped.progress)
})

test('chapter selection and workspace round trips preserve the scene and resources', async ({ page }) => {
  await startExperience(page)
  await page.getByLabel('Open chapter index').click()
  await page.getByRole('button', { name: '06 Mechanical harmony ↗', exact: true }).click()
  await expect.poll(async () => (await diagnostics(page)).progress).toBeCloseTo(5 / 12, 3)
  const before = await diagnostics(page)
  for (let index = 0; index < 4; index += 1) {
    await page.getByRole('button', { name: 'WORKSPACE', exact: true }).click()
    await expect(page.locator('#workspace-content')).toBeVisible()
    await page.getByRole('button', { name: 'EXPERIENCE', exact: true }).click()
    await expect(page.locator('.operational-workspace')).toHaveCount(0)
  }
  const after = await diagnostics(page)
  expect(after.progress).toBeCloseTo(before.progress, 4)
  expect(after.geometries).toBe(before.geometries)
  expect(after.textures).toBe(before.textures)
  expect(await page.locator('canvas').count()).toBe(1)
})

test('mobile and reduced motion retain every chapter and the operational exit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await startExperience(page)
  const initialCamera = (await diagnostics(page)).camera
  for (const chapter of [0, 2, 5, 6, 8, 9, 12]) {
    await travelTo(page, chapter / 12)
    expect((await diagnostics(page)).camera).toEqual(initialCamera)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `artifacts/automotive/mobile-${chapter + 1}.png` })
  }
  await page.getByRole('button', { name: 'ENTER YOUR WORKSPACE', exact: true }).click()
  await expect(page.locator('#workspace-content')).toBeVisible()
})

test('a lost graphics context leaves a usable workspace exit', async ({ page }) => {
  await startExperience(page)
  await page.evaluate(() => document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await expect(page.locator('.graphics-fallback')).toBeVisible()
  await page.getByRole('button', { name: 'OPEN WORKSPACE ↗', exact: true }).click()
  await expect(page.locator('#workspace-content')).toBeVisible()
})

test('the manifest loads a named GLTF assembly and rejects incompatible parts before playback', async ({ page }) => {
  const names = ['EngineBlock', 'CylinderHead', 'Crankshaft', 'Intake', 'Turbo', 'Accessories', 'Pistons', 'ConnectingRods']
  const vertices = new Float32Array([-.2, 0, 0, .2, 0, 0, 0, .3, 0])
  const model = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: names.map((name, index) => index) }],
    nodes: names.map((name, index) => ({ name, mesh: 0, translation: [index * .1, 0, 0] })),
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ uri: 'data:application/octet-stream;base64,' + Buffer.from(vertices.buffer).toString('base64'), byteLength: 36 }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-.2, 0, 0], max: [.2, .3, 0] }]
  }
  await page.route('**/models/manifest.json', (route) => route.fulfill({ json: { vehicle: { url: null }, engine: { url: '/models/test-engine.gltf', scale: 1 }, drivetrain: { url: null } } }))
  await page.route('**/models/test-engine.gltf', (route) => route.fulfill({ json: model }))
  await startExperience(page)
  await page.getByRole('button', { name: 'CC—01 / CONCEPT STUDY ↗', exact: true }).click()
  await expect(page.locator('.model-information')).toContainText('Detailed engine model')
  await page.getByLabel('Close dialog').click()
  await travelTo(page, 5 / 12)
  expect((await diagnostics(page)).spread).toBe(1)
  await page.unroute('**/models/test-engine.gltf')
  await page.route('**/models/test-engine.gltf', (route) => route.fulfill({ json: { asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [] }], nodes: [] } }))
  await startExperience(page)
  await page.getByRole('button', { name: 'CC—01 / CONCEPT STUDY ↗', exact: true }).click()
  await expect(page.locator('.model-information')).toContainText('Procedural engine study')
  await expect(page.locator('.model-information')).toContainText('Missing groups')
})

test('mobile full motion fits the car and keeps touch scrolling reversible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await startExperience(page)
  await page.screenshot({ path: 'artifacts/automotive/mobile-full-motion.png' })
  const initial = await diagnostics(page)
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true })
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 620 }] })
  for (const y of [580, 530, 470, 410, 350]) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] })
    await page.waitForTimeout(25)
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(async () => (await diagnostics(page)).progress).toBeGreaterThan(0)
  await session.detach()
  await travelTo(page, .25)
  expect((await diagnostics(page)).camera).not.toEqual(initial.camera)
  await travelTo(page, 0)
  const returned = (await diagnostics(page)).camera
  returned.forEach((value, index) => expect(value).toBeCloseTo(initial.camera[index], 2))
})
