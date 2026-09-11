import { ArrowUpRight, Sparkles } from 'lucide-react'

export function IntelligenceBrief({ data, onOpen }) {
  return <aside className="intelligence-brief">
    <div className="intelligence-label"><Sparkles /><span>CHAMPIONS INTELLIGENCE</span><span className="intelligence-version">01</span></div>
    <h2>Momentum is yours.<br /><span>Make it count.</span></h2>
    <p className="intelligence-lead">{data.aiInsights.summary}</p>
    <div className="brief-item"><span>01 <i /> WHAT CHANGED</span><p>{data.aiInsights.whatChanged[0]}</p></div>
    <div className="brief-item"><span>02 <i /> WATCH CLOSELY</span><p>{data.aiInsights.needsAttention[0]}</p></div>
    <div className="brief-item"><span>03 <i /> YOUR NEXT MOVE</span><p>{data.aiInsights.nextActions[0] ?? 'Review your latest target progress.'}</p></div>
    <button className="intelligence-action" type="button" onClick={onOpen}><span>Open your intelligence brief</span><ArrowUpRight /></button>
    <div className="intelligence-source">{data.insightSource === 'live' ? 'Service brief' : 'Demo intelligence'} <span>Human judgment. Amplified.</span></div>
  </aside>
}
