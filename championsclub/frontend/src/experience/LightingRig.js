import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export function createLighting(scene, renderer, environment, quality) {
  const generator = new THREE.PMREMGenerator(renderer)
  let studio
  let map
  if (environment) map = generator.fromEquirectangular(environment)
  else {
    studio = new RoomEnvironment()
    map = generator.fromScene(studio, .025)
    studio.dispose()
  }
  generator.dispose()
  environment?.dispose()
  scene.environment = map.texture
  scene.environmentIntensity = 1.15
  const key = new THREE.DirectionalLight('#f5f8ff', 2.0)
  key.position.set(-3, 8, 5)
  key.castShadow = quality.shadows
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = -6
  key.shadow.camera.right = 6
  key.shadow.camera.top = 6
  key.shadow.camera.bottom = -6
  key.shadow.bias = -.0004
  key.shadow.normalBias = .025
  key.shadow.radius = 4
  scene.add(key)
  const rim = new THREE.DirectionalLight('#c2d4e3', 2.8)
  rim.position.set(4, 4, -6)
  scene.add(rim)
  const fill = new THREE.HemisphereLight('#edf3fa', '#62696e', 1.0)
  scene.add(fill)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ color: '#141c21', opacity: .10, transparent: true, depthWrite: false }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = .014
  ground.receiveShadow = true
  scene.add(ground)
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 12, 64, 64, 63)
  gradient.addColorStop(0, 'rgba(12, 22, 28, .55)')
  gradient.addColorStop(.5, 'rgba(12, 22, 28, .22)')
  gradient.addColorStop(1, 'rgba(12, 22, 28, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 4.0), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false, opacity: .75 }))
  contact.rotation.x = -Math.PI / 2
  contact.position.y = .022
  scene.add(contact)
  return {
    update(darkness) {
      scene.environmentIntensity = 1.15 - darkness * .12
      key.intensity = 2 - darkness * .3
      ground.material.opacity = .10 * (1 - darkness)
      contact.material.opacity = .75 * (1 - darkness)
    },
    reduce() { key.castShadow = false; ground.visible = false },
    dispose() { map.dispose(); key.shadow.dispose() }
  }
}
