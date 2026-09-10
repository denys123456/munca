import { Gift, SlidersHorizontal } from 'lucide-react'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'

export function RewardsPage({ data }) {
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
          <SectionHeader eyebrow="Catalog" title="Premium reward catalog" action={<button className="secondary-action" type="button"><SlidersHorizontal aria-hidden="true" />Filters</button>} />
          <div className="reward-catalog">
            {data.rewards.map((reward) => (
              <article className="reward-card" key={reward.id}>
                <Gift aria-hidden="true" />
                <div>
                  <strong>{reward.name}</strong>
                  <span>{reward.category}</span>
                </div>
                <ProgressBar label={`${reward.points} points`} value={reward.progress} />
                <StatusPill value={reward.status} />
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

