import { useId } from 'react'
import { area, curveMonotoneX, line } from 'd3-shape'

export function LineChart({ values }) {
  const id = useId()
  const maximum = Math.max(...values, 1) * 1.12
  const points = values.map((value, index) => ({ x: 40 + index * 600 / Math.max(1, values.length - 1), y: 215 - value / maximum * 185 }))
  const path = line().x((point) => point.x).y((point) => point.y).curve(curveMonotoneX)
  const fill = area().x((point) => point.x).y0(215).y1((point) => point.y).curve(curveMonotoneX)
  return <svg className="line-chart" viewBox="0 0 680 250" role="img" aria-label={`Monthly sales trend: ${values.join(', ')} euros`}>
    <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#a5dbc0" stopOpacity=".2" /><stop offset="1" stopColor="#a5dbc0" stopOpacity="0" /></linearGradient></defs>
    {[0, 1, 2, 3].map((index) => <line className="chart-gridline" key={index} x1="40" x2="640" y1={215 - index * 60} y2={215 - index * 60} />)}
    <path d={fill(points)} fill={`url(#${id})`} /><path className="chart-actual" d={path(points)} />
    {points.map((point, index) => <g key={index}><circle className="chart-dot" cx={point.x} cy={point.y} r="3" /><text className="chart-axis" x={point.x} y="240" textAnchor="middle">{['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][index]}</text></g>)}
  </svg>
}
