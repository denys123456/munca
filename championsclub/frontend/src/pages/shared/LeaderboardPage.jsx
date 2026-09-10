import { Medal, Trophy } from 'lucide-react'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { formatCurrency } from '../../product/formatters.js'

export function LeaderboardPage({ data }) {
  const rankedAdvisors = [...data.advisors].sort((firstAdvisor, secondAdvisor) => secondAdvisor.sales - firstAdvisor.sales)

  return (
    <div className="page-stack">
      <section className="leaderboard-hero">
        <Trophy aria-hidden="true" />
        <div>
          <span className="eyebrow">Professional gamification</span>
          <h2>Leaderboard focused on quality sales momentum</h2>
        </div>
      </section>
      <section className="panel table-panel">
        <SectionHeader eyebrow="Rankings" title="Advisor leaderboard" />
        <div className="leaderboard-table">
          {rankedAdvisors.map((advisor, index) => (
            <article className="leaderboard-card" key={advisor.id}>
              <div className="rank-medal">
                <Medal aria-hidden="true" />
                <strong>{index + 1}</strong>
              </div>
              <div>
                <strong>{advisor.name}</strong>
                <span>{advisor.title}</span>
              </div>
              <span>{formatCurrency(advisor.sales)}</span>
              <ProgressBar label="Target progress" value={advisor.sales * 100 / advisor.target} />
              <StatusPill value={advisor.level} />
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

