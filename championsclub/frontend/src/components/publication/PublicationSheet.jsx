import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react'
import { TeamPerformanceChapter } from '../../pages/editorial/TeamPerformanceChapter.jsx'
import { OverviewChapter } from '../../pages/editorial/OverviewChapter.jsx'
import { ForecastChapter } from '../../pages/editorial/ForecastChapter.jsx'
import { IntelligenceChapter } from '../../pages/editorial/IntelligenceChapter.jsx'
import { RewardsChapter } from '../../pages/editorial/RewardsChapter.jsx'
import { LeaderboardChapter } from '../../pages/editorial/LeaderboardChapter.jsx'
import { WorkingChapter } from '../../pages/editorial/WorkingChapter.jsx'
import { ClosingChapter } from '../../pages/editorial/ClosingChapter.jsx'
import { PrintedThread } from '../../pages/editorial/EditorialParts.jsx'
import { createCamera } from './camera.js'
import { journeyFor } from './chapterJourneys.js'

export const PublicationSheet = forwardRef(function PublicationSheet({ route, data, navigation, initialPosition = 0, onNavigate, onCloseBook, onEdge, onProgress, active }, ref) {
  const viewport = useRef(null)
  const world = useRef(null)
  const camera = useRef(null)
  const callbacks = useRef({ onEdge, onProgress })
  callbacks.current = { onEdge, onProgress }
  const journey = useMemo(() => journeyFor(route.page), [route.page])
  const chapter = navigation.find((item) => item.page === route.page)
  const title = route.page === 'advisor-detail' ? 'Advisor intelligence' : route.page === 'profile' ? 'Your account' : chapter?.label ?? 'Overview'
  const width = Math.max(...journey.stops.map((stop) => stop.x)) + 1.12
  const height = Math.max(...journey.stops.map((stop) => stop.y)) + 1.12

  useLayoutEffect(() => {
    camera.current = createCamera({ viewport: viewport.current, canvas: world.current, ...journey, initial: initialPosition,
      onEdge: (edge) => callbacks.current.onEdge?.(edge), onProgress: (...args) => callbacks.current.onProgress?.(...args) })
    return () => { camera.current?.destroy(); camera.current = null }
  }, [journey])

  useImperativeHandle(ref, () => ({
    get element() { return viewport.current },
    get position() { return camera.current?.position ?? 0 },
    get atEnd() { return camera.current?.atEnd ?? false },
    get atStart() { return camera.current?.atStart ?? true },
    get spatial() { return true },
    advance(delta) { camera.current?.advance(delta) },
    seek(position, immediate = false) { camera.current?.seek(position, immediate) },
    stop() { camera.current?.stop() }
  }), [])

  const props = { data, stops: journey.stops, onNavigate }
  let content
  if (route.page === 'team-performance') content = <TeamPerformanceChapter {...props} />
  else if (route.page === 'overview' || route.page === 'my-performance') content = <OverviewChapter {...props} personalPerformance={route.page === 'my-performance'} />
  else if (route.page === 'forecasts') content = <ForecastChapter {...props} />
  else if (route.page === 'ai-insights') content = <IntelligenceChapter {...props} />
  else if (route.page === 'rewards') content = <RewardsChapter {...props} />
  else if (route.page === 'leaderboard') content = <LeaderboardChapter {...props} />
  else if (route.page === 'closing') content = <ClosingChapter stops={journey.stops} onCloseBook={onCloseBook} />
  else content = <WorkingChapter {...props} route={route} title={title} onExplore={(index) => camera.current?.seek(index / (journey.stops.length - 1))} />

  return <section ref={viewport} className="paper-layer spatial-sheet" data-sheet={route.page} aria-hidden={!active} inert={!active}>
    <div ref={world} className="paper-world" id={active ? 'workspace-content' : undefined} style={{ width: `calc(var(--view-w) * ${width})`, height: `calc(var(--view-h) * ${height})` }}>
      {route.page !== 'team-performance' && <PrintedThread />}
      {content}
    </div>
  </section>
})
