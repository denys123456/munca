import { ArrowUpRight } from 'lucide-react'
import { ForecastChart } from '../../components/charts/ForecastChart.jsx'
import { advisorForAccount, availableBalance } from '../../product/selectors.js'
import { formatCurrency } from '../../product/formatters.js'
import { Scene, JourneyOpening, PrintLabel, ChapterEnd } from './EditorialParts.jsx'

export function OverviewChapter({ data, stops, onNavigate, personalPerformance = false }) {
  const individual = data.currentUser.role === 'SALES_ADVISOR'
  const advisor = advisorForAccount(data)
  const sales = individual ? advisor.sales : data.dealership.monthlySales
  const target = individual ? advisor.target : data.dealership.monthlyTarget
  const factor = individual ? sales / data.dealership.monthlySales : 1
  const predicted = Math.round(data.forecast.predictedSales * (data.forecastScope === 'advisor' ? 1 : factor))
  return <>
    <Scene stops={stops} index={0} className="overview-opening"><JourneyOpening title={individual ? 'Your performance' : 'Executive overview'} first={individual ? 'Your ambition.' : 'The bigger picture.'} emphasis={individual ? 'In motion.' : 'In perspective.'} description={`${data.currentUser.name}, every performance tells a story. This is yours.`} /><div className="opening-seal"><span>CC</span><small>THE PERFORMANCE STANDARD</small></div></Scene>
    <Scene stops={stops} index={1}><PrintLabel number="01">THE MOMENTUM YOU HAVE BUILT</PrintLabel><h2>Progress you<br /><em>can measure.</em></h2><div className="print-amount"><span>€</span>{sales.toLocaleString('en')}</div><div className="volume-baseline"><span>SALES BOOKED</span><span className="print-growth">{Math.round(sales / target * 100)}%<small>of {formatCurrency(target)}</small></span></div><p className="chapter-deck">{individual ? `${availableBalance(advisor).toLocaleString('en')} points available. ${advisor.level} membership.` : `${data.advisors.length} advisors. One shared ambition.`}</p></Scene>
    <Scene stops={stops} index={2}><PrintLabel number="02">THE LONG VIEW</PrintLabel><h2>Give momentum<br /><em>a direction.</em></h2><ForecastChart actual={sales} predicted={predicted} target={target} history={data.charts.monthlySales.map((value) => value * factor)} confidence={data.forecast.confidence} /><button className="print-link" onClick={() => onNavigate(personalPerformance ? 'targets' : individual ? 'my-performance' : 'forecasts')}>{personalPerformance ? 'Shape your next target' : 'Explore the performance story'}<ArrowUpRight /></button></Scene>
    <Scene stops={stops} index={3} className="annotation-scene"><PrintLabel number="03">CHAMPIONS INTELLIGENCE</PrintLabel><blockquote>{data.aiInsights.summary}</blockquote><p className="chapter-deck">{data.aiInsights.nextActions[0]}</p><button className="print-link" onClick={() => onNavigate('ai-insights')}>Read your intelligence brief<ArrowUpRight /></button><span className="source-note">{data.insightSource === 'live' ? 'SERVICE INTELLIGENCE' : 'DEMONSTRATION INTELLIGENCE'}</span></Scene>
    <Scene stops={stops} index={4}><ChapterEnd title="Turn ambition into action." onNavigate={onNavigate} destination={individual ? 'rewards' : 'team-performance'} nextTitle={individual ? 'Discover your recognition' : 'Meet the collective'} /></Scene>
  </>
}
