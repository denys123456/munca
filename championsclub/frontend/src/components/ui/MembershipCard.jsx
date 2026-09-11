import { Crown } from 'lucide-react'
import { Brand } from '../shell/Brand.jsx'
import { FocusCard } from './FocusCard.jsx'
import { ProgressBar } from './ProgressBar.jsx'
import { availableBalance, memberLevel } from '../../product/selectors.js'

export function MembershipCard({ advisor, settings }) {
  const level = memberLevel(advisor.points, settings)
  const nextThreshold = level === 'BRONZE' ? settings.silver : settings.gold
  return <FocusCard className={`membership-card ${level.toLowerCase()}`} label={`${advisor.name} membership`}>
    <div className="membership-top"><Brand compact /><Crown /></div>
    <span className="membership-level">{level}<small>MEMBER</small></span>
    <div className="membership-balance"><strong>{availableBalance(advisor).toLocaleString('en')}</strong><span>AVAILABLE POINTS</span></div>
    <div className="membership-owner"><span>{advisor.name}</span><span>CC / {String(advisor.id).padStart(4, '0')}</span></div>
    <ProgressBar label={level === 'GOLD' ? 'The highest standard. Yours.' : `${Math.max(0, nextThreshold - advisor.points).toLocaleString('en')} lifetime points to ${level === 'BRONZE' ? 'Silver' : 'Gold'}`} value={advisor.points / nextThreshold * 100} />
  </FocusCard>
}
