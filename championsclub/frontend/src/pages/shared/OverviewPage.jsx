import { ArrowUpRight, BadgeEuro, Target, TrendingUp, Trophy } from 'lucide-react'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { ForecastChart } from '../../components/charts/ForecastChart.jsx'
import { getStoryData, currency, percentage } from '../../experience/storyData.js'

export function OverviewPage({ data, role, setActivePage }) {
  const metrics = getStoryData(data)
  return <div className="page-stack overview-page">
    <section className="kpi-grid" aria-label="Performance summary">
      <KpiCard icon={BadgeEuro} label="Booked volume" value={currency(metrics.actual)} detail={metrics.source} />
      <KpiCard icon={Target} label="Target achievement" value={percentage(metrics.achievement)} detail={`${currency(metrics.target)} cycle target`} />
      <KpiCard icon={TrendingUp} label="Projected close" value={currency(metrics.forecast)} detail={metrics.forecastSource} />
      <KpiCard icon={Trophy} label={metrics.personal ? 'Your points balance' : 'Team points balance'} value={metrics.balance.toLocaleString('en')} detail={metrics.personal ? metrics.advisor.level : 'Demo ledger context'} />
    </section>
    <section className="overview-main"><div className="performance-canvas"><header className="canvas-header"><div><span className="eyebrow">PERFORMANCE / CURRENT CYCLE</span><h2>Your trajectory. In perspective.</h2></div></header><div className="canvas-value"><strong>{currency(metrics.actual)}</strong></div>{metrics.forecast != null ? <ForecastChart actual={metrics.actual} predicted={metrics.forecast} target={metrics.target} history={data.charts.monthlySales} confidence={metrics.confidence} compact /> : <p className="soft-copy">No verified forecast is available for this account.</p>}<div className="canvas-bottom"><span className="soft-copy">Historical context uses the seeded demo series.</span><button className="text-action" onClick={() => setActivePage(metrics.personal ? 'my-performance' : 'forecasts')}>Explore performance <ArrowUpRight /></button></div></div>
      <aside className="intelligence-brief"><span className="eyebrow">CHAMPIONS INTELLIGENCE</span><h2>Signal into direction.</h2><p className="intelligence-lead">{metrics.insight}</p><span className="micro-label">{metrics.intelligenceSource}</span><button className="text-action" onClick={() => setActivePage('ai-insights')}>Open your intelligence brief <ArrowUpRight /></button></aside></section>
    <section className="panel"><header className="section-header"><div><span className="eyebrow">PEOPLE BEHIND THE PERFORMANCE</span><h2>{metrics.personal ? 'Your contribution' : 'Team contribution'}</h2></div>{role === 'MANAGER' && <button className="text-action" onClick={() => setActivePage('leaderboard')}>Full rankings <ArrowUpRight /></button>}</header>{[...metrics.contributors].sort((first, second) => second.sales - first.sales).map((advisor, index) => <button className="ranking-preview-row" key={advisor.id} onClick={() => setActivePage(metrics.personal ? 'my-performance' : 'advisor-detail', metrics.personal ? undefined : advisor.id)}><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><span className="ranking-person"><strong>{advisor.name}</strong><small>{advisor.title}</small></span><strong>{currency(advisor.sales)}</strong><ArrowUpRight /></button>)}</section>
  </div>
}
