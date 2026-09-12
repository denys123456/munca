import { ArrowDownRight, Search } from 'lucide-react'
import { GlobalSearch } from '../shell/GlobalSearch.jsx'
import { useEffect, useRef } from 'react'
import { DemoAccountSwitcher } from '../shell/RoleSwitcher.jsx'
import { Notifications } from '../shell/Notifications.jsx'

export function ReaderControls({ account, accounts, data, navigation, currentIndex, navigate, onChangeAccount, atEnd, progressLine, progressNumber, progressLabel }) {
  const header = useRef(null)
  useEffect(() => {
    const dismiss = (event) => {
      const escape = event.type === 'keydown' && event.key === 'Escape'
      if (event.type === 'keydown' && !escape) return
      header.current?.querySelectorAll('details[open]').forEach((detail) => {
        if (escape || !detail.contains(event.target)) {
          detail.open = false
          if (escape) detail.querySelector('summary').focus({ preventScroll: true })
        }
      })
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', dismiss)
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', dismiss) }
  }, [])
  function opened(event) { if (event.currentTarget.open) document.dispatchEvent(new Event('publication-focus')) }

  return <>
    <header ref={header} className="publication-masthead"><button className="publication-wordmark" onClick={() => navigate(navigation[0].page)}>CHAMPIONSCLUB<span>THE PERFORMANCE ISSUE</span></button><div className="publication-tools">
      <details className="editorial-index" onToggle={opened}><summary aria-label="Search the book"><Search /><span>Index</span></summary><div className="index-search"><GlobalSearch data={data} navigation={navigation} onNavigate={navigate} /></div></details>
      <Notifications data={data} onNavigate={navigate} />
      <details className="ownership-mark" onToggle={opened}><summary aria-label="Choose demo account"><span>EX LIBRIS</span>{account.name}<i /></summary><div className="ownership-menu"><DemoAccountSwitcher accounts={accounts} currentAccountId={account.id} onChange={onChangeAccount} /></div></details>
    </div></header>
    <nav className="chapter-index" aria-label="Chapters">{navigation.map((item, index) => <a href={`#/${item.page}`} key={item.page} aria-current={index === currentIndex ? 'page' : undefined} aria-label={item.label} title={item.label} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(item.page) }}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.label}</strong><i /></a>)}</nav>
    <footer className="publication-folio"><div className="folio-chapter"><span>{currentIndex < 0 ? 'FIN' : String(currentIndex + 1).padStart(2, '0')}</span><i /><span>{navigation[currentIndex]?.label ?? 'Afterword'}</span></div><div className="journey-status" aria-label="Reading progress"><span ref={progressNumber}>01</span><div><i ref={progressLine} /></div><span ref={progressLabel}>The opening</span></div><span className="folio-instruction">{atEnd ? 'A new chapter awaits' : 'Scroll to explore'} <ArrowDownRight /></span></footer>
  </>
}

