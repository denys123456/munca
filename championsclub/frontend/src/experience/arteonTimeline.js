export const sourceFps = 24
export const deliveryFps = sourceFps
export const deliveryFrameCount = 240
export const chapterFrames = [0, 30, 96, 126, 142, 156, 165, 174, 181, 188, 198, 211, 239]

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
