import { useMemo, useState } from 'react'
import { Activity, Building2, Edit3, Gift, HeartPulse, Medal, PackageCheck, Plus, ShieldCheck, Target, Trash2, Trophy, Users, X } from 'lucide-react'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'

export function AdminPage({ activePage, data }) {
  if (activePage === 'admin-users') {
    return <AdminTable title="Users" collection="users" icon={Users} rows={data.admin.users} data={data} />
  }
  if (activePage === 'admin-dealerships') {
    return <AdminTable title="Dealerships" collection="dealerships" icon={Building2} rows={data.admin.dealerships} data={data} />
  }
  if (activePage === 'admin-products') {
    return <AdminTable title="Financial products" collection="products" icon={PackageCheck} rows={productRows(data)} data={data} />
  }
  if (activePage === 'admin-point-rules') {
    return <AdminTable title="Point rules" collection="pointRules" icon={Medal} rows={data.admin.pointRules} data={data} />
  }
  if (activePage === 'admin-rewards') {
    return <AdminTable title="Reward catalog" collection="rewards" icon={Gift} rows={data.rewards} data={data} />
  }
  if (activePage === 'admin-gamification') {
    return <AdminSettings title="Gamification settings" icon={Trophy} items={['Bronze starts at 0 points', 'Silver starts at 1,200 points', 'Gold starts at 2,600 points']} />
  }
  if (activePage === 'admin-targets') {
    return <AdminSettings title="Target configuration" icon={Target} items={data.targets.map((target) => `${target.name}: ${target.status}`)} />
  }
  if (activePage === 'admin-health') {
    return <AdminSettings title="System health" icon={HeartPulse} items={data.admin.systemHealth.map((service) => `${service.service}: ${service.status} - ${service.detail}`)} />
  }
  if (activePage === 'admin-audit') {
    return <AdminSettings title="Audit / Activity" icon={Activity} items={['Reward catalog updated by John Doe', 'Target configuration reviewed', 'Financial product rule created']} />
  }
  if (activePage === 'admin-settings') {
    return <AdminSettings title="Platform settings" icon={ShieldCheck} items={['AI provider boundary: configured', 'ML fallback: enabled', 'DataGrip development workflow: documented']} />
  }
  return <AdminOverview data={data} />
}

function AdminOverview({ data }) {
  return (
    <div className="page-stack">
      <section className="kpi-grid">
        <KpiCard icon={Users} label="Users" value={data.admin.users.length} detail="Managed demo accounts" />
        <KpiCard icon={Building2} label="Dealerships" value={data.admin.dealerships.length} detail="Active network" />
        <KpiCard icon={PackageCheck} label="Products" value="4" detail="Eligible financial products" />
        <KpiCard icon={Gift} label="Rewards" value={data.rewards.length} detail="Catalog items" />
      </section>
      <AdminSettings title="Admin control center" icon={ShieldCheck} items={['Manage users and dealerships', 'Configure eligible products and point rules', 'Review gamification thresholds and target setup']} />
    </div>
  )
}

