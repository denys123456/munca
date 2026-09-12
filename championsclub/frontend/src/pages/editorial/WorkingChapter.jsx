import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { PageRouter } from '../PageRouter.jsx'
import { Scene, JourneyOpening, PrintLabel, ChapterEnd } from './EditorialParts.jsx'

const statements = {
  advisors: ['People make', 'performance.', 'Individual talent. Collective momentum. Meet the people moving your dealership forward.'],
  targets: ['Give ambition', 'a destination.', 'Clear commitments turn everyday effort into meaningful progress.'],
  alerts: ['Notice the signal.', 'Shape the response.', 'The right attention, at the right moment, makes all the difference.'],
  'dealership-activity': ['Every conversation', 'leaves a mark.', 'Follow the work behind the numbers. Each recorded sale is another step forward.'],
  'sales-history': ['Your work.', 'On the record.', 'A living record of the conversations that became progress.'],
  'advisor-detail': ['Individual talent.', 'In perspective.', 'Look closer at the person, the progress and the next opportunity.'],
  profile: ['Your place', 'in the story.', 'The identity, membership and preferences behind your ChampionsClub experience.']
}

export function WorkingChapter({ route, data, stops, title, onNavigate, onExplore }) {
  const statement = statements[route.page] ?? ['Make excellence', 'possible.', 'Thoughtful administration. Clear rules. A stronger foundation for everyone.']
  return <>
    <Scene stops={stops} index={0} className="working-opening"><JourneyOpening title={title} first={statement[0]} emphasis={statement[1]} description={statement[2]} /><button className="print-link working-entry" onClick={() => onExplore(1)}>Open {title.toLowerCase()}<ArrowUpRight /></button><span className="source-note">{data.currentUser.dealership.toUpperCase()} / {data.connectionState === 'live' ? 'CONNECTED TO LIVE SERVICES' : 'DEMO WORKSPACE · SAVED ON THIS DEVICE'}</span><div className="working-imprint" aria-hidden="true"><i /><span>THE DETAILS MAKE THE DIFFERENCE</span><strong>{title}</strong><small>CHAMPIONSCLUB / THE WORKING PAPERS</small></div></Scene>
    <Scene stops={stops} index={1} className="working-scene"><PrintLabel number="01">{title.toUpperCase()} / THE WORKING PAGE</PrintLabel><div className="local-workspace" data-local-scroll tabIndex={0} role="region" aria-label={`${title} workspace`}><PageRouter activePage={route.page} data={data} role={data.currentUser.role} selectedAdvisorId={route.advisorId} setActivePage={onNavigate} setSelectedAdvisorId={() => {}} /></div><button className="print-link working-continue" onClick={() => onExplore(2)}>Continue reading<ArrowDownRight /></button></Scene>
    <Scene stops={stops} index={2}><ChapterEnd title="Every detail makes a difference." /></Scene>
  </>
}
