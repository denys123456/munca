import { Box3, Color, Group, Vector3 } from 'three'
import { createVehicle } from '../models/Vehicle.js'
import { createVehicleMaterials } from '../models/VehicleMaterials.js'
import { createEngine } from '../models/Engine.js'
import { createDrivetrain } from '../models/Drivetrain.js'
import { createMaterials } from '../three/materials.js'
import { smoothRange } from '../ExperienceTimeline.js'

function bindParts(root, trajectories) {
  return Object.entries(trajectories).flatMap(([name, offset]) => {
    const object = root.getObjectByName(name)
    return object ? [{ object, rest: object.position.clone(), offset: new Vector3(...offset) }] : []
  })
}

function moveParts(parts, progress) {
  parts.forEach(({ object, rest, offset }) => object.position.copy(rest).addScaledVector(offset, progress))
}

function fadeMaterials(root) {
  const materials = new Set()
  root.traverse((object) => {
    const entries = Array.isArray(object.material) ? object.material : [object.material]
    entries.filter(Boolean).forEach((material) => materials.add(material))
  })
  return [...materials].map((material) => ({ material, opacity: material.opacity }))
}

export function createMechanicalRig(assets) {
  const vehicleMaterials = createVehicleMaterials()
  const engineMaterials = createMaterials()
  const root = new Group()
  const vehicle = assets.vehicle ?? createVehicle(vehicleMaterials)
  const engine = assets.engine ?? createEngine(engineMaterials)
  const drivetrain = assets.drivetrain ?? createDrivetrain(engineMaterials)
  const enginePosition = new Vector3(...(assets.manifest.vehicle?.enginePosition ?? [-1.25, .54, 0]))
  const engineScale = assets.manifest.vehicle?.engineScale ?? .48
  root.add(vehicle, engine, drivetrain)
  const vehicleParts = bindParts(vehicle, { Body: [0, .68, 0], Hood: [-.4, 1.3, 0], Interior: [.4, 1.2, 0], Doors: [0, .1, .9], Wheels: [0, -.12, .9], WheelFL: [0, .07, .72], WheelFR: [0, .07, -.72], WheelRL: [0, .07, .72], WheelRR: [0, .07, -.72] })
  const engineParts = bindParts(engine, { EngineBlock: [0, -.13, -.12], CylinderHead: [0, 1.52, -.18], Pistons: [0, .84, .12], ConnectingRods: [0, .35, .12], Crankshaft: [0, -.65, .14], Intake: [0, .25, -.90], Turbo: [-.42, .14, .85], Exhaust: [.12, .05, .50], Accessories: [.35, .65, -.42], Piston1: [0, .89, .12], Piston2: [0, .96, .12], Piston3: [0, .96, .12], Piston4: [0, .89, .12], Rod1: [0, .36, .12], Rod2: [0, .43, .12], Rod3: [0, .43, .12], Rod4: [0, .36, .12] })
  const faded = fadeMaterials(vehicle)
  const controlUnit = engine.getObjectByName('Accessories')
  const controlCenter = new Vector3()
  if (controlUnit) {
    new Box3().setFromObject(controlUnit).getCenter(controlCenter)
    controlUnit.worldToLocal(controlCenter)
    controlUnit.traverse((object) => {
      if (object.material) object.material = Array.isArray(object.material) ? object.material.map((material) => material.clone()) : object.material.clone()
    })
  }
  const controlMaterials = new Set(controlUnit ? fadeMaterials(controlUnit).map(({ material }) => material) : [])
  const secondaryMaterials = fadeMaterials(engine).filter(({ material }) => !controlMaterials.has(material))
  const silver = new Color('#d8dcdf')
  const bronze = new Color('#bb8358')
  const gold = new Color('#d2ac62')
  const center = new Vector3(0, .75, 0)
  return {
    root, engine, vehicle,
    update(state, progress) {
      root.rotation.y = state.yaw
      moveParts(vehicleParts, state.vehicleSpread)
      moveParts(engineParts, state.engineSpread)
      const opacity = 1 - smoothRange(state.engineFocus, .18, .80)
      vehicle.visible = opacity > .002
      faded.forEach(({ material, opacity: original }) => {
        const transparent = opacity < .999 || original < 1
        if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true }
        material.opacity = original * opacity
        material.depthWrite = opacity > .95
      })
      engine.position.copy(enginePosition).lerp(center, state.engineFocus)
      engine.visible = state.vehicleSpread > .08 || state.engineFocus > .01
      engine.scale.setScalar(engineScale + state.engineFocus * (1.13 - engineScale))
      drivetrain.visible = state.engineFocus < .95 || progress > .56 && progress < .67
      drivetrain.position.y = state.vehicleSpread * -.035
      const controlFocus = smoothRange(progress * 12, 8.4, 9) * (1 - smoothRange(progress * 12, 9.25, 9.9))
      if (controlUnit) {
        const scale = 1 + controlFocus * 2.4
        controlUnit.scale.setScalar(scale)
        controlUnit.position.addScaledVector(controlCenter, 1 - scale)
        controlUnit.position.x -= controlFocus * .45
        controlUnit.position.y -= controlFocus * .4
        controlUnit.position.z += controlFocus * .4
      }
      secondaryMaterials.forEach(({ material, opacity: original }) => {
        const transparent = controlFocus > .001 || original < 1
        if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true }
        material.opacity = original * (1 - controlFocus * .85)
        material.depthWrite = controlFocus < .01
      })
      const recognition = smoothRange(progress * 12, 9.3, 9.9) * (1 - smoothRange(progress * 12, 10.4, 10.95))
      engineMaterials.machined.color.copy(silver).lerp(progress * 12 < 10 ? bronze : gold, recognition)
    },
    disposeMaterials() {
      Object.values(vehicleMaterials).forEach((material) => material.dispose())
      Object.values(engineMaterials).forEach((material) => material.dispose())
    }
  }
}
