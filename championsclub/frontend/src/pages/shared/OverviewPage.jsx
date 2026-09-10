import { ArrowUpRight, BadgeEuro, Target, TrendingUp, Users, Trophy } from 'lucide-react'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { ForecastChart } from '../../components/charts/ForecastChart.jsx'
import { IntelligenceBrief } from '../../components/ui/IntelligenceBrief.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { formatCurrency } from '../../product/formatters.js'
import automotiveImage from '../../assets/automotive-dashboard.png'

export function OverviewPage({ data, role, setActivePage }) {
  const advisor = data.advisors.find((item) => item.id === data.currentUser.advisorId) ?? data.advisors[0]
  const isAdvisor = role === 'SALES_ADVISOR'
  const sales = isAdvisor ? advisor.sales : data.dealership.monthlySales
  const target = isAdvisor ? advisor.target : data.dealership.monthlyTarget
  const factor = isAdvisor ? advisor.sales / data.dealership.monthlySales : 1
  const predicted = Math.round(data.forecast.predictedSales * factor)
  const progress = Math.round(sales * 100 / target)
  const topPerformers = [...data.advisors].sort((first, second) => second.sales - first.sales).slice(0, 3)

  return <div className="page-stack overview-page">
    <section className="kpi-grid" aria-label="Performance summary">
      <KpiCard icon={BadgeEuro} label="Booked volume" value={formatCurrency(sales)} detail="+9.9% versus previous cycle" tone="success" />
      <KpiCard icon={Target} label="Target achievement" value={`${progress}%`} detail={`${formatCurrency(target - sales)} to your target`} />
      <KpiCard icon={TrendingUp} label="Projected close" value={formatCurrency(predicted)} detail={`${Math.round(data.forecast.confidence * 100)}% model confidence`} tone="success" />
      <KpiCard icon={isAdvisor ? Trophy : Users} label={isAdvisor ? 'Your points balance' : 'Advisors to support'} value={isAdvisor ? (advisor.availablePoints ?? advisor.points).toLocaleString('en') : '02'} detail={isAdvisor ? `${advisor.level} member` : 'A little attention. A measurable difference.'} tone="warning" />
    </section>
    <section className="overview-main">
      <div className="performance-canvas"><header className="canvas-header"><div><span className="eyebrow">THE BIG PICTURE</span><h2>Your trajectory. In perspective.</h2></div><span className="canvas-cycle">SEPTEMBER <i /></span></header>
        <div className="canvas-value"><strong>{formatCurrency(sales)}</strong><span><TrendingUp /> +9.9% <small>vs. last cycle</small></span></div>
        <ForecastChart actual={sales} predicted={predicted} target={target} history={data.charts.monthlySales.map((value) => value * factor)} compact />
        <div className="canvas-bottom"><div><span className="signal-dot" /><span>Projected to finish <strong>{Math.round((predicted / target - 1) * 100)}% above target</strong></span></div><button className="text-action" type="button" onClick={() => setActivePage(isAdvisor ? 'my-performance' : 'forecasts')}>Explore performance <ArrowUpRight /></button></div>
      </div>
      <IntelligenceBrief data={data} onOpen={() => setActivePage('ai-insights')} />
    </section>
    <section className="overview-bottom">
      <div className="ranking-preview"><header className="section-header"><div><span className="eyebrow">PEOPLE BEHIND THE PROGRESS</span><h2>{isAdvisor ? 'Your next milestone' : 'Leading the way'}</h2></div><button className="text-action" type="button" onClick={() => setActivePage(isAdvisor ? 'rewards' : 'leaderboard')}>{isAdvisor ? 'Rewards' : 'Full rankings'}<ArrowUpRight /></button></header>
        {isAdvisor ? <div className="milestone-preview"><Trophy /><h3>Gold is closer with every sale.</h3><ProgressBar label={`${advisor.points.toLocaleString('en')} / ${data.settings.gold.toLocaleString('en')} lifetime points`} value={advisor.points / data.settings.gold * 100} /></div> : topPerformers.map((item, index) => <button type="button" className="ranking-preview-row" key={item.id} onClick={() => setActivePage('advisor-detail', item.id)}><span className="rank-number">0{index + 1}</span><span className="avatar">{item.name.split(' ').map((part) => part[0]).join('')}</span><span className="ranking-person"><strong>{item.name}</strong><small>{item.title}</small></span><StatusPill value={item.level} /><strong>{formatCurrency(item.sales)}</strong><ArrowUpRight /></button>)}
      </div>
      <div className="club-feature"><img src={automotiveImage} alt="Volkswagen vehicles in a contemporary dealership showroom" /><div className="club-feature-copy"><span className="eyebrow">THE CHAMPIONSCLUB COLLECTION</span><h2>Performance deserves<br />something exceptional.</h2><button type="button" onClick={() => setActivePage('rewards')}>Discover your rewards <ArrowUpRight /></button></div></div>
    </section>
  </div>
}
