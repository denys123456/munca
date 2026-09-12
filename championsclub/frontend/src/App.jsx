import { useCallback, useEffect, useState } from 'react'
import { HashRouter, useNavigate } from 'react-router-dom'
import { demoAccounts } from './product/demoData.js'
import { readAccountId, saveAccountId } from './product/storage.js'
import { useProductData } from './product/useProductData.js'
import { getDefaultPageForRole } from './product/pageRegistry.js'
import { Publication } from './components/publication/Publication.jsx'
import { Toast } from './components/shell/Toast.jsx'
import { BookOpening, hasOpenedBook } from './components/publication/BookOpening.jsx'

export default function App() {
  return <HashRouter><PublicationApp /></HashRouter>
}

function PublicationApp() {
  const [accountId, setAccountId] = useState(readAccountId)
  const [opening, setOpening] = useState(() => !hasOpenedBook())
  const [closed, setClosed] = useState(false)
  const [switching, setSwitching] = useState(null)
  const finishOpening = useCallback(() => { setOpening(false); setClosed(false) }, [])
  const account = demoAccounts.find((item) => item.id === accountId) ?? demoAccounts[1]
  const data = useProductData(account)
  const navigate = useNavigate()

  function changeAccount(id) {
    const next = demoAccounts.find((item) => item.id === id)
    if (!next || id === accountId) return
    setSwitching(next)
  }

  useEffect(() => {
    if (!switching) return
    const commit = setTimeout(() => {
      saveAccountId(switching.id)
      navigate(`/${switching.role === 'MANAGER' ? 'team-performance' : getDefaultPageForRole(switching.role)}`, { replace: true })
      setAccountId(switching.id)
    }, 250)
    const finish = setTimeout(() => setSwitching(null), 1000)
    return () => { clearTimeout(commit); clearTimeout(finish) }
  }, [switching, navigate])

  return <>
    <div className="publication-environment" inert={opening || closed || Boolean(switching)}><Publication key={account.id} account={account} accounts={demoAccounts} data={data} onChangeAccount={changeAccount} onCloseBook={() => setClosed(true)} /></div>
    {(opening || closed) && <BookOpening closed={closed} onComplete={finishOpening} />}
    {switching && <div className="identity-transition" role="status"><span>Ex libris</span><strong>{switching.name}</strong><small>{switching.title}</small></div>}
    <Toast message={data.message} onClose={data.clearMessage} />
  </>
}
