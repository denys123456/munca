import { useEffect, useMemo, useState } from 'react'
import { Bell, ChevronRight, Search } from 'lucide-react'
import { navigationByRole } from './product/navigation.js'
import { getDefaultPageForRole } from './product/pageRegistry.js'
import { demoAccounts } from './product/demoData.js'
import { useProductData } from './product/useProductData.js'
import { DemoAccountSwitcher } from './components/shell/RoleSwitcher.jsx'
import { Sidebar } from './components/shell/Sidebar.jsx'
import { PageRouter } from './pages/PageRouter.jsx'

const introMessage = 'Turn performance into progress.'

export default function App() {
  const [accountId, setAccountId] = useState(demoAccounts[1].id)
  const account = demoAccounts.find((demoAccount) => demoAccount.id === accountId) ?? demoAccounts[1]
  const [activePage, setActivePage] = useState(getDefaultPageForRole(account.role))
  const [selectedAdvisorId, setSelectedAdvisorId] = useState(1)
  const [introState, setIntroState] = useState(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'complete'
    }
    return window.sessionStorage.getItem('championsclub-intro-seen') === 'true' ? 'complete' : 'typing'
  })
  const [typedText, setTypedText] = useState(introState === 'complete' ? introMessage : '')
  const productData = useProductData(account)
  const role = productData.currentUser.role
  const navigation = navigationByRole[role]
  const activeNavigationItem = useMemo(
    () => navigation.find((item) => item.page === activePage) ?? navigation[0],
    [activePage, navigation],
  )

  function changeDemoAccount(nextAccountId) {
    const nextAccount = demoAccounts.find((demoAccount) => demoAccount.id === nextAccountId) ?? demoAccounts[1]
    setAccountId(nextAccount.id)
    setActivePage(getDefaultPageForRole(nextAccount.role))
  }

  function handlePointerMove(event) {
    if (!window.matchMedia('(pointer: fine)').matches) {
      return
    }
    const spotlightTarget = event.target.closest(
      '.kpi-card, .panel, .reward-card, .advisor-row, .alert-card, .leaderboard-card, .executive-hero, .forecast-primary, .insight-section, .primary-action, .secondary-action',
    )
    if (!spotlightTarget) {
      return
    }
    const rect = spotlightTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    spotlightTarget.style.setProperty('--spotlight-x', `${x}%`)
    spotlightTarget.style.setProperty('--spotlight-y', `${y}%`)
    spotlightTarget.style.setProperty('--tilt-x', `${((y - 50) / 50) * -3}deg`)
    spotlightTarget.style.setProperty('--tilt-y', `${((x - 50) / 50) * 3}deg`)
  }

  useEffect(() => {
    const nextDefaultPage = getDefaultPageForRole(role)
    if (!navigation.some((item) => item.page === activePage)) {
      setActivePage(nextDefaultPage)
    }
  }, [activePage, navigation, role])

  useEffect(() => {
    if (introState !== 'typing') {
      return undefined
    }

    if (typedText.length >= introMessage.length) {
      const completeTimer = window.setTimeout(() => {
        window.sessionStorage.setItem('championsclub-intro-seen', 'true')
        setIntroState('complete')
      }, 520)
      return () => window.clearTimeout(completeTimer)
    }

    const currentCharacter = introMessage[typedText.length]
    const delay = currentCharacter === ' ' ? 42 : 34 + ((typedText.length * 13) % 34)
    const typeTimer = window.setTimeout(() => {
      setTypedText(introMessage.slice(0, typedText.length + 1))
    }, delay)
    return () => window.clearTimeout(typeTimer)
  }, [introState, typedText])

  return (
    <main
      className={`product-shell ${introState === 'complete' ? 'intro-complete' : 'intro-active'}`}
      onPointerMove={handlePointerMove}
    >
      <div className="intro-sequence" aria-hidden={introState === 'complete'}>
        <BrandMark />
        <p>
          {typedText}
          <span className={typedText.length === introMessage.length ? 'cursor is-done' : 'cursor'} />
        </p>
      </div>
      <Sidebar
        account={productData.currentUser}
        activePage={activePage}
        navigation={navigation}
        onNavigate={setActivePage}
      />
      <section className="product-workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span>{productData.currentUser.dealership}</span>
            <ChevronRight aria-hidden="true" />
            <strong>{activeNavigationItem.label}</strong>
          </div>
          <div className="topbar-actions">
            <div className="global-search">
              <Search aria-hidden="true" />
              <span>Search performance intelligence</span>
            </div>
            <button className="icon-button" type="button" aria-label="Open notifications">
              <Bell aria-hidden="true" />
            </button>
            <DemoAccountSwitcher
              accounts={demoAccounts}
              currentAccountId={account.id}
              onChange={changeDemoAccount}
            />
          </div>
        </header>
        <div className="page-title" key={`${activePage}-title`}>
          <div>
            <span className="eyebrow">{activeNavigationItem.section}</span>
            <h1>{activeNavigationItem.title}</h1>
          </div>
          <div className="identity-chip" aria-label={`Signed in as ${productData.currentUser.name}`}>
            <span>{productData.currentUser.avatar}</span>
            <div>
              <strong>{productData.currentUser.name}</strong>
              <small>{productData.currentUser.title}</small>
            </div>
          </div>
        </div>
        <div className="page-transition" key={`${role}-${activePage}`}>
          <PageRouter
            activePage={activePage}
            data={productData}
            role={role}
            selectedAdvisorId={selectedAdvisorId}
            setActivePage={setActivePage}
            setSelectedAdvisorId={setSelectedAdvisorId}
          />
        </div>
      </section>
    </main>
  )
}

function BrandMark() {
  return (
    <div className="brand-symbol" aria-hidden="true">
      <span />
    </div>
  )
}
