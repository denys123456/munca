import { AlertTriangle, CheckCircle2, SlidersHorizontal } from 'lucide-react'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'

export function AlertsPage({ data }) {
  return (
    <div className="page-stack">
      <section className="panel table-panel">
        <SectionHeader eyebrow="Attention" title="Grouped alerts and recommended actions" action={<button className="secondary-action" type="button"><SlidersHorizontal aria-hidden="true" />Severity</button>} />
        <div className="alert-worklist">
          {data.alerts.map((alert) => (
            <article className="alert-card" key={alert.title}>
              <AlertTriangle aria-hidden="true" />
              <div>
                <span>{alert.group}</span>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
              </div>
              <StatusPill value={alert.severity} />
              <button className="icon-button" type="button" aria-label="Mark alert as reviewed">
                <CheckCircle2 aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

