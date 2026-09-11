import { useState } from 'react'
import { Edit3, Plus, Search, Trash2 } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { getRowKey } from '../../product/catalogActions.js'
import { AdminForm } from './AdminForm.jsx'
import { catalogSchema, collectionRows } from './catalogSchema.js'

export function AdminTable({ collection, data }) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const schema = catalogSchema[collection]
  const rows = collectionRows(data, collection).filter((row) => schema.fields.some((field) => String(row[field.key] ?? row.product ?? '').toLowerCase().includes(query.toLowerCase())))
  const totalPages = Math.max(1, Math.ceil(rows.length / 5))
  const currentPage = Math.min(page, totalPages)
  const canManage = data.connectionState !== 'live'
  const canCreate = canManage || ['rewards', 'products', 'pointRules'].includes(collection)
  async function remove() {
    try {
      if (collection === 'rewards') data.actions.deleteReward(deleting.id)
      else data.actions.deleteAdminRow(collection === 'products' ? 'pointRules' : collection, getRowKey(deleting))
      setDeleting(null)
    } catch (failure) { setError(failure.message) }
  }
  return <div className="page-stack">
    <section className="panel table-panel"><SectionHeader eyebrow="PROGRAM DIRECTORY" title={schema.title} action={canCreate && <button className="primary-action" onClick={() => setEditing({})}><Plus />Create</button>} />
      <label className="filter-box"><Search /><input aria-label={`Search ${schema.title.toLowerCase()}`} placeholder={`Search ${schema.title.toLowerCase()}`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></label>
      <div className="admin-table">{rows.slice((currentPage - 1) * 5, currentPage * 5).map((row) => <article className="admin-row" key={getRowKey(row)}>
        {schema.fields.map((field) => <div key={field.key}><span>{field.label}</span>{field.key === 'status' ? <StatusPill value={row.status ?? 'Active'} /> : <strong>{field.key === 'name' ? row.name ?? row.product : row[field.key]}</strong>}</div>)}
        {canManage && <div className="row-actions"><button className="icon-button" aria-label={`Edit ${row.name ?? row.product}`} onClick={() => setEditing(row)}><Edit3 /></button><button className="icon-button" aria-label={`Delete ${row.name ?? row.product}`} onClick={() => { setError(''); setDeleting(row) }}><Trash2 /></button></div>}
      </article>)}</div>
      {rows.length === 0 && <div className="empty-state"><Search /><strong>{query ? 'No results found.' : 'A fresh start.'}</strong><p>{query ? 'Try a different search.' : 'Create the first entry in this collection.'}</p>{query && <button className="secondary-action" onClick={() => setQuery('')}>Clear search</button>}</div>}
      <div className="pagination"><button className="secondary-action" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {totalPages} / {rows.length} entries</span><button className="secondary-action" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button></div>
    </section>
    {editing && <AdminForm collection={collection} row={editing} data={data} onClose={() => setEditing(null)} />}
    {deleting && <Dialog title="Remove this entry?" onClose={() => setDeleting(null)}><p className="soft-copy"><strong>{deleting.name ?? deleting.product}</strong> will be removed from {schema.title.toLowerCase()}. Existing activity records will be preserved.</p>{error && <p role="alert" className="form-message error">{error}</p>}<div className="modal-actions"><button className="secondary-action" onClick={() => setDeleting(null)}>Cancel</button><button className="primary-action danger-action" onClick={remove}>Delete entry</button></div></Dialog>}
  </div>
}
