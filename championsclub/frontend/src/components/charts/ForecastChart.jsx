import { useId, useMemo, useState } from 'react'
import { area, curveMonotoneX, line } from 'd3-shape'
import { formatCurrency } from '../../product/formatters.js'

export function ForecastChart({ actual, predicted, target, history, compact = false }) {
  const id = useId()
  const [selected, setSelected] = useState(null)
  const geometry = useMemo(() => {
    const values = [...history.slice(0, -1), actual, predicted]
    const maximum = Math.max(predicted * 1.17, target * 1.16, ...values)
    const points = values.map((value, index) => ({ x: 58 + index * 107, y: 250 - value / maximum * 215, value }))
    const lastActual = points[points.length - 2]
    const final = points[points.length - 1]
    const path = line().x((point) => point.x).y((point) => point.y).curve(curveMonotoneX)
    const fill = area().x((point) => point.x).y0(250).y1((point) => point.y).curve(curveMonotoneX)
    return { points, maximum, actual: path(points.slice(0, -1)), forecast: path(points.slice(-2)), fill: fill(points.slice(0, -1)), targetY: 250 - target / maximum * 215, confidence: `${lastActual.x},${lastActual.y} ${final.x},${250 - predicted * 1.12 / maximum * 215} ${final.x},${250 - predicted * .88 / maximum * 215}` }
  }, [actual, predicted, target, history])
  const labels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep 10', 'Sep 30']
  const current = geometry.points[geometry.points.length - 2]

  return <div className={`forecast-visual ${compact ? 'compact' : ''}`}>
    <div className="chart-legend"><span><i className="actual-key" />Actual</span><span><i className="forecast-key" />Forecast</span><span><i className="confidence-key" />Confidence region</span><span><i className="target-key" />Target</span></div>
    <svg className="forecast-chart" viewBox="0 0 748 290" role="img" aria-label={`Actual ${formatCurrency(actual)}, predicted ${formatCurrency(predicted)}, target ${formatCurrency(target)}`}>
      <defs><linearGradient id={`${id}-area`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a5dbc0" stopOpacity=".16" /><stop offset="1" stopColor="#a5dbc0" stopOpacity="0" /></linearGradient><linearGradient id={`${id}-confidence`} x1="0" x2="1"><stop stopColor="#d5bd87" stopOpacity=".02" /><stop offset="1" stopColor="#d5bd87" stopOpacity=".23" /></linearGradient></defs>
      {[0, 1, 2, 3, 4].map((index) => <g key={index}><line className="chart-gridline" x1="58" x2="710" y1={250 - index * 54} y2={250 - index * 54} /><text className="chart-axis" x="0" y={254 - index * 54}>{Math.round(geometry.maximum * index / 4 / 1000)}k</text></g>)}
      <path d={geometry.fill} fill={`url(#${id}-area)`} />
      <polygon points={geometry.confidence} fill={`url(#${id}-confidence)`} />
      <line className="chart-target" x1="58" x2="710" y1={geometry.targetY} y2={geometry.targetY} />
      <text x="710" y={geometry.targetY - 9} className="chart-target-label" textAnchor="end">TARGET {Math.round(target / 1000)}K</text>
      <line className="chart-current" x1={current.x} x2={current.x} y1="22" y2="250" />
      <path className="chart-actual" d={geometry.actual} /><path className="chart-prediction" d={geometry.forecast} />
      {geometry.points.map((point, index) => <g key={index}><circle className={index === 5 ? 'chart-dot current-dot' : 'chart-dot'} cx={point.x} cy={point.y} r={index === 5 ? 5 : 3} /><circle className="chart-hit" cx={point.x} cy={point.y} r="17" tabIndex="0" role="button" aria-label={`${labels[index]}: ${formatCurrency(point.value)}`} onMouseEnter={() => setSelected(index)} onMouseLeave={() => setSelected(null)} onFocus={() => setSelected(index)} onBlur={() => setSelected(null)} onClick={() => setSelected(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelected(index) }} /><text className="chart-axis" x={point.x} y="279" textAnchor="middle">{labels[index]}</text></g>)}
      {selected !== null && <g className="chart-tooltip" transform={`translate(${Math.min(623, Math.max(65, geometry.points[selected].x))}, ${Math.max(30, geometry.points[selected].y - 34)})`}><rect x="-52" y="-18" width="108" height="27" rx="4" /><text textAnchor="middle" y="0">{formatCurrency(geometry.points[selected].value)}</text></g>}
    </svg>
    <div className="chart-footnote"><span>EUR <span aria-hidden="true"> / </span> MONTHLY VOLUME</span><span>Current cycle to projected close</span></div>
  </div>
}
