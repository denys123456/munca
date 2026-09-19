import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Color } from 'three'
import { createTimeline, smoothRange } from './ExperienceTimeline.js'
import { chapterFrames, deliveryFrameCount, storyPhase } from './arteonTimeline.js'

gsap.registerPlugin(ScrollTrigger)

export function useScrollTimeline(root, runtime, api, paused, ready) {
  useEffect(() => {
    const element = root.current
    const timeline = createTimeline()
    const texts = [...element.querySelectorAll('[data-story-copy]')]
    const panels = [...element.querySelectorAll('[data-story-panel]')]
    const progressLine = element.querySelector('.journey-progress-fill')
    const count = element.querySelector('[data-chapter-count]')
    const light = new Color('#e6e9e8')
    const dark = new Color('#11181d')
    const color = new Color()
    // Native wheel deltas already provide the precise scrub input we need.
    // Lenis smoothing here used to add a second, visibly delayed timeline.
    const lenis = new Lenis({ lerp: .3, smoothWheel: false, syncTouch: false, virtualScroll: () => !document.querySelector('dialog[open]'), prevent: (node) => Boolean(node.closest('[data-lenis-prevent]')) })
    const update = (progress) => {
      const phase = storyPhase(progress)
      timeline.seek(phase / 12)
      const chapter = Math.min(12, Math.round(phase))
      element.dataset.chapter = String(chapter)
      element.dataset.progress = progress.toFixed(5)
      element.style.setProperty('--scene-background', `#${color.copy(light).lerp(dark, timeline.state.darkness).getHexString()}`)
      element.dataset.tone = timeline.state.darkness > .5 ? 'dark' : 'light'
      texts.forEach((text, index) => {
        const distance = Math.abs(phase - index)
        const opacity = 1 - smoothRange(distance, .25, .53)
        text.style.opacity = String(opacity)
        text.style.visibility = opacity > .001 ? 'visible' : 'hidden'
        text.style.transform = `translate3d(0, ${(index - phase) * 45}px, 0)`
        text.setAttribute('aria-hidden', opacity < .5 ? 'true' : 'false')
      })
      panels.forEach((panel) => {
        const distance = Math.abs(phase - Number(panel.dataset.storyPanel))
        const opacity = 1 - smoothRange(distance, .24, .50)
        panel.style.opacity = String(opacity)
        panel.style.visibility = opacity > .001 ? 'visible' : 'hidden'
        panel.inert = opacity < .5
        panel.setAttribute('aria-hidden', opacity < .5 ? 'true' : 'false')
      })
      progressLine.style.transform = `scaleX(${progress})`
      count.textContent = String(chapter + 1).padStart(2, '0')
      runtime.current?.update(timeline.state, progress)
    }
    const trigger = ScrollTrigger.create({ trigger: element, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true, onUpdate: (self) => update(self.progress), onRefresh: (self) => update(self.progress) })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    api.current = {
      seek(chapter) { lenis.scrollTo(trigger.start + (trigger.end - trigger.start) * chapterFrames[chapter] / (deliveryFrameCount - 1), { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.5 }) },
      pause(value) { if (value) lenis.stop(); else { lenis.start(); runtime.current?.invalidate() } },
      refresh() { trigger.refresh(); update(trigger.progress) }
    }
    update(trigger.progress)
    return () => { api.current = null; gsap.ticker.remove(tick); trigger.kill(); lenis.destroy(); timeline.destroy() }
  }, [root, runtime, api])

  useEffect(() => { api.current?.pause(paused) }, [paused, api])
  useEffect(() => { if (ready) api.current?.refresh() }, [ready, api])
}
