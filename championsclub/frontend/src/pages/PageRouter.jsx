import { AdminPage } from './admin/AdminPage.jsx'
import { AdvisorDetailPage } from './manager/AdvisorDetailPage.jsx'
import { AdvisorsPage } from './manager/AdvisorsPage.jsx'
import { AlertsPage } from './shared/AlertsPage.jsx'
import { AiInsightsPage } from './shared/AiInsightsPage.jsx'
import { ForecastsPage } from './shared/ForecastsPage.jsx'
import { LeaderboardPage } from './shared/LeaderboardPage.jsx'
import { OverviewPage } from './shared/OverviewPage.jsx'
import { PerformancePage } from './shared/PerformancePage.jsx'
import { RewardsPage } from './shared/RewardsPage.jsx'
import { SalesActivityPage } from './shared/SalesActivityPage.jsx'
import { TargetsPage } from './shared/TargetsPage.jsx'
import { ProfilePage } from './shared/ProfilePage.jsx'

export function PageRouter(props) {
  if (props.activePage.startsWith('admin-')) {
    return <AdminPage {...props} />
  }
  if (props.activePage === 'advisor-detail') {
    return <AdvisorDetailPage {...props} />
  }
  if (props.activePage === 'advisors') {
    return <AdvisorsPage {...props} />
  }
  if (props.activePage === 'team-performance' || props.activePage === 'my-performance') {
    return <PerformancePage {...props} />
  }
  if (props.activePage === 'targets') {
    return <TargetsPage {...props} />
  }
  if (props.activePage === 'forecasts') {
    return <ForecastsPage {...props} />
  }
  if (props.activePage === 'alerts') {
    return <AlertsPage {...props} />
  }
  if (props.activePage === 'leaderboard') {
    return <LeaderboardPage {...props} />
  }
  if (props.activePage === 'rewards') {
    return <RewardsPage {...props} />
  }
  if (props.activePage === 'ai-insights') {
    return <AiInsightsPage {...props} />
  }
  if (props.activePage === 'sales-history' || props.activePage === 'dealership-activity') {
    return <SalesActivityPage {...props} />
  }
  if (props.activePage === 'profile') {
    return <ProfilePage {...props} />
  }
  return <OverviewPage {...props} />
}

