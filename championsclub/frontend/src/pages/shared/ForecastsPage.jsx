import { BrainCircuit, Gauge, Target, TrendingUp } from 'lucide-react'
import { LineChart } from '../../components/charts/LineChart.jsx'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { formatCurrency } from '../../product/formatters.js'

export function ForecastsPage({ data }) {
  return (
    <div className="page-stack">
      <section className="forecast-board">
        <article className="panel forecast-primary">
          <SectionHeader eyebrow="Forecasting" title="Actual trajectory, forecast and target" />
          <LineChart values={[...data.charts.monthlySales, data.forecast.predictedSales]} />
          <div className="metric-strip">
            <div>
              <span>Current actual</span>
              <strong>{formatCurrency(data.dealership.monthlySales)}</strong>
            </div>
            <div>
              <span>Monthly target</span>
              <strong>{formatCurrency(data.dealership.monthlyTarget)}</strong>
            </div>
            <div>
              <span>Expected outcome</span>
              <strong>{formatCurrency(data.forecast.predictedSales)}</strong>
            </div>
          </div>
        </article>
        <aside className="panel forecast-side">
          <SectionHeader eyebrow="Model signal" title="Target probability" />
          <strong className="probability-value">{Math.round(data.forecast.targetAchievementProbability * 100)}%</strong>
          <ProgressBar label="Confidence" value={data.forecast.confidence * 100} />
          <StatusPill value={data.connectionState === 'live' ? 'Live' : 'Forecast temporarily unavailable'} />
          <p className="soft-copy">Core dashboard data remains available while live forecasting reconnects.</p>
        </aside>
      </section>

      <section className="kpi-grid">
        <KpiCard icon={TrendingUp} label="Trend" value={data.forecast.trend} detail="Latest prediction movement" />
        <KpiCard icon={Gauge} label="Confidence" value={`${Math.round(data.forecast.confidence * 100)}%`} detail={data.forecast.modelQuality} tone="success" />
        <KpiCard icon={Target} label="Target gap" value={formatCurrency(data.dealership.monthlyTarget - data.dealership.monthlySales)} detail="Remaining booked volume" />
        <KpiCard icon={BrainCircuit} label="Anomalies" value={data.forecast.anomalyHints.length} detail="Signals under observation" tone="warning" />
      </section>

      <section className="content-grid">
        <article className="panel">
          <SectionHeader eyebrow="Assumptions" title="Model basis" />
          <div className="assumption-list">
            {data.forecast.assumptions.map((assumption) => <span key={assumption}>{assumption}</span>)}
          </div>
        </article>
        <article className="panel">
          <SectionHeader eyebrow="Signals" title="Anomaly hints" />
          <div className="compact-list vertical">
            {data.forecast.anomalyHints.map((hint) => <span key={hint}>{hint}</span>)}
          </div>
        </article>
      </section>
    </div>
  )
}
