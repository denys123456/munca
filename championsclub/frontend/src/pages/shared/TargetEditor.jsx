import { useState } from 'react'
import { Dialog } from '../../components/ui/Dialog.jsx'

export function TargetEditor({ target, data, onClose }) {
  const [form, setForm] = useState({ name: target.name ?? '', owner: target.owner ?? 'Dealership', advisorId: target.advisorId ?? data.advisors[0]?.id, amount: target.amount ?? '', actual: target.actual ?? 0, status: target.status ?? 'ACTIVE', endDate: target.endDate ? new Date(target.endDate).toISOString().slice(0, 10) : '2026-09-30' })
  const [error, setError] = useState('')
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  function submit(event) {
    event.preventDefault()
    try {
      const patch = { ...form, advisorId: form.owner === 'Advisor' ? Number(form.advisorId) : undefined }
      if (target.name) data.actions.updateTarget(target.name, patch)
      else data.actions.createTarget(patch)
      onClose()
    } catch (failure) { setError(failure.message) }
  }
  return <Dialog title={target.name ? 'Edit target' : 'Create target'} onClose={onClose}>
    <form onSubmit={submit}>
      <div className="form-grid">
        <label><span>Target name</span><input required value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
        <label><span>Owner</span><select value={form.owner} onChange={(event) => update('owner', event.target.value)}><option>Dealership</option><option>Advisor</option><option>Product</option></select></label>
        {form.owner === 'Advisor' && <label><span>Advisor</span><select value={form.advisorId} onChange={(event) => update('advisorId', event.target.value)}>{data.advisors.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisor.name}</option>)}</select></label>}
        <label><span>Target amount</span><input required type="number" min="1" step="0.01" value={form.amount} onChange={(event) => update('amount', event.target.value)} /></label>
        {target.name && <label><span>Actual amount</span><input required type="number" min="0" step="0.01" value={form.actual} onChange={(event) => update('actual', event.target.value)} /></label>}
        <label><span>Status</span><select value={form.status} onChange={(event) => update('status', event.target.value)}><option>ACTIVE</option><option>COMPLETED</option><option>PAUSED</option></select></label>
        <label><span>End date</span><input required type="date" value={form.endDate} onChange={(event) => update('endDate', event.target.value)} /></label>
      </div>
      {error && <p role="alert" className="form-message error">{error}</p>}
      <div className="modal-actions"><button type="button" className="secondary-action" onClick={onClose}>Cancel</button><button className="primary-action">Save target</button></div>
    </form>
  </Dialog>
}
