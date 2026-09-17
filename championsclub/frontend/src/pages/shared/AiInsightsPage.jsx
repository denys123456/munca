import { ArrowUpRight, Check, Plus } from 'lucide-react'
import { getStoryData } from '../../experience/storyData.js'

export function AiInsightsPage({ data, setActivePage, role }) {
  const metrics = getStoryData(data)
  const actions = metrics.live && data.insightSource !== 'live' ? [] : data.aiInsights.nextActions
  return <div className="page-stack intelligence-page"><section className="intelligence-masthead"><div className="intelligence-label"><span>CHAMPIONS INTELLIGENCE</span><span>{metrics.intelligenceSource}</span></div><h2>Signal into direction.</h2><p>{metrics.insight}</p></section><section className="intelligence-story">{metrics.signals.map(([label, content], index) => <article className="insight-section" key={label}><span className="insight-number">0{index + 1}</span><div><span className="eyebrow">{label}</span><p>{content || 'Awaiting a verified signal.'}</p></div></article>)}</section><section className="next-actions"><header><span className="eyebrow">NEXT BEST ACTION</span><h2>Turn insight into progress.</h2></header><div>{actions.map((action, index) => { const added = data.actionPlan.includes(action); return <button key={action} aria-pressed={added} onClick={() => data.actions.toggleAction(action)}><span>0{index + 1}</span><strong>{action}</strong>{added ? <Check /> : <Plus />}</button> })}</div></section><button className="text-action" onClick={() => setActivePage(role === 'SALES_ADVISOR' ? 'my-performance' : 'team-performance')}>Review performance <ArrowUpRight /></button></div>
}
