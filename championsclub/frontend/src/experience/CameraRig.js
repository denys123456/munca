import { PerspectiveCamera, Vector3 } from 'three'

export function createCameraRig(width, height) {
  const camera = new PerspectiveCamera(35, width / height, .05, 80)
  const target = new Vector3()
  let portrait = width < 720
  return {
    camera,
    resize(nextWidth, nextHeight) {
      portrait = nextWidth < 720
      camera.aspect = nextWidth / nextHeight
      camera.fov = portrait ? 44 : 35
      camera.updateProjectionMatrix()
    },
    update(state, reducedMotion) {
      const distance = portrait ? reducedMotion ? 1.52 : 1.95 : 1
      camera.position.set(state.cameraX * distance, state.cameraY * distance, state.cameraZ * distance)
      target.set(state.targetX, state.targetY, state.targetZ)
      if (portrait) target.y += .28
      if (reducedMotion) {
        camera.position.set(-6.2 * distance, 3.6 * distance, 8.2 * distance)
        target.set(0, .9, 0)
      }
      camera.lookAt(target)
    }
  }
}
