import { createMaterials } from '../three/materials.js'

export function createVehicleMaterials() {
  const materials = createMaterials()

  // Keep the vehicle finish separate from the engine's shared material palette.
  materials.paint.setValues({
    color: '#090b0e',
    metalness: .65,
    roughness: .27,
    clearcoat: 1,
    clearcoatRoughness: .11
  })
  materials.glass.setValues({ color: '#080d12', metalness: .08, roughness: .07, clearcoatRoughness: .06 })
  materials.rubber.setValues({ color: '#101112', metalness: 0, roughness: .92 })
  materials.graphite.setValues({ color: '#171a1c', metalness: .35, roughness: .38 })
  materials.machined.setValues({ color: '#c8cccf', metalness: 1, roughness: .22 })

  return materials
}
