import { teamStops } from './camera.js'

const stop = (x, y, label) => ({ x, y, label })
const journeys = {
  'team-performance': { distance: 8.8, stops: teamStops },
  overview: { distance: 6.4, stops: [stop(0, 0, 'The opening'), stop(1.08, 0, 'Your momentum'), stop(1.08, 1.18, 'The trajectory'), stop(0, 1.18, 'The intelligence'), stop(0, 2.36, 'Your next move')] },
  forecasts: { distance: 8.8, stops: [stop(0, 0, 'The horizon'), stop(1.08, 0, 'Actual history'), stop(2.16, 0, 'The forecast begins'), stop(2.16, 1.18, 'Current pace'), stop(1.08, 1.18, 'Confidence'), stop(0, 1.18, 'Projected finish'), stop(0, 2.36, 'Model explanation'), stop(1.08, 2.36, 'The interpretation'), stop(2.16, 2.36, 'The next action')] },
  'ai-insights': { distance: 7.2, stops: [stop(0, 0, 'Automated summary'), stop(1.08, 0, 'What changed'), stop(2.16, .18, 'Why it matters'), stop(2.16, 1.36, 'Risk'), stop(1.08, 1.36, 'Opportunity'), stop(0, 1.36, 'Recommended action'), stop(0, 2.54, 'The next chapter')] },
  rewards: { distance: 6, stops: [stop(0, 0, 'The collection'), stop(1.08, .18, 'Your recognition'), stop(1.08, 1.36, 'The catalogue'), stop(0, 1.36, 'Redemption history'), stop(0, 2.54, 'Keep progressing')] },
  leaderboard: { distance: 6.6, stops: [stop(0, 0, 'The championship'), stop(1.08, 0, 'Leading the way'), stop(2.16, .18, 'Raising the standard'), stop(1.08, 1.36, 'The full field'), stop(0, 2.54, 'Every contribution')] }
}

export function journeyFor(page) {
  if (page === 'my-performance') return journeys.overview
  if (page === 'closing') return { distance: 3, stops: [stop(0, 0, 'The final word'), stop(1.08, 0, 'Until the next chapter')] }
  return journeys[page] ?? { distance: page.startsWith('admin-') ? 3.6 : 5, stops: [stop(0, 0, 'The opening'), stop(1.08, .14, 'The working page'), stop(1.08, 1.32, 'The next chapter')] }
}
