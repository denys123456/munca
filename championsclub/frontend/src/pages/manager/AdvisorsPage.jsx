import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { formatCurrency } from '../../product/formatters.js'

export function AdvisorsPage({ data, setActivePage, setSelectedAdvisorId }) {
  const [searchText, setSearchText] = useState('')
  const advisors = data.advisors.filter((advisor) => advisor.name.toLowerCase().includes(searchText.toLowerCase()))

  function openAdvisor(advisorId) {
    setSelectedAdvisorId(advisorId)
    setActivePage('advisor-detail')
  }

  return (
    <div className="page-stack">
      <section className="panel table-panel">
        <SectionHeader
          eyebrow="Portfolio"
          title="Advisor performance portfolio"
          action={<FilterBox searchText={searchText} setSearchText={setSearchText} />}
        />
        <div className="advisor-table">
          {advisors.map((advisor) => (
            <button className="advisor-row" key={advisor.id} onClick={() => openAdvisor(advisor.id)} type="button">
              <div>
                <strong>{advisor.name}</strong>
                <span>{advisor.title}</span>
              </div>
              <div>{formatCurrency(advisor.sales)}</div>
              <ProgressBar label="Target" value={advisor.sales * 100 / advisor.target} />
              <StatusPill value={advisor.level} />
              <StatusPill value={advisor.risk} />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function FilterBox({ searchText, setSearchText }) {
  return (
    <div className="filter-box">
      <Search aria-hidden="true" />
      <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search advisors" />
      <SlidersHorizontal aria-hidden="true" />
    </div>
  )
}

