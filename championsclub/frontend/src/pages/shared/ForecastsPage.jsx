import { useState } from 'react'
import { ForecastChart } from '../../components/charts/ForecastChart.jsx'
import { getStoryData, currency, percentage } from '../../experience/storyData.js'

export function ForecastsPage({ data }) {
  const [scenario, setScenario] = useState('Expected')
  const metrics = getStoryData(data)
  const multiplier = scenario === 'Conservative' ? .9 : scenario === 'Stretch' ? 1.08 : 1
  const predicted = metrics.forecast == null ? null : Math.round(metrics.forecast * multiplier)
  const probability = scenario === 'Expected' && predicted != null ? percentage(data.forecast.targetAchievementProbability * 100) : 'Unavailable'
  return <div className="page-stack forecast-page"><section className="forecast-heading"><div><span className="eyebrow">THE ROAD AHEAD</span><h2>Read the road.<br />Shape what’s next.</h2></div><div className="segmented-control" aria-label="Forecast scenario">{['Conservative', 'Expected', 'Stretch'].map((item) => <button key={item} aria-pressed={scenario === item} onClick={() => setScenario(item)}>{item}</button>)}</div></section>
    <section className="forecast-board"><div className="forecast-primary"><div className="forecast-numbers"><div><span>{scenario === 'Expected' ? 'PROJECTED CLOSE' : 'ILLUSTRATIVE WHAT-IF SCENARIO'}</span><strong>{currency(predicted)}</strong><small>{metrics.forecastSource}</small></div><div><span>CURRENT ACTUAL</span><strong>{currency(metrics.actual)}</strong></div></div>{predicted != null ? <ForecastChart actual={metrics.actual} target={metrics.target} predicted={predicted} history={data.charts.monthlySales} confidence={scenario === 'Expected' ? metrics.confidence : undefined} /> : <p className="empty-state">No verified forecast is available for this account.</p>}</div><aside className="forecast-confidence"><span className="eyebrow">TARGET ACHIEVEMENT PROBABILITY</span><h2>{probability}</h2><div className="confidence-meta"><span>Model confidence</span><strong>{metrics.confidence == null ? 'Unavailable' : percentage(metrics.confidence * 100)}</strong></div><p className="soft-copy">The service supplies the expected forecast. What-if scenarios apply a transparent adjustment and have no model probability.</p></aside></section>
    <p className="soft-copy">{scenario === 'Expected' ? 'Expected values use the connected model or the explicitly seeded demo forecast.' : `${scenario} applies ${multiplier === .9 ? 'a 10% reduction' : 'an 8% increase'} to the expected forecast. This is an illustrative adjustment, not a new ML prediction.`} Historical context and chart confidence regions are illustrative demo data.</p>
    <section className="forecast-context"><div><span className="eyebrow">FORECAST ASSUMPTIONS / {data.forecastSource === 'live' ? 'SERVICE WITH DEMO CONTEXT' : 'DEMO CONTEXT'}</span>{data.forecast.assumptions.map((item) => <p key={item}>{item}</p>)}</div><div><span className="eyebrow">SIGNALS TO REVIEW</span>{data.forecast.anomalyHints.map((item) => <p key={item}>{item}</p>)}</div></section>
  </div>
}
