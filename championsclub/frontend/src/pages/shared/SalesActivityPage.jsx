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
            <div className="premium-table-row" key={sale.advisor + sale.product + sale.date}>
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
          <button className="secondary-action" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="secondary-action" type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
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

function SaleForm({ data, onClose }) {
  const [form, setForm] = useState({
    advisorId: data.advisors[0]?.id ?? 1,
    product: data.admin.pointRules[0]?.product ?? 'Classic Financing',
    productId: 1,
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const [status, setStatus] = useState({ type: 'idle', message: '' })

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submitSale(event) {
    event.preventDefault()
    if (Number(form.amount) <= 0) {
      setStatus({ type: 'error', message: 'Sale amount must be greater than zero.' })
      return
    }
    setStatus({ type: 'loading', message: 'Recording sale...' })
    try {
      await data.actions.createSale(form)
      setStatus({ type: 'success', message: 'Sale recorded.' })
      window.setTimeout(onClose, 420)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-panel" onSubmit={submitSale}>
        <SectionHeader eyebrow="Sale" title="Record sale" />
        <div className="form-grid">
          <label><span>Advisor</span><select value={form.advisorId} onChange={(event) => updateField('advisorId', event.target.value)}>{data.advisors.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisor.name}</option>)}</select></label>
          <label><span>Product</span><select value={form.product} onChange={(event) => {
            const selectedIndex = data.admin.pointRules.findIndex((rule) => rule.product === event.target.value)
            setForm((current) => ({ ...current, product: event.target.value, productId: selectedIndex + 1 }))
          }}>{data.admin.pointRules.map((rule, index) => <option key={rule.product} value={rule.product}>{index + 1}. {rule.product}</option>)}</select></label>
          <label><span>Amount</span><input type="number" min="1" value={form.amount} onChange={(event) => updateField('amount', event.target.value)} placeholder="Financed amount" /></label>
          <label><span>Date</span><input type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} /></label>
        </div>
        {status.message && <p className={`form-message ${status.type}`}>{status.message}</p>}
        <div className="modal-actions">
          <button className="secondary-action" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-action" type="submit">Record sale</button>
        </div>
      </form>
    </div>
  )
}
