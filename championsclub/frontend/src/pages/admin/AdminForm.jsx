import { useState } from 'react'
import { Dialog } from '../../components/ui/Dialog.jsx'
import { catalogSchema, formDefaults } from './catalogSchema.js'

export function AdminForm({ collection, row, data, onClose }) {
  const [form, setForm] = useState(() => formDefaults(collection, row))
  const [status, setStatus] = useState({ pending: false, error: '' })
  const schema = catalogSchema[collection]
  const isEditing = Boolean(row.name || row.product)
  async function submit(event) {
    event.preventDefault()
    if (status.pending) return
    setStatus({ pending: true, error: '' })
    try {
      if (collection === 'rewards') {
        if (isEditing) data.actions.updateReward(row.id, form)
        else await data.actions.createReward(form)
      } else if (collection === 'products' || collection === 'pointRules') {
        if (isEditing) data.actions.updateFinancialProduct(row.product, form)
        else await data.actions.createFinancialProduct(form)
      } else {
        if (isEditing) data.actions.updateAdminRow(collection, row.email ?? row.name, form)
        else data.actions.createAdminRow(collection, form)
      }
      onClose()
    } catch (error) { setStatus({ pending: false, error: error.message }) }
  }
  return <Dialog title={`${isEditing ? 'Edit' : 'Create'} ${schema.title.toLowerCase()}`} onClose={onClose}><form onSubmit={submit}>
    <div className="form-grid">{schema.fields.map((field) => <label key={field.key}><span>{field.label}</span>
      {field.options ? <select value={form[field.key]} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input required type={field.type ?? 'text'} min={field.min} step={field.type === 'number' ? 1 : undefined} maxLength={field.type === 'number' ? undefined : 140} value={form[field.key]} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />}
    </label>)}</div>
    {status.error && <p className="form-message error" role="alert">{status.error}</p>}
    <div className="modal-actions"><button type="button" className="secondary-action" onClick={onClose}>Cancel</button><button className="primary-action" disabled={status.pending}>{status.pending ? 'Saving…' : 'Save'}</button></div>
  </form></Dialog>
}
