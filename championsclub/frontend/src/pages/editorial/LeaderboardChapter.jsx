import { useState } from 'react'
import { ArrowUpRight, Crown } from 'lucide-react'
import { formatCurrency } from '../../product/formatters.js'
import { Dialog } from '../../components/ui/Dialog.jsx'
import { Scene, JourneyOpening, PrintLabel, ChapterEnd } from './EditorialParts.jsx'

export function LeaderboardChapter({ data, stops, onNavigate }) {
  const [ranking, setRanking] = useState('Sales volume')
  const [detail, setDetail] = useState(null)
  const score = (person) => ranking === 'Points' ? person.points : ranking === 'Target progress' ? person.sales / person.target : person.sales
  const ranked = [...data.advisors].sort((first, second) => score(second) - score(first))
  const displayScore = (person) => ranking === 'Points' ? `${person.points.toLocaleString('en')} pts` : ranking === 'Target progress' ? `${Math.round(person.sales / person.target * 100)}%` : formatCurrency(person.sales)
  const open = (person) => data.currentUser.role === 'MANAGER' ? onNavigate('advisor-detail', person.id) : setDetail(person)
  return <>
    <Scene stops={stops} index={0}><JourneyOpening title="The championship ranking" first="Excellence has" emphasis="a name." description="A little healthy competition. An extraordinary collective ambition." /><div className="segmented-control print-scenarios" aria-label="Rank advisors by">{['Sales volume', 'Target progress', 'Points'].map((item) => <button key={item} aria-pressed={ranking === item} onClick={() => setRanking(item)}>{item}</button>)}</div></Scene>
    <Scene stops={stops} index={1} className="champion-scene"><PrintLabel number="01">LEADING THE WAY / {ranking.toUpperCase()}</PrintLabel><span className="champion-numeral">1</span><Crown className="champion-crown" /><h2>{ranked[0]?.name.split(' ')[0]}<br /><em>{ranked[0]?.name.split(' ').slice(1).join(' ')}</em></h2><strong className="champion-score">{ranked[0] && displayScore(ranked[0])}</strong><p className="editorial-note">{ranked[0]?.title}</p><button className="print-link" onClick={() => open(ranked[0])}>View performance<ArrowUpRight /></button></Scene>
    <Scene stops={stops} index={2}><PrintLabel number="02—03">RAISING THE STANDARD</PrintLabel><h2>Greatness inspires<br /><em>greatness.</em></h2><div className="ranking-spread">{ranked.slice(1, 3).map((person, index) => <button key={person.id} onClick={() => open(person)}><span>0{index + 2}</span><h3>{person.name}</h3><strong>{displayScore(person)}</strong><ArrowUpRight /></button>)}</div></Scene>
    <Scene stops={stops} index={3}><PrintLabel number="04">EVERY CONTRIBUTION COUNTS</PrintLabel><h2>The full field.</h2><div className="segmented-control print-scenarios" aria-label="Sort full ranking">{['Sales volume', 'Target progress', 'Points'].map((item) => <button key={item} aria-pressed={ranking === item} onClick={() => setRanking(item)}>{item}</button>)}</div><div className="print-advisors" data-local-scroll>{ranked.map((person, index) => <button key={person.id} onClick={() => open(person)}><span className="advisor-print-rank">0{index + 1}</span><span className="advisor-print-name">{person.name}<small>{person.title}</small></span><span className="advisor-print-rule"><i style={{ width: `${Math.min(100, person.sales / person.target * 100)}%` }} /></span><span className="advisor-print-volume">{displayScore(person)}</span><ArrowUpRight /></button>)}</div></Scene>
    <Scene stops={stops} index={4}><ChapterEnd title="A standard worth raising." onNavigate={onNavigate} destination="rewards" nextTitle="Discover the recognition" /></Scene>
    {detail && <Dialog title={`${detail.name} / Performance`} onClose={() => setDetail(null)}><p>{detail.title}</p><dl className="printed-detail"><dt>Sales volume</dt><dd>{formatCurrency(detail.sales)}</dd><dt>Target progress</dt><dd>{Math.round(detail.sales / detail.target * 100)}%</dd><dt>Points</dt><dd>{detail.points.toLocaleString('en')}</dd></dl></Dialog>}
  </>
}
