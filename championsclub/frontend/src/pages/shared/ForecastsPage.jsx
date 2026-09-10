import { ArrowUpRight, Check, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { ForecastChart } from '../../components/charts/ForecastChart.jsx'
import { formatCurrency } from '../../product/formatters.js'

export function ForecastsPage({ data, setActivePage }) {
  const [scenario, setScenario] = useState('Expected')
  const multiplier = scenario === 'Conservative' ? .9 : scenario === 'Stretch' ? 1.08 : 1
  const predicted = Math.round(data.forecast.predictedSales * multiplier)
  const probability = scenario === 'Expected' ? Math.round(data.forecast.targetAchievementProbability * 100) : scenario === 'Conservative' ? 44 : 89
  return <div className="page-stack forecast-page">
    <section className="forecast-heading"><div><span className="eyebrow">THE ROAD AHEAD</span><h2>See the finish.<br /><span>Shape the outcome.</span></h2></div><div className="segmented-control" aria-label="Forecast scenario">{['Conservative', 'Expected', 'Stretch'].map((item) => <button type="button" key={item} aria-pressed={scenario === item} onClick={() => setScenario(item)}>{item}</button>)}</div></section>
    <section className="forecast-board"><div className="forecast-primary"><div className="forecast-numbers"><div><span>PROJECTED SEPTEMBER CLOSE</span><strong>{formatCurrency(predicted)}</strong><small className={predicted >= data.dealership.monthlyTarget ? 'positive' : 'negative'}>{formatCurrency(Math.abs(predicted - data.dealership.monthlyTarget))} {predicted >= data.dealership.monthlyTarget ? 'above' : 'below'} target</small></div><div><span>CURRENT ACTUAL</span><strong>{formatCurrency(data.dealership.monthlySales)}</strong><small>As of 10 September</small></div></div><ForecastChart actual={data.dealership.monthlySales} target={data.dealership.monthlyTarget} predicted={predicted} history={data.charts.monthlySales} /></div>
      <aside className="forecast-confidence"><span className="eyebrow">TARGET ACHIEVEMENT</span><div className="probability-dial" style={{ '--probability': `${probability}%` }}><div><strong>{probability}<small>%</small></strong><span>probability</span></div></div><h3>{probability >= 70 ? 'A strong position.' : 'Room to intervene.'}</h3><p>Consistency in your renewal pipeline will determine the final stretch.</p><div className="confidence-meta"><span>ML confidence</span><strong>{Math.round(data.forecast.confidence * 100)}%</strong></div><div className="confidence-meta"><span>Signal quality</span><strong>{data.forecast.modelQuality}</strong></div><button className="text-action" type="button" onClick={() => setActivePage('ai-insights')}>Explore the drivers<ArrowUpRight /></button></aside>
    </section>
    <p className="forecast-disclosure"><SlidersHorizontal />{data.connectionState === 'live' ? 'Scenario analysis' : 'Illustrative demo model'}: scenarios and the confidence region are indicative estimates, not guaranteed outcomes.</p>
    <section className="forecast-context"><div><span className="eyebrow">BUILT ON THESE ASSUMPTIONS</span>{data.forecast.assumptions.map((item) => <p key={item}><Check />{item}</p>)}</div><div><span className="eyebrow">A SIGNAL TO WATCH</span><h3>Service Protection is below its expected range.</h3><p className="soft-copy">Review attachment opportunities in open finance conversations.</p><button className="text-action" type="button" onClick={() => setActivePage('alerts')}>Review active signals<ArrowUpRight /></button></div></section>
  </div>
}
