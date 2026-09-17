import * as THREE from 'three'
import { box, cylinder, mesh, part, consolidate } from '../three/geometry.js'

export function createWheel(parent, name, position, materials) {
  const wheel = part(parent, name)
  wheel.position.set(...position)
  mesh(wheel, new THREE.TorusGeometry(.392, .105, 12, 48), materials.rubber)
  mesh(wheel, new THREE.TorusGeometry(.325, .025, 8, 48), materials.machined, [0, 0, .087])
  cylinder(wheel, .304, .14, materials.graphite, [0, 0, 0], [Math.PI / 2, 0, 0])
  cylinder(wheel, .245, .022, materials.darkMetal, [0, 0, .086], [Math.PI / 2, 0, 0])
  cylinder(wheel, .065, .06, materials.machined, [0, 0, .12], [Math.PI / 2, 0, 0])
  for (let index = 0; index < 10; index += 1) {
    const angle = index / 10 * Math.PI * 2
    const spoke = box(wheel, [.026, .256, .025], materials.machined, [Math.sin(angle) * .19, Math.cos(angle) * .19, .115], .008)
    spoke.rotation.z = -angle + .13
  }
  box(wheel, [.075, .15, .08], materials.accent, [.215, 0, .068], .025)
  consolidate(wheel)
  if (position[2] < 0) wheel.rotation.y = Math.PI
  return wheel
}
