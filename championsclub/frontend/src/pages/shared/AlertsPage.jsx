import { AlertTriangle, CheckCircle2, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'

export function AlertsPage({ data }) {
  const [severity, setSeverity] = useState('All')
  const severities = useMemo(() => ['All', ...new Set(data.alerts.map((alert) => alert.severity))], [data.alerts])
  const alerts = severity === 'All' ? data.alerts : data.alerts.filter((alert) => alert.severity === severity)

  return (
    <div className="page-stack">
      <section className="panel table-panel">
        <SectionHeader eyebrow="Attention" title="Grouped alerts and recommended actions" action={<AlertFilters severity={severity} severities={severities} onChange={setSeverity} />} />
        <div className="alert-worklist">
          {alerts.map((alert) => (
            <article className={`alert-card ${alert.isUnread ? '' : 'is-reviewed'}`} key={alert.title}>
              <AlertTriangle aria-hidden="true" />
              <div>
                <span>{alert.group}</span>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
              </div>
              <StatusPill value={alert.severity} />
              <button className="icon-button" type="button" disabled={!alert.isUnread} aria-label={alert.isUnread ? `Mark ${alert.title} as reviewed` : `${alert.title} reviewed`} onClick={() => data.actions.markAlertReviewed(alert.title)}>
                <CheckCircle2 aria-hidden="true" />
              </button>
            </article>
          ))}
          {alerts.length === 0 && <p className="soft-copy">No alerts match this severity.</p>}
        </div>
      </section>
    </div>
  )
}

function AlertFilters({ severity, severities, onChange }) {
  return (
    <label className="filter-box">
      <SlidersHorizontal aria-hidden="true" />
      <select aria-label="Filter alert severity" value={severity} onChange={(event) => onChange(event.target.value)}>
        {severities.map((item) => <option key={item}>{item}</option>)}
      </select>
    </label>
  )
}
