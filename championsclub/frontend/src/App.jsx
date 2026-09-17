import { lazy, Suspense, useEffect, useState } from 'react'
import { HashRouter, useLocation, useNavigate } from 'react-router-dom'
import { demoAccounts } from './product/demoData.js'
import { readAccountId, saveAccountId } from './product/storage.js'
import { useProductData } from './product/useProductData.js'
import { getDefaultPageForRole } from './product/pageRegistry.js'
import { Toast } from './components/shell/Toast.jsx'
import { ExperienceNavigation } from './experience/ui/ExperienceNavigation.jsx'

const AutomotiveExperience = lazy(() => import('./experience/AutomotiveExperience.jsx'))
const Workspace = lazy(() => import('./workspace/Workspace.jsx'))

export default function App() {
  return <HashRouter><ChampionsClub /></HashRouter>
}

function ChampionsClub() {
  const [accountId, setAccountId] = useState(readAccountId)
  const [switching, setSwitching] = useState(null)
  const account = demoAccounts.find((item) => item.id === accountId) ?? demoAccounts[1]
  const data = useProductData(account)
  const navigate = useNavigate()
  const location = useLocation()
  const workspaceOpen = location.pathname !== '/'

  function openWorkspace(page) {
    navigate(`/workspace/${page ?? getDefaultPageForRole(account.role)}`)
  }

  function changeAccount(id) {
    const next = demoAccounts.find((item) => item.id === id)
    if (!next || next.id === account.id) return
    setSwitching(next)
  }

  useEffect(() => {
    if (!switching) return
    const commit = setTimeout(() => {
      saveAccountId(switching.id)
      setAccountId(switching.id)
      if (workspaceOpen) navigate(`/workspace/${getDefaultPageForRole(switching.role)}`, { replace: true })
    }, 180)
    const finish = setTimeout(() => setSwitching(null), 480)
    return () => { clearTimeout(commit); clearTimeout(finish) }
  }, [switching, navigate, workspaceOpen])

  return <>
    <ExperienceNavigation account={account} accounts={demoAccounts} data={data} workspaceOpen={workspaceOpen} onExperience={() => navigate('/')} onWorkspace={openWorkspace} onChangeAccount={changeAccount} />
    <Suspense fallback={<div className="initial-loading">CHAMPIONSCLUB<span>ENGINEERING PERFORMANCE</span></div>}><AutomotiveExperience data={data} paused={workspaceOpen || Boolean(switching)} onWorkspace={openWorkspace} /></Suspense>
    {workspaceOpen && <Suspense fallback={<div className="workspace-loading" role="status">PREPARING YOUR WORKSPACE</div>}><Workspace key={account.id} account={account} data={data} onNavigate={openWorkspace} /></Suspense>}
    {switching && <div className="identity-transition" role="status"><span>CONNECTED AS</span><strong>{switching.name}</strong><small>{switching.title}</small></div>}
    <Toast message={data.message} onClose={data.clearMessage} />
  </>
}
