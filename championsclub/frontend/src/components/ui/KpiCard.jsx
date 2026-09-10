export function KpiCard({ icon: Icon, label, value, detail, tone = 'neutral' }) {
  return (
    <article className={`kpi-card ${tone}`}>
      <div className="kpi-topline">
        <span>{label}</span>
        <Icon aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

