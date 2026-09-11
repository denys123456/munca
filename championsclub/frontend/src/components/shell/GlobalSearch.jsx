import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { searchResults } from '../../product/searchResults.js'

export function GlobalSearch({ data, navigation, onNavigate }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const reference = useRef(null)
  const listId = useId()
  const results = useMemo(() => searchResults(data, navigation, query).slice(0, 8), [data, navigation, query])
  const open = query.trim().length > 0

  useEffect(() => {
    if (!open) return
    const dismiss = (event) => { if (!reference.current?.contains(event.target)) setQuery('') }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  function openResult(result) {
    if (!result) return
    onNavigate(result.page, result.advisorId)
    setQuery('')
  }

  function keyboard(event) {
    if (event.key === 'Escape') { setQuery(''); return }
    if (!open || !results.length) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index + (event.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length)
    }
    if (event.key === 'Enter') { event.preventDefault(); openResult(results[activeIndex]) }
  }

  return <div className="global-search" ref={reference} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setQuery('') }}>
    <Search aria-hidden="true" />
    <input role="combobox" aria-label="Search ChampionsClub" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={open && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
      autoComplete="off" value={query} placeholder="Search your workspace" onChange={(event) => { setQuery(event.target.value); setActiveIndex(0) }} onKeyDown={keyboard} />
    {query && <button className="search-clear" aria-label="Clear search" onClick={() => setQuery('')}><X /></button>}
    {open && <div className="search-panel" role="listbox" aria-label="Search results" id={listId}>
      {results.length ? results.map((result, index) => <button role="option" aria-selected={index === activeIndex} id={`${listId}-${index}`} key={`${result.type}-${result.label}`} className={index === activeIndex ? 'is-active' : ''} onClick={() => openResult(result)}>
        <span>{result.type}</span><strong>{result.label}</strong><small>{result.detail}</small><ArrowUpRight />
      </button>) : <p className="search-empty">No results for “{query}”. Try a name, page or reward.</p>}
    </div>}
  </div>
}
