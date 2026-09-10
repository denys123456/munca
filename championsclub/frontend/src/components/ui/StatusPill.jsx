export function StatusPill({ value }) {
  return <span className={`status-pill ${statusClass(value)}`}>{value}</span>
}

function statusClass(value) {
  const normalizedValue = String(value).toLowerCase()
  if (normalizedValue.includes('gold')) {
    return 'gold'
  }
  if (normalizedValue.includes('silver')) {
    return 'silver'
  }
  if (normalizedValue.includes('bronze')) {
    return 'bronze'
  }
  if (normalizedValue.includes('risk') || normalizedValue.includes('warning') || normalizedValue.includes('coaching') || normalizedValue.includes('close')) {
    return 'warning'
  }
  if (normalizedValue.includes('locked') || normalizedValue.includes('high')) {
    return 'critical'
  }
  if (normalizedValue.includes('completed') || normalizedValue.includes('available') || normalizedValue.includes('ready') || normalizedValue.includes('active') || normalizedValue.includes('live')) {
    return 'success'
  }
  return 'neutral'
}
