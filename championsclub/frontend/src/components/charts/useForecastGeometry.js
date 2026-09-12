import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { area, curveMonotoneX, line } from 'd3-shape'

export function useForecastGeometry({ actual, predicted, target, history }) {
  const chart = useRef(null)
  const [size, setSize] = useState({ width: 748, height: 290 })

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      const height = Math.round(entry.contentRect.height)
      if (width > 0 && height > 0) setSize((current) => current.width === width && current.height === height ? current : { width, height })
    })
    observer.observe(chart.current)
    return () => observer.disconnect()
  }, [])

  const geometry = useMemo(() => {
    const { width, height } = size
    const values = [...history.slice(0, -1), actual, predicted]
    const maximum = Math.max(predicted * 1.17, target * 1.16, ...values, 1)
    const bottom = height - 38
    const right = width - 48
    const ordinate = (value) => bottom - value / maximum * (bottom - 34)
    const points = values.map((value, index) => ({ x: 48 + index / (values.length - 1) * (right - 48), y: ordinate(value), value }))
    const lastActual = points[points.length - 2]
    const final = points[points.length - 1]
    const path = line().x((point) => point.x).y((point) => point.y).curve(curveMonotoneX)
    const fill = area().x((point) => point.x).y0(bottom).y1((point) => point.y).curve(curveMonotoneX)
    return { width, height, right, bottom, points, maximum, ordinate, actual: path(points.slice(0, -1)), forecast: path(points.slice(-2)), fill: fill(points.slice(0, -1)), targetY: ordinate(target), confidence: `${lastActual.x},${lastActual.y} ${final.x},${ordinate(predicted * 1.12)} ${final.x},${ordinate(predicted * .88)}` }
  }, [actual, predicted, target, history, size])

  return { chart, geometry }
}
