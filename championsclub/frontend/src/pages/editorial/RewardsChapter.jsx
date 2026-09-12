import { useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Gem, Gift, GraduationCap, Laptop, Leaf, Ticket } from 'lucide-react'
import { RewardConfirmation } from '../shared/RewardConfirmation.jsx'
import { availableBalance, memberLevel } from '../../product/selectors.js'
import { Scene, JourneyOpening, PrintLabel, ChapterEnd } from './EditorialParts.jsx'

const icons = { Mobility: Ticket, Experience: Gem, Lifestyle: Laptop, Travel: Leaf, Growth: GraduationCap }

export function RewardsChapter({ data, stops, onNavigate }) {
  const [category, setCategory] = useState('All')
  const [selectedAdvisorId, setSelectedAdvisorId] = useState(data.currentUser.advisorId ?? data.advisors[0]?.id)
  const [selection, setSelection] = useState(0)
  const [redeeming, setRedeeming] = useState(null)
  const advisor = data.advisors.find((item) => item.id === selectedAdvisorId) ?? data.advisors[0]
  const balance = availableBalance(advisor)
  const rewards = data.rewards.filter((reward) => reward.status !== 'Inactive' && (category === 'All' || category === reward.category))
  const reward = rewards[Math.min(selection, rewards.length - 1)]
  const history = data.redemptions.filter((item) => item.advisorId === advisor.id || item.advisor === advisor.name)
  const submitted = reward && history.some((item) => item.rewardId === reward.id && item.status === 'Submitted')
  const canRedeem = data.currentUser.role === 'SALES_ADVISOR' || data.connectionState !== 'live'
  const Icon = icons[reward?.category] ?? Gift
  return <>
    <Scene stops={stops} index={0}><JourneyOpening title="The ChampionsClub collection" first="You've earned" emphasis="the exceptional." description="Meaningful rewards. Remarkable experiences. A little recognition for a lot of ambition." /><div className="collection-seal"><Gem /><span>SELECTED WITH PURPOSE</span></div></Scene>
    <Scene stops={stops} index={1}><PrintLabel number="01">YOUR RECOGNITION</PrintLabel><h2>{advisor.name}.<br /><em>{memberLevel(advisor.points, data.settings).toLowerCase()} member.</em></h2><div className="print-amount">{balance.toLocaleString('en')}</div><div className="volume-baseline"><span>AVAILABLE POINTS</span><span>{advisor.points.toLocaleString('en')} LIFETIME POINTS</span></div>{data.currentUser.role === 'MANAGER' && <label className="printed-select">Viewing rewards for<select aria-label="Reward advisor" value={advisor.id} onChange={(event) => setSelectedAdvisorId(Number(event.target.value))}>{data.advisors.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>}</Scene>
    <Scene stops={stops} index={2} className="catalogue-scene"><PrintLabel number="02">CHOOSE WHAT MOVES YOU</PrintLabel><div className="segmented-control reward-filters" aria-label="Reward categories">{['All', ...new Set(data.rewards.map((item) => item.category))].map((item) => <button key={item} aria-pressed={category === item} onClick={() => { setCategory(item); setSelection(0) }}>{item}</button>)}</div>{reward ? <div className="catalogue-presentation"><div className="catalogue-engraving"><Icon /><span>CC / {String(selection + 1).padStart(2, '0')}</span></div><div><span className="print-overline">{reward.category}</span><h2>{reward.name}</h2><strong className="catalogue-price">{reward.points.toLocaleString('en')}<small> points</small></strong><p className="editorial-note">{balance >= reward.points ? 'Within your reach.' : `${(reward.points - balance).toLocaleString('en')} points to go.`}</p><button className="print-link" disabled={!canRedeem || balance < reward.points || submitted} onClick={() => setRedeeming(reward)}>{submitted ? <><Check />Redemption submitted</> : !canRedeem ? 'Advisor redemption only' : balance >= reward.points ? <>Redeem reward<ArrowUpRight /></> : 'Keep building your balance'}</button></div></div> : <div className="empty-state">A new collection is on the way. Explore another category.</div>}<div className="catalogue-pagination"><button aria-label="Previous reward" disabled={selection === 0} onClick={() => setSelection((value) => value - 1)}><ArrowLeft /></button><span>{rewards.length ? selection + 1 : 0} / {rewards.length}</span><button aria-label="Next reward" disabled={selection >= rewards.length - 1} onClick={() => setSelection((value) => value + 1)}><ArrowRight /></button></div></Scene>
    <Scene stops={stops} index={3}><PrintLabel number="03">YOUR RECOGNITION, IN MOTION</PrintLabel><h2>Already earned.<br /><em>Well deserved.</em></h2><div className="printed-history" data-local-scroll>{history.length ? history.map((item, index) => <article key={item.id ?? index}><span>{item.date}</span><h3>{item.reward}</h3><strong>{item.points.toLocaleString('en')} pts</strong><small>{item.status}</small></article>) : <p className="chapter-deck">Your first reward is waiting. Redemptions will appear here with their latest status.</p>}</div></Scene>
    <Scene stops={stops} index={4}><ChapterEnd title="Recognition is a beginning." onNavigate={onNavigate} destination={data.currentUser.role === 'SALES_ADVISOR' ? 'my-performance' : 'team-performance'} nextTitle="Build your next milestone" /></Scene>
    {redeeming && <RewardConfirmation reward={redeeming} advisor={advisor} data={data} onClose={() => setRedeeming(null)} />}
  </>
}
