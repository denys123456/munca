import { ArrowDownRight, ArrowUpRight, MoveUpRight, Sparkles } from 'lucide-react'
import { ForecastChart } from '../../components/charts/ForecastChart.jsx'
import { formatCurrency } from '../../product/formatters.js'

function Engraving({ progress = 74, hero = false }) {
  return <svg className={`editorial-engraving ${hero ? 'is-hero' : ''}`} viewBox="0 0 440 440" aria-hidden="true">
    <circle cx="220" cy="220" r="193" fill="none" stroke="currentColor" strokeWidth=".5" opacity=".28" />
    <circle cx="220" cy="220" r="172" fill="none" stroke="currentColor" strokeWidth=".5" opacity=".25" />
    {Array.from({ length: 96 }, (_, index) => <line key={index} x1="220" y1={index % 8 === 0 ? '31' : '43'} x2="220" y2={hero ? '91' : '62'} transform={`rotate(${index * 3.75} 220 220)`} stroke="currentColor" strokeWidth={index % 8 === 0 ? '1' : '.55'} opacity={index < progress * .96 ? '.8' : '.17'} />)}
    <circle cx="220" cy="220" r="148" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray={hero ? '2 7' : '0'} opacity=".32" />
    {hero && <><path d="M92 310C120 202 261 228 345 116" fill="none" stroke="currentColor" strokeWidth="1.3" /><circle cx="255" cy="215" r="4" fill="currentColor" /><path d="M78 330 356 110M220 107V333M106 220H334" fill="none" stroke="currentColor" strokeWidth=".5" opacity=".22" /><text x="220" y="195" textAnchor="middle" className="engraving-caption">THE COLLECTIVE</text><text x="220" y="277" textAnchor="middle" className="engraving-number">02</text></>}
  </svg>
}

function Label({ number, children }) {
  return <div className="print-label"><span>{number}</span><i aria-hidden="true" /><span>{children}</span></div>
}

