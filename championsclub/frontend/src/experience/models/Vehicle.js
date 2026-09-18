import * as THREE from 'three'
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js'
import { box, loft, mesh, part, tube, consolidate } from '../three/geometry.js'
import { createWheel } from './VehicleWheels.js'

function sidePanel(parent, side, material) {
  const shape = new THREE.Shape()
  shape.moveTo(-2.48, .38)
  shape.lineTo(-2.53, .79)
  shape.quadraticCurveTo(-2.2, 1.02, -1.25, 1.06)
  shape.lineTo(1.35, 1.04)
  shape.quadraticCurveTo(2.3, 1.06, 2.48, .86)
  shape.lineTo(2.48, .38)
  shape.lineTo(2.11, .38)
  shape.absarc(1.55, .52, .575, -.245, Math.PI + .245, false)
  shape.lineTo(-.994, .38)
  shape.absarc(-1.55, .52, .575, -.245, Math.PI + .245, false)
  shape.closePath()
  mesh(parent, new THREE.ExtrudeGeometry(shape, { depth: .075, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .025, bevelThickness: .025, curveSegments: 24 }), material, [0, 0, side * .87 - .035])
}

function createBody(root, materials) {
  const body = part(root, 'Body')
  for (const side of [-1, 1]) {
    sidePanel(body, side, materials.paint)
    tube(body, [[-2.4, .93, side * .82], [-1.55, 1.09, side * .89], [0, 1.025, side * .91], [1.62, 1.08, side * .87], [2.4, .93, side * .79]], .012, materials.machined)
    // Arteon's crisp shoulder and lower door character line.
    box(body, [2.10, .055, .08], materials.graphite, [0, .36, side * .95], .018)
    box(body, [2.25, .022, .018], materials.machined, [.08, .91, side * .935], .008)
  }
  loft(body, [[1, .94, .84, .05], [1.5, .97, .9, .09], [2.25, .91, .84, .11], [2.48, .79, .69, .11]], materials.paint)
  box(body, [.18, .32, 1.72], materials.paint, [-2.43, .62, 0], .075)
  box(body, [.05, .16, 1.22], materials.graphite, [-2.532, .59, 0], .025)
  // Wide Arteon grille with the emblem centered between the chrome blades.
  for (let index = 0; index < 4; index += 1) {
    box(body, [.035, .026, 1.55 - index * .12], materials.machined, [-2.555, .72 + index * .055, 0], .008)
  }
  box(body, [.10, .04, 1.78], materials.graphite, [-2.48, .4, 0])
  box(body, [.09, .032, 1.66], materials.whiteLight, [-2.49, .88, 0], .012)
  box(body, [.11, .22, 1.66], materials.paint, [2.4, .64, 0], .055)
  box(body, [.06, .037, 1.65], materials.redLight, [2.455, .86, 0], .009)
  box(body, [.16, .09, 1.68], materials.graphite, [2.42, .38, 0])
  for (let index = 0; index < 7; index += 1) box(body, [.04, .13, .014], materials.darkMetal, [-2.56, .51, (index - 3) * .14], .004)
  consolidate(body)
  return body
}

function createCabin(root, materials) {
  const interior = part(root, 'Interior')
  const cabinPoints = []
  for (const side of [-1, 1]) {
    cabinPoints.push(new THREE.Vector3(-1.12, 1.055, side * .77), new THREE.Vector3(-.40, 1.58, side * .58), new THREE.Vector3(.42, 1.55, side * .58), new THREE.Vector3(1.38, 1.045, side * .78))
  }
  mesh(interior, new ConvexGeometry(cabinPoints), materials.glass)
  box(interior, [.93, .055, 1.19], materials.paint, [.02, 1.60, 0], .025)
  for (const side of [-1, 1]) {
    tube(interior, [[-1.13, 1.045, side * .76], [-.33, 1.58, side * .54], [.42, 1.55, side * .55], [1.38, 1.035, side * .80]], .027, materials.paint)
    tube(interior, [[.16, 1.55, side * .57], [.27, 1.06, side * .81]], .022, materials.graphite)
    box(interior, [.21, .095, .16], materials.paint, [-.65, 1.12, side * 1.0], .035)
  }
  consolidate(interior)
  return interior
}

export function createVehicle(materials) {
  const root = new THREE.Group()
  root.name = 'Vehicle'
  createBody(root, materials)
  createCabin(root, materials)
  const hood = part(root, 'Hood')
  loft(hood, [[-2.48, .86, .74, .026], [-2.22, .98, .81, .047], [-1.55, 1.07, .82, .052], [-1.13, 1.06, .76, .034]], materials.paint)
  for (const side of [-1, 1]) tube(hood, [[-2.36, .92, side * .51], [-1.75, 1.115, side * .44], [-1.16, 1.10, side * .47]], .006, materials.darkMetal)
  consolidate(hood)
  const chassis = part(root, 'Chassis')
  box(chassis, [4.55, .12, 1.52], materials.graphite, [0, .37, 0])
  for (const x of [-1.55, 1.55]) box(chassis, [.12, .12, 1.88], materials.darkMetal, [x, .51, 0])
  consolidate(chassis)
  part(root, 'Doors')
  createWheel(root, 'WheelFL', [-1.55, .52, .96], materials)
  createWheel(root, 'WheelFR', [-1.55, .52, -.96], materials)
  createWheel(root, 'WheelRL', [1.55, .52, .96], materials)
  createWheel(root, 'WheelRR', [1.55, .52, -.96], materials)
  return root
}
