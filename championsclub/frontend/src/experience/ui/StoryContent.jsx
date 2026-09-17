import { ArrowUpRight, ArrowDown } from 'lucide-react'
import { chapters } from '../ExperienceTimeline.js'
import { currency, percentage } from '../storyData.js'

export function StoryTypography() {
  return <div className="story-typography" aria-label="Performance is a system">
    {chapters.map((chapter, index) => <div className={`story-copy story-copy-${index}`} data-story-copy={index} key={chapter.name} aria-hidden={index !== 0}>
      <span className="story-eyebrow">{chapter.label}</span>
      {index === 0 ? <h1>{chapter.title[0]}<br /><span>{chapter.title[1]}</span></h1> : <h2>{chapter.title[0]}<br /><span>{chapter.title[1]}</span></h2>}
    </div>)}
  </div>
}

function Metric({ label, value, detail }) {
  return <div className="scene-metric"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>
}

export function StoryContent({ metrics, data, onWorkspace, onSeek, anchorRef }) {
  return <div className="story-information">
    {chapters.map((chapter, index) => <div key={index} className={`story-panel story-panel-${index}`} data-story-panel={index} aria-hidden={index !== 0}>
      <div className="scene-caption"><span>{String(index + 1).padStart(2, '0')} — {chapter.name.toUpperCase()}</span><p>{chapter.note}</p></div>
      {index === 0 && <><div className="hero-spec"><span>THE CHAMPIONSCLUB EXPERIENCE</span><p>Human ambition.<br />Mechanical precision.</p></div><button className="scroll-cue" onClick={() => onSeek(1)}>SCROLL TO SET IT IN MOTION <ArrowDown /></button></>}
      {index === 2 && <div className="mechanical-key"><span>01 — BODY</span><span>02 — POWERTRAIN</span><span>03 — CHASSIS</span><small>Independent parts. Shared purpose.</small></div>}
      {index === 4 && <div className="scene-data"><Metric label={metrics.scope} value={currency(metrics.actual)} detail="SALES RECORDED / CURRENT CYCLE" /><span className="data-provenance">{metrics.source}</span></div>}
      {index === 5 && <div className="mechanical-key"><span>CYLINDER HEAD</span><span>PISTON ASSEMBLY</span><span>ENGINE BLOCK</span><span>CRANKSHAFT</span></div>}
      {index === 6 && <div className="scene-data advisor-contributions"><span className="micro-label">THE CONTRIBUTION OF EACH</span>{metrics.contributors.slice(0, 5).map((advisor) => <div key={advisor.id}><span>{advisor.name}</span><strong>{currency(advisor.sales)}</strong>{(!metrics.live || metrics.personal) && <small>{percentage(advisor.target > 0 ? advisor.sales / advisor.target * 100 : null)} OF TARGET</small>}</div>)}<span className="data-provenance">{metrics.source}</span></div>}
      {index === 7 && <div className="scene-data"><Metric label={data.currentUser.role === 'SALES_ADVISOR' ? 'YOUR TARGET ACHIEVEMENT' : 'TEAM TARGET ACHIEVEMENT'} value={percentage(metrics.achievement)} detail={`${currency(metrics.actual)} / ${currency(metrics.target)}`} /><span className="data-provenance">{metrics.source}</span></div>}
      {index === 8 && <div className="forecast-telemetry"><Metric label="ACTUAL" value={currency(metrics.actual)} /><Metric label="FORECAST" value={currency(metrics.forecast)} /><Metric label="TARGET" value={currency(metrics.target)} /><span className="data-provenance">{metrics.forecastSource}{metrics.confidence != null ? ` / ${percentage(metrics.confidence * 100)} CONFIDENCE` : ''}</span></div>}
      {index === 9 && <div className="intelligence-signals"><span className="micro-label">{metrics.intelligenceSource}</span>{metrics.signals.map(([label, content]) => <div key={label}><span>{label}</span><p>{content || 'Awaiting a verified signal.'}</p></div>)}<button className="scene-link" onClick={() => onWorkspace('ai-insights')}>OPEN INTELLIGENCE <ArrowUpRight /></button></div>}
      {index === 10 && <div className="scene-data recognition-data"><div className="material-grades"><span>BRONZE</span><span>SILVER</span><span>GOLD</span></div><Metric label={data.currentUser.role === 'SALES_ADVISOR' ? 'YOUR AVAILABLE POINTS' : 'TEAM AVAILABLE POINTS'} value={metrics.balance.toLocaleString('en')} detail={`${data.rewards.filter((reward) => reward.status !== 'Inactive').length} REWARDS IN THE COLLECTION`} /><button className="scene-link" onClick={() => onWorkspace(data.currentUser.role === 'ADMIN' ? 'admin-rewards' : 'rewards')}>EXPLORE REWARDS <ArrowUpRight /></button></div>}
      {index === 12 && <div className="final-actions"><span>CHAMPIONSCLUB</span><button className="workspace-cta" onClick={() => onWorkspace()}>ENTER YOUR WORKSPACE <ArrowUpRight /></button><button className="replay-link" onClick={() => onSeek(0)}>RETRACE THE JOURNEY ↑</button></div>}
    </div>)}
    <div className="component-anchor" ref={anchorRef} aria-hidden="true"><i /><span>POWER UNIT / CC—01</span></div>
  </div>
}
