export function Brand({ compact = false }) {
  return <div className={`brand-lockup ${compact ? 'is-compact' : ''}`}>
    <span className="brand-symbol"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M32 10 20 3 8 10v20l12 7 12-7" stroke="currentColor" strokeWidth="1.5" /><path d="m26 14-6-3-6 3v12l6 3 6-3M26 20H14" stroke="currentColor" strokeWidth="1.5" /><path d="M32 17v6" stroke="currentColor" strokeWidth="3" /></svg></span>
    <span className="brand-copy"><strong>Champions<span>Club</span></strong><small>THE PERFORMANCE STANDARD</small></span>
  </div>
}
