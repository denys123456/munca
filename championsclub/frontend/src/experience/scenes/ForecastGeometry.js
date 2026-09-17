import { BufferGeometry, Group, Line, LineBasicMaterial, Vector3 } from 'three'
import { smoothRange } from '../ExperienceTimeline.js'
import { disposeObject } from '../three/geometry.js'

export function createForecastGeometry() {
  const root = new Group()
  const colors = ['#e3e9ed', '#ef663e', '#75858e']
  return {
    root,
    setData(metrics) {
      disposeObject(root)
      root.clear()
      const maximum = Math.max(metrics.actual, metrics.forecast ?? 0, metrics.target, 1)
      ;[metrics.actual, metrics.forecast, metrics.target].forEach((value, index) => {
        if (value == null) return
        const points = []
        const angle = Math.PI * 1.6 * value / maximum
        for (let step = 0; step <= 100; step += 1) {
          const phase = -.9 + angle * step / 100
          points.push(new Vector3(Math.cos(phase) * (2.0 + index * .21), .36 + index * .15 + step * .004, Math.sin(phase) * (2.0 + index * .21)))
        }
        const line = new Line(new BufferGeometry().setFromPoints(points), new LineBasicMaterial({ color: colors[index], transparent: true, opacity: 0 }))
        root.add(line)
      })
    },
    update(progress) {
      const opacity = smoothRange(progress * 12, 7.35, 7.85) * (1 - smoothRange(progress * 12, 8.35, 8.9))
      root.visible = opacity > .001
      root.children.forEach((line) => { line.material.opacity = opacity * .75 })
    }
  }
}
