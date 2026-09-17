import * as THREE from 'three'
import { box, cylinder, mesh, part, tube, consolidate } from '../three/geometry.js'

function createBlock(root, materials) {
  const block = part(root, 'EngineBlock')
  box(block, [2.42, .48, .84], materials.darkMetal, [0, .18, 0], .08)
  for (const side of [-1, 1]) {
    box(block, [2.4, .13, .075], materials.alloy, [0, .49, side * .45])
    for (let index = 0; index < 10; index += 1) box(block, [.07, .48, .055], materials.alloy, [-1.08 + index * .24, .15, side * .452], .01)
  }
  for (let index = 0; index < 4; index += 1) {
    const x = (index - 1.5) * .57
    mesh(block, new THREE.TorusGeometry(.237, .03, 8, 32), materials.machined, [x, .51, 0], [Math.PI / 2, 0, 0])
    mesh(block, new THREE.CylinderGeometry(.235, .235, .30, 32, 1, true), materials.machined, [x, .33, 0])
  }
  consolidate(block)
}

function createHead(root, materials) {
  const head = part(root, 'CylinderHead')
  box(head, [2.49, .18, .94], materials.alloy, [0, .65, 0])
  box(head, [2.27, .16, .75], materials.graphite, [0, .83, 0], .08)
  for (let index = 0; index < 4; index += 1) {
    const x = (index - 1.5) * .57
    box(head, [.28, .10, .46], materials.darkMetal, [x, .96, 0])
    for (const z of [-.35, .35]) cylinder(head, .04, .07, materials.machined, [x, .78, z], [0, 0, 0], 6)
  }
  box(head, [1.1, .012, .06], materials.accent, [0, .922, .22], .004)
  consolidate(head)
}

function createPistons(root, materials) {
  part(root, 'Pistons')
  part(root, 'ConnectingRods')
  for (let index = 0; index < 4; index += 1) {
    const x = (index - 1.5) * .57
    const piston = part(root, `Piston${index + 1}`)
    piston.position.x = x
    cylinder(piston, .207, .29, materials.machined, [0, .39, 0])
    cylinder(piston, .185, .012, materials.darkMetal, [0, .539, 0])
    for (const y of [.41, .46, .505]) mesh(piston, new THREE.TorusGeometry(.207, .008, 6, 32), materials.graphite, [0, y, 0], [Math.PI / 2, 0, 0])
    cylinder(piston, .05, .42, materials.alloy, [0, .32, 0], [Math.PI / 2, 0, 0])
    consolidate(piston)
    const rod = part(root, `Rod${index + 1}`)
    rod.position.x = x
    box(rod, [.095, .53, .07], materials.alloy, [0, -.005, 0], .019)
    mesh(rod, new THREE.TorusGeometry(.084, .037, 8, 24), materials.machined, [0, -.28, 0])
    cylinder(rod, .058, .13, materials.darkMetal, [0, .265, 0], [Math.PI / 2, 0, 0])
    consolidate(rod)
  }
}

function createCrankshaft(root, materials) {
  const crank = part(root, 'Crankshaft')
  crank.position.y = -.3
  cylinder(crank, .105, 2.85, materials.machined, [0, 0, 0], [0, 0, Math.PI / 2])
  for (let index = 0; index < 4; index += 1) {
    const x = (index - 1.5) * .57
    const offset = index % 2 === 0 ? .17 : -.17
    cylinder(crank, .23, .11, materials.darkMetal, [x - .16, offset / 2, 0], [0, 0, Math.PI / 2])
    cylinder(crank, .23, .11, materials.darkMetal, [x + .16, offset / 2, 0], [0, 0, Math.PI / 2])
    cylinder(crank, .088, .25, materials.machined, [x, offset, 0], [0, 0, Math.PI / 2])
  }
  cylinder(crank, .37, .11, materials.alloy, [1.48, 0, 0], [0, 0, Math.PI / 2])
  cylinder(crank, .29, .14, materials.graphite, [-1.43, 0, 0], [0, 0, Math.PI / 2])
  consolidate(crank)
}

function createAirSystems(root, materials) {
  const intake = part(root, 'Intake')
  box(intake, [2.1, .27, .3], materials.graphite, [0, .62, -.74], .09)
  const exhaust = part(root, 'Exhaust')
  for (let index = 0; index < 4; index += 1) {
    const x = (index - 1.5) * .57
    tube(intake, [[x, .57, -.35], [x, .78, -.48], [x, .71, -.78]], .065, materials.alloy)
    tube(exhaust, [[x, .52, .36], [x, .52, .68], [x * .4, .15, .86]], .067, materials.copper)
  }
  consolidate(intake)
  consolidate(exhaust)
  const turbo = part(root, 'Turbo')
  mesh(turbo, new THREE.TorusGeometry(.235, .09, 12, 32), materials.alloy, [-.5, .2, 1.05])
  cylinder(turbo, .155, .21, materials.darkMetal, [-.5, .2, 1.05], [Math.PI / 2, 0, 0])
  cylinder(turbo, .09, .23, materials.machined, [-.5, .2, 1.21], [Math.PI / 2, 0, 0])
  tube(turbo, [[-.7, .36, 1.06], [-1.13, .55, 1.0], [-1.27, .77, .63]], .076, materials.alloy)
  consolidate(turbo)
  const accessories = part(root, 'Accessories')
  box(accessories, [.48, .12, .56], materials.graphite, [.83, .94, -.54])
  box(accessories, [.31, .014, .37], materials.accent, [.83, 1.01, -.54])
  for (let index = 0; index < 8; index += 1) box(accessories, [.018, .018, .59], materials.alloy, [.65 + index * .05, 1.02, -.54], .005)
  consolidate(accessories)
}

export function createEngine(materials) {
  const root = new THREE.Group()
  root.name = 'Engine'
  createBlock(root, materials)
  createHead(root, materials)
  createPistons(root, materials)
  createCrankshaft(root, materials)
  createAirSystems(root, materials)
  return root
}
