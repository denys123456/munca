import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageRouter } from '../pages/PageRouter.jsx'
import { navigationByRole } from '../product/navigation.js'
import { getDefaultPageForRole } from '../product/pageRegistry.js'
import { GlobalSearch } from '../components/shell/GlobalSearch.jsx'
import { Notifications } from '../components/shell/Notifications.jsx'

export default function Workspace({ account, data, onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const root = useRef(null)
  const navigation = navigationByRole[account.role]
  const segments = location.pathname.split('/').filter(Boolean)
  const requested = segments[0] === 'workspace' ? segments[1] : segments[0]
  const permitted = navigation.some((item) => item.page === requested) || requested === 'advisor-detail' && account.role === 'MANAGER'
  const activePage = permitted ? requested : getDefaultPageForRole(account.role)
  const selectedAdvisorId = Number(segments[segments[0] === 'workspace' ? 2 : 1]) || 1
  const current = navigation.find((item) => item.page === activePage) ?? { label: 'Advisor detail', section: 'People' }
  const setActivePage = (page, advisorId) => onNavigate(`${page}${advisorId ? `/${advisorId}` : ''}`)

  useEffect(() => {
    const route = `/workspace/${activePage}${activePage === 'advisor-detail' ? `/${selectedAdvisorId}` : ''}`
    if (location.pathname !== route) navigate(route, { replace: true })
  }, [activePage, selectedAdvisorId, location.pathname, navigate])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  useEffect(() => { root.current.scrollTop = 0; root.current.focus({ preventScroll: true }) }, [activePage])

  return <section className="operational-workspace" ref={root} tabIndex={-1} data-lenis-prevent aria-label={`${account.title} workspace`} data-route={activePage}>
    <div className="workspace-tools"><div><span className="micro-label">{account.dealership}</span><span className="workspace-data-source">{data.connectionState === 'live' ? 'LIVE CONNECTION' : data.connectionState === 'checking' ? 'CONNECTING' : 'SEEDED DEMO DATA'}</span></div><GlobalSearch data={data} navigation={navigation} onNavigate={setActivePage} /><Notifications data={data} onNavigate={setActivePage} /></div>
    <nav className="workspace-navigation" aria-label="Workspace areas">{navigation.map((item) => <button key={item.page} aria-current={item.page === activePage ? 'page' : undefined} onClick={() => setActivePage(item.page)}>{item.label}</button>)}</nav>
    <header className="workspace-heading"><span className="micro-label">{current.section} / {account.name}</span><h1>{current.label}</h1><span>CC / OPERATIONS</span></header>
    {data.serviceError && <div className="service-status" role="status">{data.serviceError}<button onClick={data.actions.retry}>Retry connection</button></div>}
    <div id="workspace-content"><PageRouter activePage={activePage} data={data} role={account.role} selectedAdvisorId={selectedAdvisorId} setActivePage={setActivePage} setSelectedAdvisorId={(id) => setActivePage('advisor-detail', id)} /></div>
  </section>
}
