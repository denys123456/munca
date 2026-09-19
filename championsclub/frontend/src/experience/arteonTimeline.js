// The source is 24 fps. Production delivery is motion-compensated 48 fps, so
// the chapter positions are expressed in the delivered frame coordinate space.
export const sourceFps = 24
export const deliveryFps = 48
export const deliveryFrameCount = 480
export const chapterFrames = [0, 60, 192, 252, 284, 312, 330, 348, 362, 376, 396, 422, 479]

export function frameAtProgress(progress, count = deliveryFrameCount) {
  return Math.round(Math.max(0, Math.min(1, progress)) * (count - 1))
}

export function storyPhase(progress) {
  const frame = Math.max(0, Math.min(1, progress)) * (deliveryFrameCount - 1)
  const next = chapterFrames.findIndex((value) => value > frame)
  if (next < 0) return 12
  const previous = Math.max(0, next - 1)
  return previous + (frame - chapterFrames[previous]) / (chapterFrames[next] - chapterFrames[previous])
}
