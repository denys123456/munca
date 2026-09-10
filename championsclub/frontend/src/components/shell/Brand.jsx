import { Command } from 'lucide-react'

export function Brand({ compact = false }) {
  return <div className={`brand-lockup ${compact ? 'is-compact' : ''}`}><span className="brand-symbol"><Command aria-hidden="true" /></span><span className="brand-copy"><strong>Champions<span>Club</span></strong><small>THE PERFORMANCE STANDARD</small></span></div>
}
