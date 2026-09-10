import { Gift, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'

export function RewardsPage({ data }) {
  const [category, setCategory] = useState('All')
  const [message, setMessage] = useState('')
  const categories = useMemo(() => ['All', ...new Set(data.rewards.map((reward) => reward.category))], [data.rewards])
  const rewards = category === 'All' ? data.rewards : data.rewards.filter((reward) => reward.category === category)

  async function redeemReward(rewardId) {
    setMessage('')
    try {
      await data.actions.redeemReward(rewardId)
      setMessage('Reward redemption submitted.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="page-stack">
      <section className="reward-hero">
        <div>
          <span className="eyebrow">Rewards</span>
          <h2>Reward catalogue and redemption status</h2>
          <p>Available balance, next reward path and recent redemptions are connected to advisor performance.</p>
        </div>
        <strong>1,330 pts</strong>
      </section>
      <section className="content-grid">
        <article className="panel large-panel">
          <SectionHeader eyebrow="Catalog" title="Premium reward catalog" action={<RewardFilters category={category} categories={categories} onChange={setCategory} />} />
          {message && <p className="form-message">{message}</p>}
          <div className="reward-catalog">
            {rewards.map((reward) => (
              <article className="reward-card" key={reward.id}>
                <Gift aria-hidden="true" />
                <div>
                  <strong>{reward.name}</strong>
                  <span>{reward.category}</span>
                </div>
                <ProgressBar label={`${reward.points} points`} value={reward.progress} />
                <StatusPill value={reward.status} />
                <button className="secondary-action" type="button" onClick={() => redeemReward(reward.id)}>
                  Redeem
                </button>
              </article>
            ))}
          </div>
        </article>
        <article className="panel">
          <SectionHeader eyebrow="History" title="Recent redemptions" />
          <div className="data-table compact">
            {data.redemptions.map((redemption) => (
              <div className="table-row" key={redemption.reward}>
                <span>{redemption.reward}</span>
                <strong>{redemption.points} pts</strong>
                <small>{redemption.status}</small>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}

function RewardFilters({ category, categories, onChange }) {
  return (
    <label className="filter-box">
      <SlidersHorizontal aria-hidden="true" />
      <select aria-label="Filter rewards" value={category} onChange={(event) => onChange(event.target.value)}>
        {categories.map((item) => <option key={item}>{item}</option>)}
      </select>
    </label>
  )
}
