import { Group } from 'three'
import { disposeObject } from './geometry.js'

const requiredNodes = {
  vehicle: ['Body', 'Hood', 'Chassis'],
  engine: ['EngineBlock', 'CylinderHead', 'Crankshaft', 'Intake', 'Turbo', 'Accessories'],
  drivetrain: ['Transmission', 'Driveshaft']
}

function normalizeModel(scene, specification, slot) {
  const names = new Set([...requiredNodes[slot], ...Object.keys(specification.nodes ?? {}), 'Doors', 'Interior', 'Wheels', 'WheelFL', 'WheelFR', 'WheelRL', 'WheelRR', 'Pistons', 'ConnectingRods', 'Piston1', 'Piston2', 'Piston3', 'Piston4', 'Rod1', 'Rod2', 'Rod3', 'Rod4', 'Exhaust'])
  const objects = new Map()
  names.forEach((name) => {
    const object = scene.getObjectByName(specification.nodes?.[name] ?? name)
    if (object) objects.set(name, object)
  })
  const missing = requiredNodes[slot].filter((name) => !objects.has(name))
  if (slot === 'engine' && !objects.has('Pistons') && !objects.has('Piston1')) missing.push('Pistons')
  if (slot === 'vehicle' && !objects.has('Wheels') && !objects.has('WheelFL')) missing.push('Wheels')
  if (missing.length) throw new Error(`Missing groups: ${missing.join(', ')}`)
  const moving = new Set(objects.values())
  for (const object of moving) {
    let ancestor = object.parent
    while (ancestor && ancestor !== scene) {
      if (moving.has(ancestor)) throw new Error('Moving groups must not be nested')
      ancestor = ancestor.parent
    }
  }
  const root = new Group()
  root.add(scene)
  scene.scale.multiplyScalar(specification.scale ?? 1)
  root.updateMatrixWorld(true)
  for (const [name, object] of objects) {
    const pivot = new Group()
    root.add(pivot)
    pivot.attach(object)
    object.name = `${name}Mesh`
    pivot.name = name
  }
  const proxy = scene.getObjectByName(specification.nodes?.EngineProxy ?? 'EngineProxy')
  if (proxy) proxy.visible = false
  root.traverse((object) => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true } })
  return root
}

export async function loadAssets(renderer, signal, onProgress) {
  const response = await fetch(`${import.meta.env.BASE_URL}models/manifest.json`, { signal })
  if (!response.ok) throw new Error('Asset manifest could not be read')
  const manifest = await response.json()
  const assets = { manifest, issues: [] }
  let loader
  let draco
  let ktx2
  let completed = 0
  try {
    if (['vehicle', 'engine', 'drivetrain'].some((slot) => manifest[slot]?.url)) {
      const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js')])
      loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
      if (manifest.decoders?.draco) {
        const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js')
        draco = new DRACOLoader().setDecoderPath(manifest.decoders.draco)
        loader.setDRACOLoader(draco)
      }
      if (manifest.decoders?.ktx2) {
        const { KTX2Loader } = await import('three/addons/loaders/KTX2Loader.js')
        ktx2 = new KTX2Loader().setTranscoderPath(manifest.decoders.ktx2).detectSupport(renderer)
        loader.setKTX2Loader(ktx2)
      }
    }
    await Promise.all(['vehicle', 'engine', 'drivetrain'].map(async (slot) => {
      const specification = manifest[slot]
      let source
      try {
        if (specification?.url) {
          const result = await loader.loadAsync(specification.url)
          source = result.scene
          if (signal.aborted) { disposeObject(source); return }
          assets[slot] = normalizeModel(source, specification, slot)
        }
      } catch (error) {
        if (source) disposeObject(source)
        assets.issues.push(`${slot}: ${error.message}`)
      } finally {
        completed += 1
        onProgress(15 + completed * 17)
      }
    }))
    if (manifest.environment?.url && !signal.aborted) {
      try {
        const { RGBELoader } = await import('three/addons/loaders/RGBELoader.js')
        assets.environment = await new RGBELoader().loadAsync(manifest.environment.url)
      }
      catch { assets.issues.push('Studio HDR unavailable. Procedural studio lighting is active.') }
    }
    if (signal.aborted) {
      Object.values(assets).forEach((asset) => { if (asset?.isObject3D) disposeObject(asset) })
      assets.environment?.dispose()
    }
    return assets
  } finally {
    draco?.dispose()
    ktx2?.dispose()
  }
}
