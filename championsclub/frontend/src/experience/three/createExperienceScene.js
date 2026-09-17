import * as THREE from 'three'
import { createCameraRig } from '../CameraRig.js'
import { createLighting } from '../LightingRig.js'
import { createMechanicalRig } from '../scenes/MechanicalRig.js'
import { createForecastGeometry } from '../scenes/ForecastGeometry.js'
import { loadAssets } from './ModelLoader.js'
import { initialQuality, createPerformanceController } from './PerformanceController.js'
import { disposeObject } from './geometry.js'
import { prepareScene } from './AssetPreloader.js'

export function createExperienceScene(host, callbacks) {
  const controller = new AbortController()
  const quality = initialQuality()
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: quality.tier === 'high', powerPreference: 'high-performance', stencil: false })
  renderer.setPixelRatio(quality.pixelRatio)
  renderer.setSize(host.clientWidth, host.clientHeight)
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.shadowMap.enabled = quality.shadows
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.domElement.setAttribute('aria-label', 'Interactive automotive performance story')
  renderer.domElement.setAttribute('role', 'img')
  host.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  const cameraRig = createCameraRig(host.clientWidth, host.clientHeight)
  const forecast = createForecastGeometry()
  scene.add(forecast.root)
  let mechanical
  let lighting
  let performanceController
  let disposed = false
  let initialized = false
  let lastState
  let lastProgress = 0
  let frame = 0
  let lastRendered = -1
  let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const projected = new THREE.Vector3()
  const anchor = new THREE.Vector3(0, 1.45, 0)
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
  const updateMotion = () => { reducedMotion = motionQuery.matches; invalidate() }
  motionQuery.addEventListener('change', updateMotion)

  function render(time) {
    frame = 0
    if (!initialized || disposed || !lastState || document.hidden || callbacks.isPaused()) return
    mechanical.update(lastState, lastProgress)
    cameraRig.update(lastState, reducedMotion)
    lighting.update(lastState.darkness)
    forecast.update(lastProgress)
    renderer.render(scene, cameraRig.camera)
    mechanical.engine.updateWorldMatrix(true, false)
    projected.copy(anchor).applyMatrix4(mechanical.engine.matrixWorld).project(cameraRig.camera)
    callbacks.onAnchor((projected.x * .5 + .5) * host.clientWidth, (-projected.y * .5 + .5) * host.clientHeight)
    performanceController.measure(time, lastProgress !== lastRendered)
    lastRendered = lastProgress
    host.dataset.progress = lastProgress.toFixed(5)
  }

  function invalidate() { if (!frame && !disposed) frame = requestAnimationFrame(render) }

  const resize = new ResizeObserver(() => {
    if (!host.clientWidth || !host.clientHeight || disposed) return
    renderer.setSize(host.clientWidth, host.clientHeight)
    cameraRig.resize(host.clientWidth, host.clientHeight)
    invalidate()
  })
  resize.observe(host)
  const visibility = () => { if (!document.hidden) invalidate() }
  document.addEventListener('visibilitychange', visibility)
  const contextLost = (event) => { event.preventDefault(); initialized = false; callbacks.onError('The graphics context was interrupted. Your workspace is still available.') }
  renderer.domElement.addEventListener('webglcontextlost', contextLost)

  async function initialize() {
    callbacks.onProgress(10)
    let assets
    try { assets = await loadAssets(renderer, controller.signal, callbacks.onProgress) }
    catch (error) {
      if (disposed) return
      assets = { manifest: {}, issues: [error.message] }
    }
    if (disposed) return
    mechanical = createMechanicalRig(assets)
    scene.add(mechanical.root)
    lighting = createLighting(scene, renderer, assets.environment, quality)
    performanceController = createPerformanceController(renderer, lighting, quality)
    callbacks.onProgress(78)
    cameraRig.resize(host.clientWidth, host.clientHeight)
    await prepareScene({ renderer, scene, mechanical, cameraRig, lighting, forecast, isDisposed: () => disposed, onProgress: callbacks.onProgress })
    await document.fonts.ready
    if (disposed) return
    initialized = true
    render(performance.now())
    callbacks.onProgress(100)
    callbacks.onReady({ vehicle: assets.vehicle ? 'Licensed vehicle model' : 'Procedural concept vehicle', engine: assets.engine ? 'Detailed engine model' : 'Procedural engine study', issues: assets.issues })
    invalidate()
  }

  initialize().catch((error) => { if (!disposed) callbacks.onError(error.message) })
  return {
    update(state, progress) { lastState = state; lastProgress = progress; invalidate() },
    setData(metrics) { forecast.setData(metrics); invalidate() },
    invalidate,
    diagnostics() {
      return { ...performanceController?.snapshot(), progress: lastProgress, camera: cameraRig.camera.position.toArray(), engine: mechanical?.engine.position.toArray(), spread: lastState?.engineSpread, ready: initialized }
    },
    destroy() {
      disposed = true
      controller.abort()
      cancelAnimationFrame(frame)
      resize.disconnect()
      motionQuery.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', visibility)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      disposeObject(scene)
      mechanical?.disposeMaterials()
      lighting?.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }
}
