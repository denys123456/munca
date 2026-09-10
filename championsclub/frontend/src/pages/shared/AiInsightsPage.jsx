import { BrainCircuit, MoveRight } from 'lucide-react'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'

export function AiInsightsPage({ data }) {
  return (
    <div className="page-stack">
      <section className="insight-hero">
        <BrainCircuit aria-hidden="true" />
        <div>
          <span className="eyebrow">Champions Intelligence</span>
          <h2>{data.aiInsights.summary}</h2>
        </div>
      </section>
      <section className="intelligence-story">
        <InsightSection title="What changed" items={data.aiInsights.whatChanged} />
        <InsightSection title="Why it matters" items={['Performance gains are concentrated in a few advisors, so coaching leverage is clear.']} />
        <InsightSection title="Risk" items={data.aiInsights.needsAttention} />
        <InsightSection title="Next action" items={data.aiInsights.nextActions} action />
      </section>
    </div>
  )
}

function InsightSection({ title, items, action = false }) {
  return (
    <article className={action ? 'insight-section is-action' : 'insight-section'}>
      <SectionHeader eyebrow="AI" title={title} />
      <div className="recommendation-list">
        {items.map((item) => (
          <div key={item}>
            {action && <MoveRight aria-hidden="true" />}
            <span>{item}</span>
          </div>
        ))}
      </div>
    </article>
  )
}
