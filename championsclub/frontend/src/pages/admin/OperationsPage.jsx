import { Activity, Check, Database, Radio, RefreshCw, Server, Sparkles } from 'lucide-react'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'

export function OperationsPage({ data, audit }) {
  if (audit) return <div className="page-stack"><section className="panel"><SectionHeader eyebrow="A CLEAR RECORD" title="Program activity" />
    {data.audit.length === 0 ? <div className="empty-state"><Activity /><strong>Your activity starts here.</strong><p>Saved changes, redemptions and new sales will appear in this record.</p></div> : <div className="audit-timeline">{data.audit.map((entry) => <article key={entry.id}><span className="audit-dot"><Check /></span><div><h3>{entry.action}</h3><p>{entry.actor}</p></div><time dateTime={entry.at}>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.at))}</time></article>)}</div>}
  </section></div>
  const configured = Boolean(import.meta.env.VITE_API_BASE_URL)
  const services = [
    { icon: Server, name: 'Business services', state: data.connectionState === 'live' ? 'Connected' : 'Demo workspace', detail: data.connectionState === 'live' ? 'The dashboard request completed successfully.' : 'Local demo data is available on this device.' },
    { icon: Database, name: 'Workspace storage', state: 'Browser storage', detail: 'Your demo changes are saved locally when browser storage is available.' },
    { icon: Radio, name: 'Forecast intelligence', state: data.forecastSource === 'live' ? 'Connected' : 'Illustrative model', detail: data.forecastSource === 'live' ? 'Forecast received from the configured business service.' : 'Scenario estimates use the included demonstration model.' },
    { icon: Sparkles, name: 'Champions Intelligence', state: data.insightSource === 'live' ? 'Service response' : 'Demo brief', detail: 'The current brief is a concise guide to the displayed performance context.' }
  ]
  return <div className="page-stack"><section className="editorial-heading"><div><span className="eyebrow">CONFIDENCE STARTS WITH CLARITY</span><h2>Know what<br /><span>is connected.</span></h2></div><p>Service status reflects observed responses. Unconnected services use clearly identified demo data.</p></section>
    <section className="panel"><SectionHeader eyebrow="WORKSPACE STATUS" title="Service connections" action={configured && <button className="secondary-action" onClick={data.actions.retry}><RefreshCw />Retry connection</button>} />
      <div className="service-list">{services.map(({ icon: Icon, ...service }) => <article key={service.name}><Icon /><div><h3>{service.name}</h3><p>{service.detail}</p></div><StatusPill value={service.state} /></article>)}</div>
      {data.serviceError && <p role="status" className="form-message">{data.serviceError}</p>}
    </section>
  </div>
}
