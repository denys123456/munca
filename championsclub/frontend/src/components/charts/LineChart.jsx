export function LineChart({ values }) {
  const maximumValue = Math.max(...values, 1)
  const chartPoints = values.map((value, index) => {
    const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100
    const y = 100 - (value / maximumValue) * 86
    return { x, y: Math.max(8, y) }
  })
  const polylinePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(' ')
  const forecastPoints = chartPoints.slice(-2).map((point) => `${point.x},${point.y}`).join(' ')
  const confidencePolygon = [
    ...chartPoints.map((point) => `${point.x},${Math.max(5, point.y - 8)}`),
    ...chartPoints.slice().reverse().map((point) => `${point.x},${Math.min(96, point.y + 10)}`),
  ].join(' ')

  return (
    <svg className="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Line chart">
      <defs>
        <linearGradient id="chartLineGradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#4d8dff" />
          <stop offset="58%" stopColor="#45d2ff" />
          <stop offset="100%" stopColor="#f1d39a" />
        </linearGradient>
        <linearGradient id="chartConfidenceGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4d8dff" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#4d8dff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon className="confidence-band" points={confidencePolygon} />
      <line className="target-line" x1="0" x2="100" y1="22" y2="22" />
      <polyline className="actual-line" points={polylinePoints} />
      {chartPoints.length > 2 && <polyline className="forecast-line" points={forecastPoints} />}
      {chartPoints.map((point) => <circle cx={point.x} cy={point.y} r="1.8" key={`${point.x}-${point.y}`} />)}
    </svg>
  )
}
