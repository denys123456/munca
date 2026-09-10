import { CalendarClock, Edit3, Target } from 'lucide-react'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { formatCurrency } from '../../product/formatters.js'

export function TargetsPage({ data, role }) {
  const canEditTargets = role === 'MANAGER' || role === 'ADMIN'

  return (
    <div className="page-stack">
      <section className="panel table-panel">
        <SectionHeader
          eyebrow="Planning"
          title="Active target portfolio"
          action={canEditTargets && <button className="secondary-action" type="button"><Edit3 aria-hidden="true" />Edit target</button>}
        />
        <div className="target-grid">
          {data.targets.map((target) => {
            const progress = target.actual * 100 / target.amount
            return (
              <article className="target-card" key={target.name}>
                <div className="target-card-header">
                  <Target aria-hidden="true" />
                  <StatusPill value={target.status} />
                </div>
                <h3>{target.name}</h3>
                <span>{target.owner}</span>
                <ProgressBar label="Actual versus target" value={progress} />
                <div className="target-footer">
                  <strong>{formatCurrency(target.actual)}</strong>
                  <small>{formatCurrency(target.amount)}</small>
                </div>
                <div className="timeline-note">
                  <CalendarClock aria-hidden="true" />
                  <span>Ends {target.endDate}</span>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

