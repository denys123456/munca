import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export function part(parent, name) {
  const group = new THREE.Group()
  group.name = name
  parent.add(group)
  return group
}

export function mesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material)
  object.position.set(...position)
  object.rotation.set(...rotation)
  object.castShadow = true
  object.receiveShadow = true
  parent.add(object)
  return object
}

export function box(parent, size, material, position, radius = 0.035) {
  return mesh(parent, new RoundedBoxGeometry(...size, 2, radius), material, position)
}

export function cylinder(parent, radius, length, material, position, rotation = [0, 0, 0], segments = 32) {
  return mesh(parent, new THREE.CylinderGeometry(radius, radius, length, segments), material, position, rotation)
}

export function tube(parent, points, radius, material) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)))
  return mesh(parent, new THREE.TubeGeometry(curve, 24, radius, 8, false), material)
}

export function loft(parent, sections, material, segments = 24) {
  const vertices = []
  const indices = []
  sections.forEach(([x, y, width, height]) => {
    for (let index = 0; index <= segments; index += 1) {
      const angle = index / segments * Math.PI * 2
      vertices.push(x, y + Math.sin(angle) * height, Math.cos(angle) * width)
    }
  })
  for (let section = 0; section < sections.length - 1; section += 1) {
    for (let index = 0; index < segments; index += 1) {
      const a = section * (segments + 1) + index
      const b = a + segments + 1
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return mesh(parent, geometry, material)
}

export function consolidate(group) {
  const buckets = new Map()
  for (const child of [...group.children]) {
    if (!child.isMesh || Array.isArray(child.material)) continue
    child.updateMatrix()
    const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone()
    geometry.applyMatrix4(child.matrix)
    geometry.deleteAttribute('uv')
    const bucket = buckets.get(child.material) ?? []
    bucket.push(geometry)
    buckets.set(child.material, bucket)
    group.remove(child)
    child.geometry.dispose()
  }
  for (const [material, geometries] of buckets) {
    const merged = mergeGeometries(geometries, false)
    if (merged) mesh(group, merged, material)
    geometries.forEach((geometry) => geometry.dispose())
  }
}

export function disposeObject(root) {
  const geometries = new Set()
  const materials = new Set()
  const textures = new Set()
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry)
    const entries = Array.isArray(object.material) ? object.material : [object.material]
    entries.filter(Boolean).forEach((material) => materials.add(material))
  })
  materials.forEach((material) => {
    Object.values(material).forEach((value) => { if (value?.isTexture) textures.add(value) })
    material.dispose()
  })
  geometries.forEach((geometry) => geometry.dispose())
  textures.forEach((texture) => texture.dispose())
}
