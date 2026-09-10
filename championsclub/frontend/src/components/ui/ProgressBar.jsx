export function ProgressBar({ value, label }) {
  return (
    <div className="progress-block">
      <div className="progress-label">
        <span>{label}</span>
        <strong>{Math.round(value)}%</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  )
}

