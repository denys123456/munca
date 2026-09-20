import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { smoothRange } from './ExperienceTimeline.js'

gsap.registerPlugin(ScrollTrigger)

export function useScrollTimeline(root, runtime, api, paused, ready) {
  useEffect(() => {
    const element = root.current
    const texts = [...element.querySelectorAll('[data-story-copy]')]
    const panels = [...element.querySelectorAll('[data-story-panel]')]
    const line = element.querySelector('.journey-progress-fill')
    const count = element.querySelector('[data-chapter-count]')
    let lastChapter = -1
    const present = (progress, timeline, frame) => {
      const phase = timeline.phaseAt(frame.time / timeline.duration)
      const chapter = Math.min(12, Math.round(phase))
      element.dataset.chapter = String(chapter)
      element.dataset.progress = progress.toFixed(6)
      element.dataset.scene = frame.clip
      const colors = frame.edgeColors
      element.dataset.tone = colors.topLeft.reduce((sum, value) => sum + value, 0) / 3 < 50 ? 'dark' : 'light'
      const rgb = color => `rgb(${color.join(' ')})`
      element.style.setProperty('--studio-tl', rgb(colors.topLeft))
      element.style.setProperty('--studio-tr', rgb(colors.topRight))
      element.style.setProperty('--studio-bl', rgb(colors.bottomLeft))
      element.style.setProperty('--studio-br', rgb(colors.bottomRight))
      for (const [edge, stops] of Object.entries(frame.edgeProfiles || {})) {
        element.style.setProperty(`--edge-${edge}`, `linear-gradient(${edge === 'top' || edge === 'bottom' ? '90deg' : '180deg'}, ${stops.map(rgb).join(',')})`)
      }
      texts.forEach((text, index) => {
        const distance = Math.abs(phase - index)
        const opacity = 1 - smoothRange(distance, .28, .55)
        text.style.opacity = String(opacity)
        text.style.visibility = opacity > .001 ? 'visible' : 'hidden'
        text.style.transform = `translate3d(0, ${(index - phase) * 12}px, 0)`
        text.setAttribute('aria-hidden', opacity < .5 ? 'true' : 'false')
      })
      panels.forEach(panel => {
        const distance = Math.abs(phase - Number(panel.dataset.storyPanel))
        const opacity = 1 - smoothRange(distance, .28, .5)
        panel.style.opacity = String(opacity)
        panel.style.visibility = opacity > .001 ? 'visible' : 'hidden'
        panel.inert = opacity < .5
        panel.setAttribute('aria-hidden', opacity < .5 ? 'true' : 'false')
      })
      line.style.transform = `scaleX(${progress})`
      if (chapter !== lastChapter) { count.textContent = String(chapter + 1).padStart(2, '0'); lastChapter = chapter }
    }
    const update = progress => runtime.current?.update(null, progress)
    const trigger = ScrollTrigger.create({ trigger: element, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true, onUpdate: self => update(self.progress), onRefresh: self => update(self.progress) })
    api.current = {
      seek(chapter) {
        const timeline = runtime.current?.getTimeline()
        if (timeline) window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * timeline.chapterProgress[chapter], behavior: 'instant' })
      },
      pause(value) { if (!value) runtime.current?.invalidate() },
      refresh() {
        const timeline = runtime.current?.getTimeline()
        if (timeline) element.style.height = `calc(100svh + ${Math.round(timeline.duration * 260)}px)`
        runtime.current?.setPresentationListener(present)
        trigger.refresh(); update(trigger.progress)
      }
    }
    api.current.refresh()
    return () => { runtime.current?.setPresentationListener(null); api.current = null; trigger.kill() }
  }, [root, runtime, api])
  useEffect(() => { api.current?.pause(paused) }, [paused, api])
  useEffect(() => { if (ready) api.current?.refresh() }, [ready, api])
}
