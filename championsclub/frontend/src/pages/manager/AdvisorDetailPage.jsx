import { ArrowLeft, Award, BadgeEuro, Bell, History, Target, TrendingUp } from 'lucide-react'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { availableBalance, advisorSales } from '../../product/selectors.js'
import { formatCurrency } from '../../product/formatters.js'

export function AdvisorDetailPage({ data, selectedAdvisorId, setActivePage }) {
  const advisor = data.advisors.find((item) => item.id === selectedAdvisorId)
  if (!advisor) return <div className="empty-state"><strong>This advisor could not be found.</strong><button className="secondary-action" onClick={() => setActivePage('advisors')}>Back to advisors</button></div>
  const alerts = data.alerts.filter((alert) => alert.title.includes(advisor.name) && alert.isUnread)
  const sales = advisorSales(data, advisor)
  const nextReward = [...data.rewards].filter((reward) => reward.status !== 'Inactive').sort((first, second) => first.points - second.points).find((reward) => reward.points > availableBalance(advisor))
  return <div className="page-stack">
    <button className="text-action back-action" onClick={() => setActivePage('advisors')}><ArrowLeft />Advisor portfolio</button>
    <section className="profile-hero"><span className="profile-monogram">{advisor.name.split(' ').map((part) => part[0]).join('')}</span><div><span className="eyebrow">THE PERSON BEHIND THE PERFORMANCE</span><h2>{advisor.name}</h2><p>{advisor.title} at {data.dealership.name}</p></div><StatusPill value={advisor.status} /></section>
    <section className="kpi-grid"><KpiCard icon={BadgeEuro} label="Monthly sales" value={formatCurrency(advisor.sales)} detail="Current cycle" /><KpiCard icon={Target} label="Target progress" value={`${Math.round(advisor.sales * 100 / advisor.target)}%`} detail={formatCurrency(advisor.target)} /><KpiCard icon={TrendingUp} label="Forecast probability" value={`${advisor.forecastProbability}%`} detail="Illustrative target probability" /><KpiCard icon={Award} label="Membership" value={advisor.level} detail={`${availableBalance(advisor).toLocaleString('en')} points available`} tone="warning" /></section>
    <section className="content-grid"><article className="panel"><SectionHeader eyebrow="ACTIONS THAT COUNT" title="Recent sales" /><div className="data-table">{sales.map((sale) => <div className="table-row" key={sale.id}><History /><span>{sale.product}</span><strong>{formatCurrency(sale.amount)}</strong><small>{sale.date}</small></div>)}</div>{sales.length === 0 && <p className="soft-copy">No recorded sales yet.</p>}</article>
      <article className="panel"><SectionHeader eyebrow="WHAT DESERVES ATTENTION" title="Advisor signals" /><div className="compact-list vertical">{alerts.map((alert) => <div key={alert.title}><Bell /><span>{alert.message}</span></div>)}</div>{alerts.length === 0 && <p className="soft-copy">No active personal alerts. Keep the momentum going.</p>}</article>
      <article className="panel"><SectionHeader eyebrow="RECOGNITION WITHIN REACH" title={nextReward?.name ?? 'The collection is within reach.'} />{nextReward ? <ProgressBar label={`${(nextReward.points - availableBalance(advisor)).toLocaleString('en')} points to the next reward`} value={availableBalance(advisor) / nextReward.points * 100} /> : <p className="soft-copy">The current balance can unlock every reward in the collection.</p>}</article>
      <article className="panel"><SectionHeader eyebrow="NEXT BEST ACTION" title={advisor.sales / advisor.target < .6 ? 'Build a more consistent rhythm.' : 'Turn momentum into influence.'} /><p className="soft-copy">{advisor.sales / advisor.target < .6 ? 'Review open finance conversations and agree on a focused follow-up plan for this week.' : 'Share one successful customer conversation with the team and prioritize the strongest qualified opportunities.'}</p></article>
    </section>
  </div>
}
