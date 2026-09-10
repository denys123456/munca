import { BadgeEuro, BarChart3, Target, TrendingUp } from 'lucide-react'
import { BarChart } from '../../components/charts/BarChart.jsx'
import { LineChart } from '../../components/charts/LineChart.jsx'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { formatCurrency } from '../../product/formatters.js'

export function PerformancePage({ data, role }) {
  const advisor = data.advisors[0]
  const isAdvisor = role === 'SALES_ADVISOR'
  const sales = isAdvisor ? advisor.sales : data.dealership.monthlySales
  const target = isAdvisor ? advisor.target : data.dealership.monthlyTarget
  const progress = Math.round(sales * 100 / target)

  return (
    <div className="page-stack">
      <section className="kpi-grid">
        <KpiCard icon={BadgeEuro} label="Sales booked" value={formatCurrency(sales)} detail="Current cycle booked volume" />
        <KpiCard icon={Target} label="Target achievement" value={`${progress}%`} detail="Actual versus target" tone="success" />
        <KpiCard icon={TrendingUp} label="Previous cycle" value={formatCurrency(data.dealership.previousCycleSales)} detail="Comparison baseline" />
        <KpiCard icon={BarChart3} label="Sustainable sales" value={`${data.dealership.sustainableSalesShare}%`} detail="Eligible green mobility mix" />
      </section>

      <section className="content-grid">
        <article className="panel large-panel">
          <SectionHeader eyebrow="Six month trend" title="Revenue trajectory" />
          <LineChart values={data.charts.monthlySales} />
        </article>
        <article className="panel">
          <SectionHeader eyebrow="Products" title="Financial product mix" />
          <BarChart items={data.charts.productMix} />
        </article>
        <article className="panel">
          <SectionHeader eyebrow="Target" title="Achievement trend" />
          <div className="progress-stack">
            {data.charts.targetProgress.map((value, index) => (
              <ProgressBar label={`Cycle ${index + 1}`} value={value} key={value + index} />
            ))}
          </div>
        </article>
        <article className="panel">
          <SectionHeader eyebrow="Forecast" title="Forecast explanation" />
          <p className="soft-copy">The model expects continued upward pressure from renewal conversations and Fleet Advantage demand.</p>
          <div className="assumption-list">
            {data.forecast.assumptions.map((assumption) => <span key={assumption}>{assumption}</span>)}
          </div>
        </article>
      </section>
    </div>
  )
}

