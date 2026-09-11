import { useCallback, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { navigationByRole } from './product/navigation.js'
import { getDefaultPageForRole } from './product/pageRegistry.js'
import { demoAccounts } from './product/demoData.js'
import { readAccountId, saveAccountId } from './product/storage.js'
import { useProductData } from './product/useProductData.js'
import { useNavigation } from './product/useNavigation.js'
import { DemoAccountSwitcher } from './components/shell/RoleSwitcher.jsx'
import { Sidebar } from './components/shell/Sidebar.jsx'
import { GlobalSearch } from './components/shell/GlobalSearch.jsx'
import { Brand } from './components/shell/Brand.jsx'
import { Notifications } from './components/shell/Notifications.jsx'
import { IntroOverlay, hasSeenIntro } from './components/shell/IntroOverlay.jsx'
import { Toast } from './components/shell/Toast.jsx'
import { PageRouter } from './pages/PageRouter.jsx'

export default function App() {
  const [accountId, setAccountId] = useState(readAccountId)
  const account = demoAccounts.find((item) => item.id === accountId) ?? demoAccounts[1]
  const [introComplete, setIntroComplete] = useState(hasSeenIntro)
  const completeIntro = useCallback(() => setIntroComplete(true), [])
  const data = useProductData(account)
  const { activePage, selectedAdvisorId, setSelectedAdvisorId, navigate } = useNavigation(account.role)
  const navigation = navigationByRole[account.role]
  const activeItem = navigation.find((item) => item.page === activePage)
  const title = activePage === 'advisor-detail' ? 'Advisor intelligence' : activePage === 'profile' ? 'Your account' : activeItem?.label ?? 'Overview'

  function changeAccount(id) {
    const next = demoAccounts.find((item) => item.id === id)
    if (!next) return
    saveAccountId(id)
    location.hash = getDefaultPageForRole(next.role)
    setAccountId(id)
  }

  return <main inert={!introComplete} className={`product-shell ${introComplete ? 'intro-complete' : 'intro-active'}`}>
    <a className="skip-link" href="#workspace-content" onClick={(event) => { event.preventDefault(); document.getElementById('workspace-content')?.focus() }}>Skip to content</a>
    {!introComplete && <IntroOverlay onComplete={completeIntro} />}
    <Sidebar account={account} activePage={activePage} navigation={navigation} onNavigate={navigate} />
    <section className="product-workspace" inert={!introComplete}>
      <header className="topbar"><Brand /><div className="topbar-actions">
        <GlobalSearch key={`search-${account.id}`} data={data} navigation={navigation} onNavigate={navigate} />
        <Notifications key={`notifications-${account.id}`} data={data} onNavigate={navigate} />
        <DemoAccountSwitcher accounts={demoAccounts} currentAccountId={account.id} onChange={changeAccount} />
      </div></header>
      <div className="page-title"><div><span className="eyebrow">{account.dealership} <span aria-hidden="true"> / </span> {activeItem?.section ?? 'People'}</span><h1>{title}</h1><p className="page-subtitle">{activePage.includes('overview') ? `Welcome back, ${account.name.split(' ')[0]}. Every move counts.` : activeItem?.title ?? 'Performance, context and your next move.'}</p></div><div className="cycle-badge"><CalendarDays /><span>September 2026</span></div></div>
      {data.serviceError && <div className="service-banner" role="status"><span>{data.serviceError}</span><button className="secondary-action" onClick={data.actions.retry}>Retry connection</button></div>}
      {data.connectionState === 'checking' ? <div className="page-stack" aria-label="Loading workspace"><div className="kpi-grid">{[0, 1, 2, 3].map((item) => <div key={item} className="skeleton" />)}</div><div className="skeleton" style={{ height: 320 }} /></div> : <div id="workspace-content" tabIndex={-1} className="page-transition" key={`${account.id}-${activePage}`}><PageRouter activePage={activePage} data={data} role={account.role} selectedAdvisorId={selectedAdvisorId} setActivePage={navigate} setSelectedAdvisorId={setSelectedAdvisorId} /></div>}
      <footer className="workspace-footer"><span>CHAMPIONSCLUB <span aria-hidden="true"> / </span> THE PERFORMANCE STANDARD</span><span className={`connection-indicator ${data.connectionState}`}><i />{data.connectionState === 'live' ? 'Connected to live services' : 'Demo workspace. Changes saved on this device.'}</span></footer>
    </section>
    <Toast message={data.message} onClose={data.clearMessage} />
  </main>
}
