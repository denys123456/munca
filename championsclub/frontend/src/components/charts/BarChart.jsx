export function BarChart({ items }) {
  const maximumValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="bar-list" aria-label="Bar chart">
      {items.map((item) => (
        <div className="bar-list-row" key={item.label}>
          <span>{item.label}</span>
          <div>
            <i style={{ width: `${(item.value / maximumValue) * 100}%` }} />
          </div>
          <strong>{item.value}%</strong>
        </div>
      ))}
    </div>
  )
}

