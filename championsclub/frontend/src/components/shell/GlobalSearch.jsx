import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'

export function GlobalSearch({ data, navigation, onNavigate, onSelectAdvisor }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const panelRef = useRef(null)
  const results = useMemo(() => buildSearchResults(data, navigation, query), [data, navigation, query])
  const isOpen = query.trim().length > 0

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    function onDocumentPointerDown(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setQuery('')
      }
    }

    document.addEventListener('pointerdown', onDocumentPointerDown)
    return () => document.removeEventListener('pointerdown', onDocumentPointerDown)
  }, [])

  function openResult(result) {
    if (!result) {
      return
    }
    if (result.advisorId) {
      onSelectAdvisor(result.advisorId)
    }
    onNavigate(result.page)
    setQuery('')
  }

  function handleKeyDown(event) {
    if (!isOpen || results.length === 0) {
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % results.length)
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + results.length) % results.length)
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      openResult(results[activeIndex])
    }
    if (event.key === 'Escape') {
      setQuery('')
    }
  }

  return (
    <div className="global-search" ref={panelRef}>
      <Search aria-hidden="true" />
      <input
        aria-label="Search ChampionsClub"
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search advisors, rewards, products, pages"
        value={query}
      />
      {query && (
        <button className="search-clear" type="button" aria-label="Clear search" onClick={() => setQuery('')}>
          <X aria-hidden="true" />
        </button>
      )}
      {isOpen && (
        <div className="search-panel" role="listbox">
          {results.length === 0 ? (
            <div className="search-empty">No matching results</div>
          ) : results.slice(0, 8).map((result, index) => (
            <button
              className={index === activeIndex ? 'is-active' : ''}
              key={`${result.type}-${result.label}-${index}`}
              onClick={() => openResult(result)}
              role="option"
              type="button"
            >
              <span>{result.type}</span>
              <strong>{result.label}</strong>
              <small>{result.detail}</small>
              <ArrowRight aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function buildSearchResults(data, navigation, query) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return []
  }

  const pageResults = navigation.map((item) => ({
    type: 'Page',
    label: item.label,
    detail: item.title,
    page: item.page,
  }))
  const advisorResults = data.advisors.map((advisor) => ({
    type: 'Advisor',
    label: advisor.name,
    detail: `${advisor.title} - ${advisor.status} - ${advisor.risk} risk`,
    page: 'advisor-detail',
    advisorId: advisor.id,
  }))
  const dealershipResults = [data.dealership].map((dealership) => ({
    type: 'Dealership',
    label: dealership.name,
    detail: `${dealership.city}, ${dealership.region}`,
    page: 'overview',
  }))
  const rewardResults = data.rewards.map((reward) => ({
    type: 'Reward',
    label: reward.name,
    detail: `${reward.category} - ${reward.points} points`,
    page: 'rewards',
  }))
  const productResults = data.admin.pointRules.map((rule) => ({
    type: 'Financial product',
    label: rule.product,
    detail: `${rule.points} pts / EUR 1k`,
    page: data.currentUser.role === 'ADMIN' ? 'admin-products' : 'dealership-activity',
  }))

  return [...pageResults, ...advisorResults, ...dealershipResults, ...rewardResults, ...productResults].filter((result) => (
    `${result.type} ${result.label} ${result.detail}`.toLowerCase().includes(normalizedQuery)
  ))
}
