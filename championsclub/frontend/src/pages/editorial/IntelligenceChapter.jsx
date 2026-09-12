import { Check, Plus } from 'lucide-react'
import { Scene, JourneyOpening, PrintLabel, ChapterEnd } from './EditorialParts.jsx'

export function IntelligenceChapter({ data, stops, onNavigate }) {
  const sections = [
    { title: 'What changed.', subtitle: 'Read the signals.', items: data.aiInsights.whatChanged },
    { title: 'Why it matters.', subtitle: 'See the consequence.', items: [data.aiInsights.summary] },
    { title: 'The risk.', subtitle: 'Give it your attention.', items: data.aiInsights.needsAttention },
    { title: 'The opportunity.', subtitle: 'Make room for progress.', items: data.aiInsights.nextActions.slice(1) }
  ]
  return <>
    <Scene stops={stops} index={0} className="intelligence-opening"><JourneyOpening title="Champions Intelligence" first="A clearer view." emphasis="A stronger next move." description={data.aiInsights.summary} /><span className="source-note">{data.insightSource === 'live' ? 'SERVICE BRIEF WITH DEMO CONTEXT' : 'DEMONSTRATION INTELLIGENCE'} / PERFORMANCE ANNOTATIONS</span></Scene>
    {sections.map((section, index) => <Scene stops={stops} index={index + 1} key={section.title} className="intelligence-annotation"><PrintLabel number={`0${index + 1}`}>{stops[index + 1].label.toUpperCase()}</PrintLabel><h2>{section.title}<br /><em>{section.subtitle}</em></h2><ol className="printed-enumeration">{section.items.map((item) => <li key={item}>{item}</li>)}</ol><span className="annotation-number">0{index + 1}</span></Scene>)}
    <Scene stops={stops} index={5}><PrintLabel number="05">RECOMMENDED ACTION</PrintLabel><h2>Insight becomes value<br /><em>when you act on it.</em></h2><div className="printed-actions" data-local-scroll>{data.aiInsights.nextActions.map((action) => <button key={action} aria-pressed={data.actionPlan.includes(action)} onClick={() => data.actions.toggleAction(action)}><span>{data.actionPlan.includes(action) ? <Check /> : <Plus />}</span><strong>{action}</strong><small>{data.actionPlan.includes(action) ? 'In your plan' : 'Add to plan'}</small></button>)}</div></Scene>
    <Scene stops={stops} index={6}><ChapterEnd title="A more intentional tomorrow." onNavigate={onNavigate} destination={data.currentUser.role === 'SALES_ADVISOR' ? 'my-performance' : 'advisors'} nextTitle="Put your plan in motion" /></Scene>
  </>
}