export function TeamPerformanceChapter({ data, onNavigate }) {
  const sales = data.dealership.monthlySales
  const target = data.dealership.monthlyTarget
  const predicted = data.forecast.predictedSales
  const progress = Math.round(sales / target * 100)
  const growth = ((sales / data.dealership.previousCycleSales - 1) * 100).toFixed(1)
  const advisors = [...data.advisors].sort((a, b) => b.sales - a.sales)
  const atRisk = advisors.filter((advisor) => advisor.sales / advisor.target < .6).length
  const largestContribution = Math.max(...data.charts.productMix.map((item) => item.value), 1)

  return <div className="team-composition">
    <svg className="composition-thread" viewBox="0 0 3240 4600" preserveAspectRatio="none" aria-hidden="true"><path d="M200 790C830 910 1630 600 2060 820S2990 1100 2630 1470S1820 1720 1160 1870S90 2060 320 2530S1450 3180 2240 2950S3150 3250 2690 3860S1180 4180 290 4300" fill="none" stroke="currentColor" strokeWidth="1" /><path d="M0 1120H3240M0 2300H3240M0 3480H3240" fill="none" stroke="currentColor" strokeWidth=".3" strokeDasharray="2 12" /></svg>

    <section className="editorial-scene team-opening" data-scene="0" aria-label="Team performance introduction">
      <Label number="CHAPTER 02">THE PERFORMANCE ISSUE / SEPTEMBER 2026</Label>
      <h1 aria-label="Team Performance">A collective<br /><em>force.</em></h1>
      <div className="opening-aside"><Engraving hero /><span className="engraving-footnote">INDIVIDUAL TALENT. COLLECTIVE MOMENTUM.</span></div>
      <div className="opening-copy"><span className="print-overline">TEAM PERFORMANCE</span><p>Behind every number, a conversation.<br />Behind every milestone, a team.</p><div className="printed-scroll">Scroll to explore the story <ArrowDownRight /></div></div>
      <span className="edition-mark">{data.currentUser.dealership.toUpperCase()}<br />A STUDY IN COLLECTIVE MOMENTUM</span>
    </section>

    <section className="editorial-scene team-volume" data-scene="1" aria-label="Sales booked">
      <Label number="01">THE WORK, MADE VISIBLE</Label>
      <h2>Small conversations.<br /><em>Remarkable momentum.</em></h2>
      <div className="print-amount"><span>€</span>{sales.toLocaleString('en')}</div>
      <div className="volume-baseline"><span>SALES BOOKED / CURRENT CYCLE</span><span className="print-growth"><MoveUpRight /> {growth.startsWith('-') ? '' : '+'}{growth}% <small>versus last cycle</small></span></div>
      <p className="editorial-note">A measure of trust earned.<br />And a foundation for what comes next.</p>
    </section>

    <section className="editorial-scene team-ambition" data-scene="2" aria-label="Target achievement">
      <div className="ambition-copy"><Label number="02">THE DISTANCE TO POSSIBILITY</Label><h2>Ambition,<br /><em>in reach.</em></h2><p>{formatCurrency(Math.max(0, target - sales))} to the monthly target.<br />Every qualified opportunity moves the needle.</p><span className="print-overline">THE AMBITION — {formatCurrency(target)}</span></div>
      <div className="ambition-dial"><Engraving progress={progress} /><div><strong>{progress}<small>%</small></strong><span>OF THE WAY THERE</span></div></div>
    </section>

    <section className="editorial-scene team-trajectory" data-scene="3" data-scene-end="4" aria-label="Performance trajectory">
      <div className="trajectory-heading"><div><Label number="03">THE LONG VIEW</Label><h2>Momentum has<br /><em>a shape.</em></h2></div><div className="trajectory-forecast"><span>PROJECTED SEPTEMBER CLOSE</span><strong>{formatCurrency(predicted)}</strong><small>{Math.round((predicted / target - 1) * 100)}% above the ambition</small></div></div>
      <div className="trajectory-margin"><span>APRIL — SEPTEMBER</span><strong>Six months.<br /><em>One shared direction.</em></strong><span>FOLLOW THE LINE OF PROGRESS</span></div>
      <ForecastChart actual={sales} predicted={predicted} target={target} history={data.charts.monthlySales} confidence={data.forecast.confidence} />
      <div className="trajectory-notes"><p>Six months of progress.<br />One direction of travel.</p><span>HOVER WITH INTENT TO LOOK CLOSER <ArrowUpRight /></span><p>Illustrative forecast / {Math.round(data.forecast.confidence * 100)}% confidence.<br />Historical series uses demonstration data.</p></div>
    </section>

    <section className="editorial-scene team-contribution" data-scene="5" aria-label="Product contribution">
      <Label number="04">DIFFERENT STRENGTHS. SHARED DIRECTION.</Label>
      <h2>The parts that<br /><em>move the whole.</em></h2>
      <div className="print-mix">{data.charts.productMix.map((item, index) => <div key={item.label} className={`mix-ink mix-ink-${index}`}><span className="mix-index">0{index + 1}</span><span>{item.label}</span><div className="mix-rule"><i style={{ width: `${item.value / largestContribution * 100}%` }} /></div><strong>{item.value}<small>%</small></strong></div>)}</div>
      <p className="editorial-note">Leasing leads. Fleet is finding its stride.<br />The next opportunity lives in the balance.</p>
    </section>

    <section className="editorial-scene team-people" data-scene="6" aria-label="Advisor comparison">
      <Label number="05">THE PEOPLE BEHIND THE PROGRESS</Label>
      <h2>Talent is individual.<br /><em>Progress is shared.</em></h2>
      <div className="print-advisors">{advisors.map((advisor, index) => <button key={advisor.id} onClick={() => onNavigate('advisor-detail', advisor.id)}><span className="advisor-print-rank">0{index + 1}</span><span className="advisor-print-name">{advisor.name}<small>{advisor.title}</small></span><span className="advisor-print-rule"><i style={{ width: `${Math.min(100, advisor.sales / advisor.target * 100)}%` }} /></span><span className="advisor-print-volume">{formatCurrency(advisor.sales)}<small>{Math.round(advisor.sales / advisor.target * 100)}% of target</small></span><ArrowUpRight /></button>)}</div>
      <p className="editorial-note">{atRisk} advisors would benefit from a closer conversation.<br />The strongest teams make room for it.</p>
    </section>

    <section className="editorial-scene team-projection" data-scene="7" aria-label="Projected finish">
      <Label number="06">THE NEXT HORIZON</Label><h2>Where momentum<br /><em>could take us.</em></h2>
      <div className="print-amount"><span>€</span>{predicted.toLocaleString('en')}</div>
      <div className="volume-baseline"><span>PROJECTED MONTH-END VOLUME</span><span className="print-growth">{Math.round(data.forecast.confidence * 100)}% <small>model confidence</small></span></div>
      <p className="editorial-note">{formatCurrency(Math.abs(predicted - target))} {predicted >= target ? 'above' : 'below'} the monthly ambition.<br />A projection, shaped by the pace you sustain.</p>
      <button className="print-link" onClick={() => onNavigate('forecasts')}>Explore the forecast <ArrowUpRight /></button>
    </section>

    <section className="editorial-scene team-insight" data-scene="8" aria-label="Team recommendation">
      <Label number="07">CHAMPIONS INTELLIGENCE</Label>
      <Sparkles className="insight-print-star" aria-hidden="true" />
      <blockquote>“The next gain may not be another sale. <br />It may be the conversation <br /><em>that makes five possible.</em>”</blockquote>
      <div className="insight-print-bottom"><div className="minutes-mark"><strong>20</strong><span>MINUTES.<br />ONE MEANINGFUL CONVERSATION.</span></div><div><p>{data.aiInsights.nextActions[0]}.</p><button className="print-link" onClick={() => onNavigate('ai-insights')}>Read the intelligence brief <ArrowUpRight /></button></div></div>
    </section>

    <section className="editorial-scene team-ending" data-scene="9" aria-label="Team performance conclusion">
      <Label number="02 / FIN">A CHAPTER IN YOUR PROGRESS</Label>
      <h2>Good performance<br />is never <em>a solo act.</em></h2>
      <p>You have seen the momentum.<br />Now meet the people moving it forward.</p>
      <button className="print-link" onClick={() => onNavigate('advisors')}>03 <i /> The advisors <ArrowUpRight /></button>
      <div className="end-colophon"><span>CHAMPIONSCLUB<br />THE PERFORMANCE STANDARD</span><span>THE STORY CONTINUES TO YOUR LEFT.</span></div>
    </section>
    <section className="editorial-scene team-turning" data-scene="10" aria-label="Physical page-turn area"><Label number="FIN">THE HUMAN SIDE OF PERFORMANCE</Label><span className="next-chapter-numeral">03</span><h2>Meet the people.<br /><em>Turn the page.</em></h2><p>Continue scrolling, or take the lower-right corner<br />and draw it toward the upper left.</p><div className="end-colophon"><span>YOU HAVE TRAVELLED THROUGH TEAM PERFORMANCE</span><span>ADVISORS / NEXT</span></div></section>
  </div>
}
