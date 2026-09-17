import { MeshPhysicalMaterial, MeshStandardMaterial } from 'three'

export function createMaterials() {
  return {
    paint: new MeshPhysicalMaterial({ color: '#52676e', metalness: .78, roughness: .23, clearcoat: 1, clearcoatRoughness: .16 }),
    glass: new MeshPhysicalMaterial({ color: '#101a20', metalness: .38, roughness: .08, clearcoat: 1 }),
    rubber: new MeshStandardMaterial({ color: '#131619', metalness: .02, roughness: .86 }),
    graphite: new MeshStandardMaterial({ color: '#242a2d', metalness: .65, roughness: .36 }),
    alloy: new MeshStandardMaterial({ color: '#aab2b5', metalness: .9, roughness: .24 }),
    machined: new MeshStandardMaterial({ color: '#d8dcdf', metalness: .94, roughness: .18 }),
    darkMetal: new MeshStandardMaterial({ color: '#565f63', metalness: .85, roughness: .33 }),
    accent: new MeshStandardMaterial({ color: '#ea4c2b', metalness: .48, roughness: .3 }),
    copper: new MeshStandardMaterial({ color: '#ba8152', metalness: .82, roughness: .27 }),
    whiteLight: new MeshStandardMaterial({ color: '#f3fbff', emissive: '#dceeff', emissiveIntensity: 2, roughness: .2 }),
    redLight: new MeshStandardMaterial({ color: '#ab171b', emissive: '#eb2525', emissiveIntensity: .8, roughness: .18 })
  }
}
