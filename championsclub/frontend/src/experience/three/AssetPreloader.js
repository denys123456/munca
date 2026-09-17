import { createTimeline } from '../ExperienceTimeline.js'

export async function prepareScene({ renderer, scene, mechanical, cameraRig, lighting, forecast, isDisposed, onProgress }) {
  const timeline = createTimeline()
  try {
    const checkpoints = [.18, .24, .42, .67, .75]
    for (let index = 0; index < checkpoints.length; index += 1) {
      if (isDisposed()) return
      const progress = checkpoints[index]
      timeline.seek(progress)
      mechanical.update(timeline.state, progress)
      cameraRig.update(timeline.state, false)
      lighting.update(timeline.state.darkness)
      forecast.update(progress)
      await renderer.compileAsync(scene, cameraRig.camera)
      if (isDisposed()) return
      renderer.render(scene, cameraRig.camera)
      onProgress(78 + (index + 1) / checkpoints.length * 20)
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  } finally { timeline.destroy() }
}
