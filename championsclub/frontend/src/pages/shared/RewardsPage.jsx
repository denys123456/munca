import { ArrowUpRight, Check, Gem, Gift, GraduationCap, Laptop, Leaf, LockKeyhole, Ticket } from 'lucide-react'
import { useState } from 'react'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { MembershipCard } from '../../components/ui/MembershipCard.jsx'
import { RewardConfirmation } from './RewardConfirmation.jsx'
import { availableBalance } from '../../product/selectors.js'

const categoryIcons = { Mobility: Ticket, Experience: Gem, Lifestyle: Laptop, Travel: Leaf, Growth: GraduationCap }

export function RewardsPage({ data }) {
  const [category, setCategory] = useState('All')
  const [selectedAdvisorId, setSelectedAdvisorId] = useState(data.currentUser.advisorId ?? data.advisors[0]?.id)
  const [selectedReward, setSelectedReward] = useState(null)
  const advisor = data.advisors.find((item) => item.id === selectedAdvisorId) ?? data.advisors[0]
  const balance = availableBalance(advisor)
  const categories = ['All', ...new Set(data.rewards.map((reward) => reward.category))]
  const rewards = data.rewards.filter((reward) => reward.status !== 'Inactive' && (category === 'All' || category === reward.category))
  const redemptions = data.redemptions.filter((item) => item.advisorId === advisor.id || item.advisor === advisor.name)
  const canRedeem = data.currentUser.role === 'SALES_ADVISOR' || data.connectionState !== 'live'

  return <div className="page-stack rewards-page">
    <section className="reward-hero">
      <div className="reward-hero-copy"><span className="eyebrow">THE CHAMPIONSCLUB COLLECTION</span><h2>You've earned<br /><span>the exceptional.</span></h2><p>Meaningful rewards. Remarkable experiences.<br />A little recognition for a lot of ambition.</p>
        {data.currentUser.role === 'MANAGER' && <label className="reward-advisor"><span>Viewing rewards for</span><select aria-label="Reward advisor" value={advisor.id} onChange={(event) => setSelectedAdvisorId(Number(event.target.value))}>{data.advisors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      </div>
      <MembershipCard advisor={advisor} settings={data.settings} />
    </section>
    <section className="collection-section">
      <SectionHeader eyebrow="CURATED FOR YOUR NEXT CHAPTER" title="Choose what moves you." />
      <div className="segmented-control reward-filters" aria-label="Reward categories">{categories.map((item) => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="reward-catalog">{rewards.map((reward, index) => {
        const Icon = categoryIcons[reward.category] ?? Gift
        const submitted = redemptions.some((item) => item.rewardId === reward.id && item.status === 'Submitted')
        const eligible = balance >= reward.points
        return <article className={`reward-card reward-tone-${index % 4}`} key={reward.id}>
          <div className="reward-art"><span className="reward-edition">CC / {String(index + 1).padStart(2, '0')}</span><Icon /><span className="reward-category">{reward.category}</span></div>
          <div className="reward-content"><h3>{reward.name}</h3><div className="reward-cost"><strong>{reward.points.toLocaleString('en')}</strong><span>points</span></div>
            <ProgressBar label={eligible ? 'Within your reach' : `${(reward.points - balance).toLocaleString('en')} points to go`} value={balance / reward.points * 100} />
            <button className={eligible ? 'primary-action' : 'secondary-action'} disabled={!eligible || submitted || !canRedeem} onClick={() => setSelectedReward(reward)}>
              {submitted ? <><Check />Redemption submitted</> : !canRedeem ? 'Advisor redemption only' : eligible ? <>Redeem reward<ArrowUpRight /></> : <><LockKeyhole />Keep building your balance</>}
            </button>
          </div>
        </article>
      })}</div>
      {rewards.length === 0 && <div className="empty-state"><Gift /><strong>A new collection is on the way.</strong><p>Explore another category to see available rewards.</p></div>}
    </section>
    <section className="redemption-section"><SectionHeader eyebrow="YOUR RECOGNITION, IN MOTION" title="Redemption history" />
      {redemptions.length ? <div className="redemption-list">{redemptions.map((item) => <div key={item.id}><span className="redemption-icon"><Gift /></span><div><strong>{item.reward}</strong><small>{item.date}</small></div><span>{item.points.toLocaleString('en')} pts</span><span className="status-pill">{item.status}</span></div>)}</div> : <div className="empty-state"><Gift /><strong>Your first reward is waiting.</strong><p>Redemptions will appear here with their latest status.</p></div>}
    </section>
    {selectedReward && <RewardConfirmation reward={selectedReward} advisor={advisor} data={data} onClose={() => setSelectedReward(null)} />}
  </div>
}
