import { SaleForm } from './SaleForm.jsx'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { formatCurrency } from '../../product/formatters.js'

export function SalesActivityPage({ data }) {
  const [query, setQuery] = useState('')
  const [product, setProduct] = useState('All')
  const [page, setPage] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const products = useMemo(() => ['All', ...new Set(data.salesHistory.map((sale) => sale.product))], [data.salesHistory])
  const sales = data.salesHistory.filter((sale) => {
    if (data.currentUser.role === 'SALES_ADVISOR' && sale.advisorId !== data.currentUser.advisorId && sale.advisor !== data.currentUser.name) return false
    const matchesQuery = `${sale.advisor} ${sale.product} ${sale.status} ${sale.date}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (product === 'All' || sale.product === product)
  })
  const totalPages = Math.max(1, Math.ceil(sales.length / 5))
  const visibleSales = sales.slice((page - 1) * 5, page * 5)

  return (
    <div className="page-stack">
      <section className="panel table-panel">
        <SectionHeader
          eyebrow="Activity"
          title="Sales history and dealership activity"
          action={<button className="primary-action" type="button" onClick={() => setIsCreating(true)}><Plus aria-hidden="true" />Record sale</button>}
        />
        <ActivityFilters product={product} products={products} query={query} setPage={setPage} setProduct={setProduct} setQuery={setQuery} />
        <div className="premium-table">
          <div className="premium-table-head">
            <span>Advisor</span>
            <span>Product</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          {visibleSales.map((sale) => (
            <div className="premium-table-row" key={sale.id}>
              <strong>{sale.advisor}</strong>
              <span>{sale.product}</span>
              <span>{formatCurrency(sale.amount)}</span>
              <StatusPill value={sale.status} />
              <small>{sale.date}</small>
            </div>
          ))}
        </div>
        {sales.length === 0 && <p className="soft-copy">No sales match your filters.</p>}
        <div className="pagination">
          <button className="secondary-action" type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="secondary-action" type="button" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
        </div>
      </section>
      {isCreating && <SaleForm data={data} onClose={() => setIsCreating(false)} />}
    </div>
  )
}

function ActivityFilters({ product, products, query, setPage, setProduct, setQuery }) {
  return (
    <div className="filter-box">
      <Search aria-hidden="true" />
      <input
        aria-label="Search sales"
        placeholder="Search sales"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setPage(1)
        }}
      />
      <SlidersHorizontal aria-hidden="true" />
      <select
        aria-label="Filter product"
        value={product}
        onChange={(event) => {
          setProduct(event.target.value)
          setPage(1)
        }}
      >
        {products.map((item) => <option key={item}>{item}</option>)}
      </select>
    </div>
  )
}


