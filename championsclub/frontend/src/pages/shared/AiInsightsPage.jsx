import { ArrowUpRight, Check, Plus, Sparkles } from 'lucide-react'

export function AiInsightsPage({ data, setActivePage, role }) {
  const sections = [
    { label: 'WHAT CHANGED', title: 'Renewals have found another gear.', items: data.aiInsights.whatChanged },
    { label: 'WHY IT MATTERS', title: 'Momentum has a multiplier.', items: ['Gains are concentrated in a few advisors. Sharing their approach could lift the entire team.'] },
    { label: 'RISKS', title: 'Close the gaps before they widen.', items: data.aiInsights.needsAttention },
    { label: 'OPPORTUNITIES', title: 'Your next advantage is already here.', items: ['Fleet Advantage conversations are converting well. Prioritize qualified renewal customers.', 'Silver members within reach of Gold have a timely reason to accelerate.'] }
  ]
  return <div className="page-stack intelligence-page"><section className="intelligence-masthead"><div className="intelligence-label"><Sparkles /><span>CHAMPIONS INTELLIGENCE</span><span>BRIEF / 001</span></div><h2>A clearer view.<br /><span>A stronger next move.</span></h2><p>{data.aiInsights.summary}</p><div className="intelligence-meta"><span>SEPTEMBER PERFORMANCE BRIEF</span><span>{data.insightSource === 'live' ? 'Service brief with demo context' : 'Demo intelligence'} <i /> Management perspective</span></div></section>
    <section className="intelligence-story">{sections.map((section, index) => <article className="insight-section" key={section.label}><span className="insight-number">0{index + 1}</span><div><span className="eyebrow">{section.label}</span><h3>{section.title}</h3>{section.items.map((item) => <p key={item}>{item}</p>)}</div></article>)}</section>
    <section className="next-actions"><header><span className="eyebrow">NEXT BEST ACTION</span><h2>Turn the insight into progress.</h2><p className="soft-copy">Your action plan for the rest of this cycle.</p></header><div>{data.aiInsights.nextActions.map((action) => <button className="action-plan-row" type="button" key={action} aria-pressed={data.actionPlan.includes(action)} onClick={() => data.actions.toggleAction(action)}><span>{data.actionPlan.includes(action) ? <Check /> : <Plus />}</span><strong>{action}</strong><small>{data.actionPlan.includes(action) ? 'In your plan' : 'Add to plan'}</small></button>)}</div></section>
    <button className="text-action" type="button" onClick={() => setActivePage(role === 'SALES_ADVISOR' ? 'my-performance' : 'advisors')}>Go to {role === 'SALES_ADVISOR' ? 'your performance' : 'advisor portfolio'}<ArrowUpRight /></button>
  </div>
}

