import { useState } from 'react'
import { Dialog } from '../../components/ui/Dialog.jsx'

export function SaleForm({ data, onClose }) {
  const advisors = data.currentUser.role === 'SALES_ADVISOR' ? data.advisors.filter((advisor) => advisor.id === data.currentUser.advisorId) : data.advisors
  const products = data.admin.pointRules.filter((product) => product.status !== 'Inactive')
  const [form, setForm] = useState({ advisorId: advisors[0]?.id ?? '', product: products[0]?.product ?? '', amount: '', date: new Date().toISOString().slice(0, 10) })
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  async function submit(event) {
    event.preventDefault()
    if (status.type === 'loading') return
    setStatus({ type: 'loading', message: 'Recording sale…' })
    try { await data.actions.createSale(form); onClose() }
    catch (error) { setStatus({ type: 'error', message: error.message }) }
  }
  return <Dialog title="Record a sale" onClose={onClose}><form onSubmit={submit}>
    <p className="soft-copy form-introduction">Every eligible sale builds your performance and earns points automatically.</p>
    <div className="form-grid">
      <label><span>Advisor</span><select required value={form.advisorId} onChange={(event) => update('advisorId', event.target.value)}>{advisors.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisor.name}</option>)}</select></label>
      <label><span>Product</span><select required value={form.product} onChange={(event) => update('product', event.target.value)}>{products.map((product) => <option key={product.id} value={product.product}>{product.product}</option>)}</select></label>
      <label><span>Amount</span><input required type="number" min="1" step="0.01" value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="Financed amount in EUR" /></label>
      <label><span>Date</span><input required type="date" max={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(event) => update('date', event.target.value)} /></label>
    </div>
    {status.message && <p role="status" className={`form-message ${status.type}`}>{status.message}</p>}
    <div className="modal-actions"><button className="secondary-action" type="button" onClick={onClose}>Cancel</button><button className="primary-action" disabled={status.type === 'loading' || !products.length}>{status.type === 'loading' ? 'Recording…' : 'Record sale'}</button></div>
  </form></Dialog>
}
