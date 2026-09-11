export function ProgressBar({ value, label }) {
  const progress = Number.isFinite(value) ? Math.max(0, value) : 0
  return (
    <div className="progress-block">
      <div className="progress-label">
        <span>{label}</span>
        <strong>{Math.round(progress)}%</strong>
      </div>
      <div className="progress-track" role="progressbar" aria-label={label} aria-valuenow={Math.min(100, progress)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${Math.min(100, progress)}%` }} />
      </div>
    </div>
  )
}
