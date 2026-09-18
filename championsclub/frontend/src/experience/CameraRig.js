import { PerspectiveCamera, Vector3 } from 'three'
import { smoothRange } from './ExperienceTimeline.js'

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

      // Reframe the assembled vehicle only; mechanical shots retain their lens
      // and timeline positions, and reduced motion keeps its fixed viewpoint.
      const framing = reducedMotion ? 0 : 1 - smoothRange(state.vehicleSpread, 0, .8)
      const baseFov = portrait ? 44 : 35
      const fov = baseFov + ((portrait ? 38 : 30) - baseFov) * framing
      if (camera.fov !== fov) {
        camera.fov = fov
        camera.updateProjectionMatrix()
      }
      if (framing > 0) {
        const lensCompensation = Math.tan(baseFov * Math.PI / 360) / Math.tan(fov * Math.PI / 360)
        const margin = portrait ? Math.max(1, .46 / camera.aspect) : Math.max(1.1, 1.18 / camera.aspect)
        const dolly = lensCompensation * (1 + (margin - 1) * framing)
        camera.position.sub(target).multiplyScalar(dolly).add(target)
      }
      camera.lookAt(target)
    }
  }
}
