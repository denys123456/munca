import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildCinematicTimeline, createCinematicMotion } from '../src/experience/arteonTimeline.js'

const manifest = JSON.parse(readFileSync(new URL('../public/media/cinematic/manifest.json', import.meta.url)))
const timeline = buildCinematicTimeline(manifest)

test('all decoded original frames have production entries and are reachable in PTS order', () => {
  for (const clip of manifest.clips) {
    assert.equal(clip.frames.length, clip.source.frameCount)
    for (const frame of clip.frames) {
      assert.equal(frame.width / frame.height, 16 / 9)
      assert.ok(frame.asset)
      const entries = timeline.entries.filter(entry => entry.clip === clip.id && entry.index === frame.index)
      if (clip.id === 'clip3' && frame.index < (manifest.edit?.engineInFrame || 0)) continue
      assert.ok(entries.length >= 1)
      for (const entry of entries) assert.equal(timeline.atTime(entry.time + .01).ordinal, entry.ordinal)
    }
  }
  assert.equal(timeline.entries[0].key, timeline.entries.at(-1).key)
  assert.equal(timeline.atProgress(1).index, 0)
})
test('reverse traverses each original path with no doubled exploded terminal frame', () => {
  assert.equal(timeline.entries[timeline.segments[2].last].index, 239)
  assert.equal(timeline.entries[timeline.segments[3].first].index, 238)
  for (const segment of timeline.segments) {
    const entries = timeline.entries.slice(segment.first, segment.last + 1)
    for (let i = 1; i < entries.length; i++) {
      assert.equal(entries[i].index - entries[i - 1].index, segment.direction)
      assert.ok(entries[i].time > entries[i - 1].time)
      assert.ok(Math.abs((entries[i].time - entries[i - 1].time) - Math.abs(entries[i].timestamp - entries[i - 1].timestamp)) < .000002)
    }
  }
})
test('damping responds within a tick and settles monotonically, bounded to three frames', () => {
  const motion = createCinematicMotion(timeline)
  motion.seek(.1)
  let value = motion.tick(100)
  assert.ok(value.progress > .097 && value.progress < .1)
  let previous = value.progress
  for (let now = 116; now <= 500; now += 16) {
    value = motion.tick(now)
    assert.ok(value.progress >= previous && value.progress <= .1)
    previous = value.progress
  }
  assert.equal(value.active, false)
  assert.equal(value.progress, .1)
  motion.seek(.09)
  assert.ok(motion.tick(520).progress < .1)
})
test('stopping and reversing adjacent to every boundary never triggers an unintended cut', () => {
  for (const segment of timeline.segments.slice(1)) for (const side of [-1, 1]) {
    const motion = createCinematicMotion(timeline)
    const target = (segment.start + side * .02) / timeline.duration
    motion.seek(target + side * .0002)
    motion.tick(10)
    motion.seek(target)
    for (let now = 30; now < 600; now += 16) assert.equal(timeline.atProgress(motion.tick(now).progress).segment, timeline.atProgress(target).segment)
  }
})
test('variable PTS intervals drive selection instead of a guessed frame rate', () => {
  const variant = structuredClone(manifest)
  variant.clips[0].frames.forEach((frame, i) => { frame.timestamp = i * .04 + (i > 50 ? .3 : 0); frame.duration = .04 })
  const vfr = buildCinematicTimeline(variant)
  const entry = vfr.entries[50]
  assert.equal(vfr.atTime(entry.time + .2).index, 50)
  assert.equal(vfr.atTime(vfr.entries[51].time + .001).index, 51)
})
