import { FocusCard } from './FocusCard.jsx'

export function KpiCard({ icon: Icon, label, value, detail, tone = 'neutral' }) {
  return (
    <FocusCard className={`kpi-card ${tone}`} label={label}>
      <div className="kpi-topline">
        <span>{label}</span>
        <Icon aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </FocusCard>
  )
}
