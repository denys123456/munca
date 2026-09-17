import { BadgeEuro, BarChart3, Target, TrendingUp } from 'lucide-react'
import { BarChart } from '../../components/charts/BarChart.jsx'
import { ForecastChart } from '../../components/charts/ForecastChart.jsx'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { advisorForAccount } from '../../product/selectors.js'
import { formatCurrency } from '../../product/formatters.js'
import { getStoryData, currency } from '../../experience/storyData.js'

export function PerformancePage({ data, role }) {
  const advisor = advisorForAccount(data)
  const isAdvisor = role === 'SALES_ADVISOR'
  const sales = isAdvisor ? advisor.sales : data.dealership.monthlySales
  const target = isAdvisor ? advisor.target : data.dealership.monthlyTarget
  const factor = isAdvisor ? advisor.sales / data.dealership.monthlySales : 1
  const metrics = getStoryData(data)
  const predicted = metrics.forecast
  const progress = Math.round(sales * 100 / target)
  return <div className="page-stack performance-page">
    <section className="editorial-heading"><div><span className="eyebrow">THE POWER OF PERSPECTIVE</span><h2>Understand the pace.<br /><span>Find your next gear.</span></h2></div><p>Performance makes more sense when you can see where it came from and where it could go.</p></section>
    <section className="kpi-grid"><KpiCard icon={BadgeEuro} label="Sales booked" value={formatCurrency(sales)} detail="Current cycle volume" /><KpiCard icon={Target} label="Target achievement" value={`${progress}%`} detail="Actual versus your target" tone="success" /><KpiCard icon={TrendingUp} label="Projected finish" value={currency(predicted)} detail={metrics.forecastSource} /><KpiCard icon={BarChart3} label="Sustainable sales" value={`${data.dealership.sustainableSalesShare}%`} detail="Demo dealership green mobility mix" /></section>
    <section className="performance-analysis"><article className="performance-canvas"><SectionHeader eyebrow="ACTUAL. PROJECTED. POSSIBLE." title="The shape of your performance" />{predicted != null ? <ForecastChart actual={sales} predicted={predicted} target={target} history={data.charts.monthlySales.map((value) => value * factor)} /> : <p className="empty-state">No verified forecast is available for this account.</p>}<p className="soft-copy chart-disclosure">Historical context uses the included demonstration series. Forecast estimates are indicative.</p></article>
      <aside className="mix-panel"><SectionHeader eyebrow="THE CONTRIBUTION MIX" title="What drives the volume" /><BarChart items={data.charts.productMix} /><p className="soft-copy chart-disclosure">Dealership product contribution / current demo cycle</p></aside></section>
    <section className="forecast-context"><div><span className="eyebrow">SIGNALS BEHIND THE FORECAST</span>{data.forecast.assumptions.map((assumption) => <p key={assumption}><TrendingUp />{assumption}</p>)}</div><div><span className="eyebrow">THE NEXT MILESTONE</span><h3>{sales >= target ? 'Your ambition is paying off.' : `${formatCurrency(target - sales)} to your target.`}</h3><p className="soft-copy">Focus on qualified opportunities and sustainable customer value through the rest of the cycle.</p></div></section>
  </div>
}
