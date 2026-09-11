import { CalendarClock, Edit3, Plus, Target } from 'lucide-react'
import { useState } from 'react'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { TargetEditor } from './TargetEditor.jsx'
import { visibleTargets } from '../../product/selectors.js'
import { formatCurrency } from '../../product/formatters.js'

export function TargetsPage({ data, role }) {
  const canEdit = role !== 'SALES_ADVISOR' && data.connectionState !== 'live'
  const [editing, setEditing] = useState(null)
  const targets = visibleTargets(data)
  return <div className="page-stack targets-page">
    <section className="editorial-heading"><div><span className="eyebrow">A CLEAR DESTINATION</span><h2>Ambition, with<br /><span>a plan behind it.</span></h2></div><p>Keep the finish line in sight. Align individual ambition with the bigger picture.</p></section>
    <section className="panel">
      <SectionHeader eyebrow="Your commitments" title="Target portfolio" action={canEdit && <button className="primary-action" onClick={() => setEditing({})}><Plus />Create target</button>} />
      <div className="target-grid">{targets.map((target) => <article className="target-card" key={target.name}>
        <div className="target-card-header"><Target /><StatusPill value={target.status} /></div>
        <h3>{target.name}</h3><span>{target.owner === 'Advisor' ? data.advisors.find((advisor) => advisor.id === target.advisorId)?.name ?? 'Advisor' : target.owner}</span>
        <ProgressBar label="Actual versus target" value={target.actual * 100 / target.amount} />
        <div className="target-footer"><strong>{formatCurrency(target.actual)}</strong><small>of {formatCurrency(target.amount)}</small></div>
        <div className="timeline-note"><CalendarClock /><span>Ends {target.endDate}</span></div>
        {canEdit && <button className="text-action" onClick={() => setEditing(target)}><Edit3 />Edit target</button>}
      </article>)}</div>
      {targets.length === 0 && <div className="empty-state"><Target /><strong>Your next ambition starts here.</strong><p>Create a target to track progress.</p></div>}
    </section>
    {editing && <TargetEditor target={editing} data={data} onClose={() => setEditing(null)} />}
  </div>
}
