import { Search, SlidersHorizontal } from 'lucide-react'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { formatCurrency } from '../../product/formatters.js'

export function SalesActivityPage({ data }) {
  return (
    <div className="page-stack">
      <section className="panel table-panel">
        <SectionHeader eyebrow="Activity" title="Sales history and dealership activity" action={<ActivityFilters />} />
        <div className="premium-table">
          <div className="premium-table-head">
            <span>Advisor</span>
            <span>Product</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          {data.salesHistory.map((sale) => (
            <div className="premium-table-row" key={sale.advisor + sale.product + sale.date}>
              <strong>{sale.advisor}</strong>
              <span>{sale.product}</span>
              <span>{formatCurrency(sale.amount)}</span>
              <StatusPill value={sale.status} />
              <small>{sale.date}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ActivityFilters() {
  return (
    <div className="filter-box">
      <Search aria-hidden="true" />
      <span>September cycle</span>
      <SlidersHorizontal aria-hidden="true" />
    </div>
  )
}

