import { Activity, Building2, Gift, HeartPulse, Medal, PackageCheck, ShieldCheck, Target, Trophy, Users } from 'lucide-react'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'

export function AdminPage({ activePage, data }) {
  if (activePage === 'admin-users') {
    return <AdminTable title="Users" icon={Users} rows={data.admin.users} />
  }
  if (activePage === 'admin-dealerships') {
    return <AdminTable title="Dealerships" icon={Building2} rows={data.admin.dealerships} />
  }
  if (activePage === 'admin-products') {
    return <AdminTable title="Financial products" icon={PackageCheck} rows={productRows(data)} />
  }
  if (activePage === 'admin-point-rules') {
    return <AdminTable title="Point rules" icon={Medal} rows={data.admin.pointRules} />
  }
  if (activePage === 'admin-rewards') {
    return <AdminTable title="Reward catalog" icon={Gift} rows={data.rewards} />
  }
  if (activePage === 'admin-gamification') {
    return <AdminSettings title="Gamification settings" icon={Trophy} items={['Bronze starts at 0 points', 'Silver starts at 1,200 points', 'Gold starts at 2,600 points']} />
  }
  if (activePage === 'admin-targets') {
    return <AdminTable title="Target configuration" icon={Target} rows={data.targets} />
  }
  if (activePage === 'admin-health') {
    return <AdminTable title="System health" icon={HeartPulse} rows={data.admin.systemHealth} />
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

function AdminTable({ title, icon: Icon, rows }) {
  const keys = Object.keys(rows[0] ?? {})

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
        <SectionHeader eyebrow="Management" title={`${title} management`} action={<button className="primary-action" type="button">Create</button>} />
        <div className="admin-table">
          {rows.map((row, index) => (
            <article className="admin-row" key={title + index}>
              {keys.map((key) => <AdminCell name={key} value={row[key]} key={key} />)}
            </article>
          ))}
        </div>
      </section>
      <AdminForm title={`Create ${title}`} />
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

function AdminForm({ title }) {
  return (
    <section className="panel admin-form">
      <SectionHeader eyebrow="Form" title={title} />
      <div className="form-grid">
        <label><span>Name</span><input placeholder="Enter name" /></label>
        <label><span>Status</span><select><option>Active</option><option>Inactive</option></select></label>
        <label><span>Owner</span><input placeholder="Assign owner" /></label>
        <button className="primary-action" type="button">Save draft</button>
      </div>
    </section>
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
