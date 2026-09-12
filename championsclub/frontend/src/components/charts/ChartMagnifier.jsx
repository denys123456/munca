import { Dialog } from '../ui/Dialog.jsx'
import { formatCurrency } from '../../product/formatters.js'

export function ChartMagnifier({ point, label, isForecast, isCurrent, confidence, target, geometry, onClose }) {
  const transform = `translate(${360 - point.x * 2}, ${170 - point.y * 2}) scale(2)`
  return <Dialog className="chart-focus-layer" title={`Forecast detail / ${label}`} onClose={onClose}>
    <div className="chart-magnified-sheet">
      <div className="chart-magnified-kicker">OPTICAL DETAIL / {label.toUpperCase()}</div>
      <div className="chart-magnified-layout">
        <div className="chart-lens"><svg viewBox="0 0 720 340" aria-hidden="true"><g transform={transform}><line x1="0" x2={geometry.width} y1={geometry.targetY} y2={geometry.targetY} className="chart-target" /><path d={geometry.actual} className="chart-actual" /><path d={geometry.forecast} className="chart-prediction" /></g><circle cx="360" cy="170" r="9" className="chart-magnified-point" /></svg></div>
        <div className="chart-detail-copy"><span>{isForecast ? 'Projected volume' : 'Recorded volume'}</span><strong>{formatCurrency(point.value)}</strong><dl><div><dt>Date</dt><dd>{label}</dd></div><div><dt>{isForecast ? 'Forecast' : 'Actual'}</dt><dd>{formatCurrency(point.value)}</dd></div>{(isCurrent || isForecast) && <><div><dt>Target</dt><dd>{formatCurrency(target)}</dd></div><div><dt>Variance</dt><dd>{point.value >= target ? '+' : '−'}{formatCurrency(Math.abs(point.value - target))}</dd></div></>}{isForecast && confidence !== undefined && <div><dt>Model confidence</dt><dd>{Math.round(confidence * 100)}%</dd></div>}</dl></div>
      </div>
    </div>
  </Dialog>
}
