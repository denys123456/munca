export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value))

// All timing comes from the decoded source PTS. Any editorial trim is explicit.
export function buildCinematicTimeline(manifest) {
  const clips = Object.fromEntries(manifest.clips.map(clip => [clip.id, clip]))
  const engineIn = manifest.edit?.engineInFrame ?? 0
  const definitions = [
    ['exterior', 'clip1', 0, clips.clip1.frames.length - 1, 1],
    ['hood-opening', 'clip2', 0, clips.clip2.frames.length - 1, 1],
    ['engineering', 'clip3', engineIn, clips.clip3.frames.length - 1, 1],
    // Present the terminal frame only once at the reversal.
    ['reconstruction', 'clip3', clips.clip3.frames.length - 2, engineIn, -1],
    ['hood-closing', 'clip2', clips.clip2.frames.length - 1, 0, -1],
    ['return', 'clip1', clips.clip1.frames.length - 1, 0, -1]
  ]
  const entries = [], segments = []
  let duration = 0
  for (const [id, clipId, from, to, direction] of definitions) {
    const segment = { id, clip: clipId, from, to, direction, start: duration, first: entries.length }
    for (let index = from; direction > 0 ? index <= to : index >= to; index += direction) {
      const frame = clips[clipId].frames[index]
      entries.push({ ...frame, key: `${clipId}:${index}`, ordinal: entries.length, time: duration, segment: segments.length })
      const neighbor = clips[clipId].frames[index + direction]
      duration += neighbor ? Math.abs(neighbor.timestamp - frame.timestamp) : frame.duration
    }
    segment.end = duration
    segment.last = entries.length - 1
    segments.push(segment)
  }
  function atTime(time) {
    let low = 0, high = entries.length - 1
    while (low < high) {
      const middle = Math.ceil((low + high) / 2)
      if (entries[middle].time <= time + 1e-7) low = middle
      else high = middle - 1
    }
    return entries[low]
  }
  const find = (segment, frame) => entries.find(entry => entry.segment === segment && entry.index === frame)
  const chapterEntries = [find(0, 0), find(0, 100), find(1, 0), find(1, 115), find(2, Math.max(engineIn, 16)), find(2, 60), find(2, 130), find(2, clips.clip3.frames.length - 1), find(3, 140), find(3, 50), find(4, 200), find(4, 90), find(5, 0)]
  const chapterProgress = chapterEntries.map(entry => Math.min(1, (entry.time + entry.duration * .25) / duration))
  chapterProgress[0] = 0; chapterProgress[12] = 1
  function phaseAt(progress) {
    const next = chapterProgress.findIndex(value => value > progress)
    if (next < 0) return 12
    if (next === 0) return 0
    return next - 1 + (progress - chapterProgress[next - 1]) / (chapterProgress[next] - chapterProgress[next - 1])
  }
  return { clips, entries, segments, duration, chapterEntries, chapterProgress, atTime, atProgress: value => atTime(clamp(value) * duration), phaseAt }
}

// Maximum three source frames of trailing motion; ~220 ms settling. No overshoot.
export function createCinematicMotion(timeline) {
  let target = 0, rendered = 0, direction = 1, previousTick = 0
  return {
    seek(progress, reduced = false) {
      const next = clamp(progress) * timeline.duration
      const entry = timeline.atTime(next)
      const segment = timeline.segments[entry.segment]
      const nextDirection = Math.sign(next - target) || direction
      const reversed = nextDirection !== direction
      const boundary = timeline.atTime(target).segment !== entry.segment
      target = next
      direction = nextDirection
      if (reduced || boundary) rendered = target
      else {
        const lag = entry.duration * (reversed ? .75 : 3)
        rendered = clamp(rendered, target - lag, target + lag)
        rendered = clamp(rendered, segment.start, Math.min(segment.end - 1e-7, timeline.duration))
      }
      previousTick = 0
    },
    tick(now, reduced = false) {
      const dt = previousTick ? Math.min(50, now - previousTick) : 16.67
      previousTick = now
      rendered += (target - rendered) * (reduced ? 1 : 1 - Math.exp(-dt / 55))
      if (Math.abs(target - rendered) < timeline.atTime(target).duration * .025) rendered = target
      return { progress: rendered / timeline.duration, targetProgress: target / timeline.duration, active: rendered !== target, lagSeconds: target - rendered }
    },
    get targetProgress() { return target / timeline.duration }
  }
}
