import { AlertTriangle, BadgeEuro, BrainCircuit, Target, TrendingUp, Trophy, Users } from 'lucide-react'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { LineChart } from '../../components/charts/LineChart.jsx'
import dashboardVisual from '../../assets/automotive-dashboard.png'
import { formatCurrency } from '../../product/formatters.js'

export function OverviewPage({ data, role, setActivePage }) {
  const advisor = data.advisors[0]
  const isAdvisor = role === 'SALES_ADVISOR'
  const sales = isAdvisor ? advisor.sales : data.dealership.monthlySales
  const target = isAdvisor ? advisor.target : data.dealership.monthlyTarget
  const progress = Math.round((sales * 100) / target)
  const topPerformers = [...data.advisors].sort((a, b) => b.sales - a.sales).slice(0, 3)
  const riskAdvisors = data.advisors.filter((item) => item.risk !== 'Low').slice(0, 3)

  return (
    <div className="page-stack overview-composition">
      <section className="executive-hero">
        <div className="hero-content">
          <span>{isAdvisor ? 'Advisor performance cockpit' : 'Executive performance cockpit'}</span>
          <h2>{data.dealership.name}</h2>
          <p>{data.aiInsights.summary}</p>
          <button type="button" onClick={() => setActivePage('ai-insights')}>Open Champions Intelligence</button>
        </div>
        <img src={dashboardVisual} alt="Premium dealership analytics environment" />
      </section>

      <section className="kpi-grid">
        <KpiCard icon={BadgeEuro} label="Monthly sales" value={formatCurrency(sales)} detail="Current reporting period" />
        <KpiCard icon={Target} label="Target status" value={`${progress}%`} detail={`${formatCurrency(target)} target`} tone="success" />
        <KpiCard icon={TrendingUp} label="Forecast outcome" value={formatCurrency(data.forecast.predictedSales)} detail={`${Math.round(data.forecast.confidence * 100)}% confidence`} />
        <KpiCard icon={isAdvisor ? Trophy : Users} label={isAdvisor ? 'Current level' : 'Advisor risk'} value={isAdvisor ? advisor.level : data.dealership.advisorsAtRisk} detail={isAdvisor ? `${advisor.points} points available` : 'Requires manager attention'} tone="warning" />
      </section>

      <section className="content-grid">
        <article className="panel large-panel analytic-panel">
          <SectionHeader eyebrow="Primary performance" title="Sales trajectory and forecast" />
          <LineChart values={[...data.charts.monthlySales, data.forecast.predictedSales]} />
          <div className="metric-strip">
            <Metric label="Actual" value={formatCurrency(data.dealership.monthlySales)} />
            <Metric label="Target" value={formatCurrency(data.dealership.monthlyTarget)} />
            <Metric label="Expected EOM" value={formatCurrency(data.forecast.predictedSales)} />
          </div>
        </article>

        <article className="panel intelligence-panel">
          <SectionHeader eyebrow="Champions Intelligence" title="What matters now" />
          <InsightBlock label="What changed" value={data.aiInsights.whatChanged[0]} />
          <InsightBlock label="Risk" value={data.aiInsights.needsAttention[0]} />
          <InsightBlock label="Next action" value={data.aiInsights.nextActions[0]} />
          <button className="secondary-action" type="button" onClick={() => setActivePage('ai-insights')}>
            <BrainCircuit aria-hidden="true" />
            Review intelligence
          </button>
        </article>

        <article className="panel">
          <SectionHeader eyebrow="Team" title="Top performers" />
          <div className="compact-list vertical">
            {topPerformers.map((item) => (
              <div key={item.id}>
                <Trophy aria-hidden="true" />
                <span>{item.name}</span>
                <strong>{formatCurrency(item.sales)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <SectionHeader eyebrow="Target" title="Achievement quality" />
          <ProgressBar label="Cycle progress" value={progress} />
          <div className="compact-list vertical">
            {riskAdvisors.map((item) => (
              <div key={item.id}>
                <AlertTriangle aria-hidden="true" />
                <span>{item.name}</span>
                <StatusPill value={item.risk} />
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <SectionHeader eyebrow="Alerts" title="Meaningful alerts" />
          <div className="alert-list">
            {data.alerts.slice(0, 3).map((alert) => (
              <div className="alert-row" key={alert.title}>
                <AlertTriangle aria-hidden="true" />
                <div>
                  <strong>{alert.title}</strong>
                  <span>{alert.message}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function InsightBlock({ label, value }) {
  return (
    <div className="insight-block">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  )
}
