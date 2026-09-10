import { Award, BadgeEuro, Bell, History, Target, TrendingUp } from 'lucide-react'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { formatCurrency } from '../../product/formatters.js'

export function AdvisorDetailPage({ data, selectedAdvisorId }) {
  const advisor = data.advisors.find((item) => item.id === selectedAdvisorId) ?? data.advisors[0]

  return (
    <div className="page-stack">
      <section className="profile-hero">
        <div>
          <span className="eyebrow">Advisor profile</span>
          <h2>{advisor.name}</h2>
          <p>{advisor.title} at {data.dealership.name}</p>
        </div>
        <StatusPill value={advisor.status} />
      </section>
      <section className="kpi-grid">
        <KpiCard icon={BadgeEuro} label="Monthly sales" value={formatCurrency(advisor.sales)} detail="Current cycle" />
        <KpiCard icon={Target} label="Target progress" value={`${Math.round(advisor.sales * 100 / advisor.target)}%`} detail={formatCurrency(advisor.target)} />
        <KpiCard icon={TrendingUp} label="Forecast probability" value={`${advisor.forecastProbability}%`} detail="Target achievement probability" />
        <KpiCard icon={Award} label="Level" value={advisor.level} detail={`${advisor.points} points available`} />
      </section>
      <section className="content-grid">
        <article className="panel large-panel">
          <SectionHeader eyebrow="Activity" title="Recent sales activity" />
          <CompactSalesTable sales={data.salesHistory.filter((sale) => sale.advisor === advisor.name)} />
        </article>
        <article className="panel">
          <SectionHeader eyebrow="AI" title="Advisor recommendations" />
          <div className="recommendation-list">
            {data.aiInsights.nextActions.map((action) => <div key={action}>{action}</div>)}
          </div>
        </article>
        <article className="panel">
          <SectionHeader eyebrow="Alerts" title="Active advisor alerts" />
          <div className="compact-list vertical">
            {data.alerts.slice(0, 3).map((alert) => (
              <div key={alert.title}>
                <Bell aria-hidden="true" />
                <span>{alert.title}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <SectionHeader eyebrow="Rewards" title="Reward eligibility" />
          <ProgressBar label="Next premium reward" value={64} />
        </article>
      </section>
    </div>
  )
}

function CompactSalesTable({ sales }) {
  return (
    <div className="data-table compact">
      {sales.map((sale) => (
        <div className="table-row" key={sale.product + sale.date}>
          <History aria-hidden="true" />
          <span>{sale.product}</span>
          <strong>{formatCurrency(sale.amount)}</strong>
          <small>{sale.date}</small>
        </div>
      ))}
    </div>
  )
}

