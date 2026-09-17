import { useEffect, useId, useRef, useState } from 'react'
import { formatCurrency } from '../../product/formatters.js'
import { ChartMagnifier } from './ChartMagnifier.jsx'
import { useForecastGeometry } from './useForecastGeometry.js'

export function ForecastChart({ actual, predicted, target, history, confidence, compact = false }) {
  const id = useId()
  const [selected, setSelected] = useState(null)
  const [magnified, setMagnified] = useState(null)
  const pending = useRef(null)
  const { chart, geometry } = useForecastGeometry({ actual, predicted, target, history })
  const labels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep 10', 'Sep 30']
  const current = geometry.points[geometry.points.length - 2]
  function cancelPreview() {
    window.clearTimeout(pending.current)
    pending.current = null
  }

  function openDetail(index) {
    cancelPreview()
    setMagnified(index)
    setSelected(null)
  }

  function preview(event, index) {
    cancelPreview()
    setSelected(index)
    if (event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const point = event.currentTarget
    pending.current = window.setTimeout(() => {
      if (point.matches(':hover') && !document.querySelector('dialog[open], [data-focus-layer]')) openDetail(index)
    }, 700)
  }

  useEffect(() => {
    const dismiss = () => { cancelPreview(); setSelected(null) }
    const resize = () => { dismiss(); setMagnified(null) }
    const keyboard = (event) => { if (event.key === 'Escape') dismiss() }
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    document.addEventListener('scroll', dismiss, true)
    document.addEventListener('keydown', keyboard)
    window.addEventListener('blur', dismiss)
    window.addEventListener('resize', resize)
    preference.addEventListener('change', dismiss)
    return () => {
      cancelPreview()
      document.removeEventListener('scroll', dismiss, true)
      document.removeEventListener('keydown', keyboard)
      window.removeEventListener('blur', dismiss)
      window.removeEventListener('resize', resize)
      preference.removeEventListener('change', dismiss)
    }
  }, [])

  return <div className={`forecast-visual ${compact ? 'compact' : ''}`}>
    <div className="chart-legend"><span><i className="actual-key" />Actual</span><span><i className="forecast-key" />Forecast</span><span><i className="confidence-key" />Confidence region</span><span><i className="target-key" />Target</span></div>
    <svg ref={chart} className="forecast-chart" viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="group" aria-label={`Actual ${formatCurrency(actual)}, predicted ${formatCurrency(predicted)}, target ${formatCurrency(target)}`}>
      <defs><linearGradient id={`${id}-area`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a5dbc0" stopOpacity=".16" /><stop offset="1" stopColor="#a5dbc0" stopOpacity="0" /></linearGradient><linearGradient id={`${id}-confidence`} x1="0" x2="1"><stop stopColor="#d5bd87" stopOpacity=".02" /><stop offset="1" stopColor="#d5bd87" stopOpacity=".23" /></linearGradient></defs>
      {[0, 1, 2, 3, 4].map((index) => <g key={index}><line className="chart-gridline" x1="48" x2={geometry.right} y1={geometry.ordinate(geometry.maximum * index / 4)} y2={geometry.ordinate(geometry.maximum * index / 4)} /><text className="chart-axis" x="0" y={geometry.ordinate(geometry.maximum * index / 4) + 4}>{Math.round(geometry.maximum * index / 4 / 1000)}k</text></g>)}
      <path d={geometry.fill} fill={`url(#${id}-area)`} />
      <polygon points={geometry.confidence} fill={`url(#${id}-confidence)`} />
      <line className="chart-target" x1="48" x2={geometry.right} y1={geometry.targetY} y2={geometry.targetY} />
      <text x={geometry.right} y={geometry.targetY - 12} className="chart-target-label" textAnchor="end">TARGET {Math.round(target / 1000)}K</text>
      <line className="chart-current" x1={current.x} x2={current.x} y1="22" y2={geometry.bottom} />
      <path className="chart-actual" d={geometry.actual} /><path className="chart-prediction" d={geometry.forecast} />
      {geometry.points.map((point, index) => <g key={index}><circle className={index === geometry.points.length - 2 ? 'chart-dot current-dot' : 'chart-dot'} cx={point.x} cy={point.y} r={index === geometry.points.length - 2 ? 5 : 3} /><circle className="chart-hit" cx={point.x} cy={point.y} r="20" tabIndex="0" role="button" aria-haspopup="dialog" aria-label={`${labels[index]}: ${formatCurrency(point.value)}`} onPointerEnter={(event) => preview(event, index)} onPointerLeave={() => { cancelPreview(); setSelected(null) }} onFocus={() => setSelected(index)} onBlur={() => { cancelPreview(); setSelected(null) }} onClick={() => openDetail(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); openDetail(index) } }} /><text className="chart-axis" x={point.x} y={geometry.height - 9} textAnchor="middle">{labels[index]}</text>{geometry.width > 900 && <text className="chart-point-value" x={point.x} y={point.y - 24} textAnchor="middle">{formatCurrency(point.value)}</text>}</g>)}
      {selected !== null && <g className="chart-tooltip" transform={`translate(${Math.min(geometry.width - 65, Math.max(65, geometry.points[selected].x))}, ${Math.max(30, geometry.points[selected].y - 34)})`}><rect x="-52" y="-18" width="108" height="27" rx="1" /><text textAnchor="middle" y="0">{formatCurrency(geometry.points[selected].value)}</text></g>}
    </svg>
    <div className="chart-footnote"><span>EUR <span aria-hidden="true"> / </span> MONTHLY VOLUME</span><span>Current cycle to projected close</span></div>
    {magnified !== null && <ChartMagnifier point={geometry.points[magnified]} label={labels[magnified]} isForecast={magnified === geometry.points.length - 1} isCurrent={magnified === geometry.points.length - 2} confidence={confidence} target={target} geometry={geometry} onClose={() => { cancelPreview(); setMagnified(null); setSelected(null) }} />}
  </div>
}
