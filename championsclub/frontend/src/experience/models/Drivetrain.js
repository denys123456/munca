import { Group } from 'three'
import { box, cylinder, part, consolidate } from '../three/geometry.js'

export function createDrivetrain(materials) {
  const root = new Group()
  root.name = 'Drivetrain'
  const transmission = part(root, 'Transmission')
  cylinder(transmission, .29, .64, materials.alloy, [-.38, .46, 0], [0, 0, Math.PI / 2])
  for (let index = 0; index < 6; index += 1) cylinder(transmission, .30 - index * .02, .026, materials.darkMetal, [-.62 + index * .1, .46, 0], [0, 0, Math.PI / 2])
  const shaft = part(root, 'Driveshaft')
  cylinder(shaft, .053, 1.92, materials.machined, [.92, .43, 0], [0, 0, Math.PI / 2])
  box(shaft, [.35, .24, .3], materials.darkMetal, [1.65, .43, 0])
  cylinder(shaft, .05, 1.8, materials.alloy, [1.65, .43, 0], [Math.PI / 2, 0, 0])
  consolidate(transmission)
  consolidate(shaft)
  return root
}
