import { ArrowUpRight, Crown, Trophy } from 'lucide-react'
import { useState } from 'react'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { formatCurrency } from '../../product/formatters.js'

export function LeaderboardPage({ data, setActivePage }) {
  const [ranking, setRanking] = useState('Sales volume')
  const value = (advisor) => ranking === 'Points' ? advisor.points : ranking === 'Target progress' ? advisor.sales / advisor.target : advisor.sales
  const ranked = [...data.advisors].sort((first, second) => value(second) - value(first))
  return <div className="page-stack leaderboard-page">
    <section className="editorial-heading"><div><span className="eyebrow">THE STANDARD IS SET BY PEOPLE</span><h2>Excellence has<br /><span>a name.</span></h2></div><p>A little healthy competition.<br />An extraordinary collective ambition.</p></section>
    <div className="segmented-control" aria-label="Rank advisors by">{['Sales volume', 'Target progress', 'Points'].map((item) => <button key={item} aria-pressed={ranking === item} onClick={() => setRanking(item)}>{item}</button>)}</div>
    <section className="podium" aria-label="Top three advisors">{ranked.slice(0, 3).map((advisor, index) => <button className={`podium-place place-${index + 1}`} key={advisor.id} onClick={() => setActivePage('advisor-detail', advisor.id)}>
      <span className="podium-number">0{index + 1}</span><span className="podium-emblem">{index === 0 ? <Crown /> : <Trophy />}</span>
      <span className="eyebrow">{index === 0 ? 'LEADING THE WAY' : 'RAISING THE STANDARD'}</span><h3>{advisor.name}</h3><span className="podium-title">{advisor.title}</span>
      <strong>{ranking === 'Points' ? `${advisor.points.toLocaleString('en')} pts` : ranking === 'Target progress' ? `${Math.round(advisor.sales / advisor.target * 100)}%` : formatCurrency(advisor.sales)}</strong>
      <span className="podium-link">View performance<ArrowUpRight /></span>
    </button>)}</section>
    <section className="panel"><div className="section-header"><div><span className="eyebrow">EVERY CONTRIBUTION COUNTS</span><h2>The full field</h2></div><span className="soft-copy">{ranked.length} advisors / September</span></div>
      <div className="leaderboard-table">{ranked.map((advisor, index) => <button className="leaderboard-row" key={advisor.id} onClick={() => setActivePage('advisor-detail', advisor.id)}>
        <span className="rank-number">{String(index + 1).padStart(2, '0')}</span><span className="avatar">{advisor.name.split(' ').map((part) => part[0]).join('')}</span><span className="ranking-person"><strong>{advisor.name}</strong><small>{advisor.title}</small></span>
        <strong>{formatCurrency(advisor.sales)}</strong><ProgressBar label="Target progress" value={advisor.sales / advisor.target * 100} /><StatusPill value={advisor.level} /><ArrowUpRight />
      </button>)}</div>
    </section>
  </div>
}