function AdminTable({ title, collection, icon: Icon, rows, data }) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [page, setPage] = useState(1)
  const keys = Object.keys(rows[0] ?? {})
  const totalPages = Math.max(1, Math.ceil(rows.length / 5))
  const pagedRows = rows.slice((page - 1) * 5, page * 5)
  const canMutate = ['users', 'dealerships', 'products', 'pointRules', 'rewards'].includes(collection)

  return (
    <div className="page-stack">
      <section className="admin-hero">
        <Icon aria-hidden="true" />
        <div>
          <span className="eyebrow">Admin</span>
          <h2>{title}</h2>
        </div>
      </section>
      <section className="panel table-panel">
        <SectionHeader
          eyebrow="Management"
          title={`${title} management`}
          action={canMutate && <button className="primary-action" type="button" onClick={() => setIsCreating(true)}><Plus aria-hidden="true" />Create</button>}
        />
        <div className="admin-table">
          {pagedRows.map((row, index) => (
            <article className="admin-row" key={title + index}>
              {keys.map((key) => <AdminCell name={key} value={row[key]} key={key} />)}
              {canMutate && (
                <div className="row-actions">
                  <button className="icon-button" type="button" aria-label={`Edit ${title} row`} onClick={() => setEditingRow(row)}>
                    <Edit3 aria-hidden="true" />
                  </button>
                  <button className="icon-button" type="button" aria-label={`Delete ${title} row`} onClick={() => deleteRow(collection, row, data)}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
        <div className="pagination">
          <button className="secondary-action" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="secondary-action" type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
        </div>
      </section>
      {canMutate && (isCreating || editingRow) && (
        <AdminForm
          collection={collection}
          data={data}
          initialRow={editingRow}
          onClose={() => {
            setIsCreating(false)
            setEditingRow(null)
          }}
          title={`${editingRow ? 'Edit' : 'Create'} ${title}`}
        />
      )}
    </div>
  )
}

function AdminCell({ name, value }) {
  return (
    <div>
      <span>{name}</span>
      {name === 'status' ? <StatusPill value={value} /> : <strong>{value}</strong>}
    </div>
  )
}

function AdminForm({ title, collection, data, initialRow, onClose }) {
  const defaults = useMemo(() => getFormDefaults(collection, initialRow), [collection, initialRow])
  const [form, setForm] = useState(defaults)
  const [status, setStatus] = useState({ type: 'idle', message: '' })

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submitForm(event) {
    event.preventDefault()
    if (!form.name?.trim()) {
      setStatus({ type: 'error', message: 'Name is required.' })
      return
    }
    if ((collection === 'rewards' || collection === 'products' || collection === 'pointRules') && Number(form.points) <= 0) {
      setStatus({ type: 'error', message: 'Points must be greater than zero.' })
      return
    }

    setStatus({ type: 'loading', message: 'Saving...' })
    try {
      if (collection === 'rewards') {
        if (initialRow) {
          data.actions.updateReward(initialRow.id, form)
        } else {
          await data.actions.createReward(form)
        }
      } else if (collection === 'products' || collection === 'pointRules') {
        if (initialRow) {
          data.actions.updateFinancialProduct(initialRow.product, form)
        } else {
          await data.actions.createFinancialProduct(form)
        }
      } else if (!initialRow && collection === 'users') {
        data.actions.createAdminRow('users', { name: form.name, email: form.email, role: form.role, status: form.status })
      } else if (!initialRow && collection === 'dealerships') {
        data.actions.createAdminRow('dealerships', { name: form.name, city: form.city, region: form.region, status: form.status })
      } else if (initialRow && collection === 'users') {
        data.actions.updateAdminRow('users', initialRow.email, { name: form.name, email: form.email, role: form.role, status: form.status })
      } else if (initialRow && collection === 'dealerships') {
        data.actions.updateAdminRow('dealerships', initialRow.name, { name: form.name, city: form.city, region: form.region, status: form.status })
      }
      setStatus({ type: 'success', message: initialRow ? 'Updated successfully.' : 'Created successfully.' })
      onClose()
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-panel admin-form" onSubmit={submitForm}>
        <SectionHeader
          eyebrow="Form"
          title={title}
          action={<button className="icon-button" type="button" aria-label="Close form" onClick={onClose}><X aria-hidden="true" /></button>}
        />
        <div className="form-grid">
          <label><span>Name</span><input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Enter name" /></label>
          {(collection === 'users') && <label><span>Email</span><input value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="name@example.com" /></label>}
          {(collection === 'users') && <label><span>Role</span><select value={form.role} onChange={(event) => updateField('role', event.target.value)}><option>SALES_ADVISOR</option><option>MANAGER</option><option>ADMIN</option></select></label>}
          {(collection === 'dealerships') && <label><span>City</span><input value={form.city} onChange={(event) => updateField('city', event.target.value)} placeholder="City" /></label>}
          {(collection === 'dealerships') && <label><span>Region</span><input value={form.region} onChange={(event) => updateField('region', event.target.value)} placeholder="Region" /></label>}
          {(collection === 'rewards') && <label><span>Category</span><input value={form.category} onChange={(event) => updateField('category', event.target.value)} placeholder="Category" /></label>}
          {(collection === 'products' || collection === 'pointRules' || collection === 'rewards') && <label><span>Points</span><input type="number" min="1" value={form.points} onChange={(event) => updateField('points', event.target.value)} placeholder="Points" /></label>}
          <label><span>Status</span><select value={form.status} onChange={(event) => updateField('status', event.target.value)}><option>Active</option><option>Inactive</option></select></label>
        </div>
        {status.message && <p className={`form-message ${status.type}`}>{status.message}</p>}
        <div className="modal-actions">
          <button className="secondary-action" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-action" type="submit">Save</button>
        </div>
      </form>
    </div>
  )
}

function AdminSettings({ title, icon: Icon, items }) {
  return (
    <section className="panel">
      <SectionHeader eyebrow="Configuration" title={title} />
      <div className="compact-list vertical">
        {items.map((item) => <div key={item}><Icon aria-hidden="true" /><span>{item}</span></div>)}
      </div>
    </section>
  )
}

function productRows(data) {
  return data.admin.pointRules.map((rule) => ({
    product: rule.product,
    points: rule.points,
    status: 'Active',
  }))
}

function getFormDefaults(collection, row) {
  if (collection === 'users') {
    return { name: row?.name ?? '', email: row?.email ?? '', role: row?.role ?? 'SALES_ADVISOR', status: row?.status ?? 'Active' }
  }
  if (collection === 'dealerships') {
    return { name: row?.name ?? '', city: row?.city ?? '', region: row?.region ?? '', status: row?.status ?? 'Active' }
  }
  if (collection === 'rewards') {
    return { name: row?.name ?? '', category: row?.category ?? '', points: row?.points ?? '', status: row?.status ?? 'Active' }
  }
  return { name: row?.product ?? row?.name ?? '', points: row?.points ?? '', reason: row?.reason ?? '', status: row?.status ?? 'Active' }
}

function deleteRow(collection, row, data) {
  if (collection === 'rewards') {
    data.actions.deleteReward(row.id)
    return
  }
  if (collection === 'products' || collection === 'pointRules') {
    data.actions.deleteAdminRow('pointRules', row.product)
    return
  }
  if (collection === 'users') {
    data.actions.deleteAdminRow('users', row.email)
    return
  }
  if (collection === 'dealerships') {
    data.actions.deleteAdminRow('dealerships', row.name)
  }
}
