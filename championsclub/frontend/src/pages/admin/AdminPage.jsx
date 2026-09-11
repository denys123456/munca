import { Building2, Gift, PackageCheck, ShieldCheck, Users, ArrowUpRight } from 'lucide-react'
import { KpiCard } from '../../components/ui/KpiCard.jsx'
import { AdminTable } from './AdminTable.jsx'
import { ProgramSettings } from './ProgramSettings.jsx'
import { OperationsPage } from './OperationsPage.jsx'
import { TargetsPage } from '../shared/TargetsPage.jsx'

const collections = { 'admin-users': 'users', 'admin-dealerships': 'dealerships', 'admin-products': 'products', 'admin-point-rules': 'pointRules', 'admin-rewards': 'rewards' }

export function AdminPage({ activePage, data, setActivePage }) {
  if (collections[activePage]) return <AdminTable collection={collections[activePage]} data={data} />
  if (activePage === 'admin-targets') return <TargetsPage data={data} role="ADMIN" />
  if (activePage === 'admin-gamification' || activePage === 'admin-settings') return <ProgramSettings data={data} gamification={activePage === 'admin-gamification'} />
  if (activePage === 'admin-health' || activePage === 'admin-audit') return <OperationsPage data={data} audit={activePage === 'admin-audit'} />
  const areas = [
    { page: 'admin-users', icon: Users, title: 'People & permissions', detail: 'Build the network behind the performance.' },
    { page: 'admin-products', icon: PackageCheck, title: 'Products & point rules', detail: 'Make every eligible sale count.' },
    { page: 'admin-rewards', icon: Gift, title: 'The reward collection', detail: 'Give great performance a worthy reward.' },
    { page: 'admin-gamification', icon: ShieldCheck, title: 'The membership standard', detail: 'Define the path from Bronze to Gold.' }
  ]
  return <div className="page-stack admin-page">
    <section className="editorial-heading"><div><span className="eyebrow">THE FOUNDATION OF PERFORMANCE</span><h2>A stronger program.<br /><span>By design.</span></h2></div><p>One connected view of the people, products and incentives that drive ChampionsClub.</p></section>
    <section className="kpi-grid"><KpiCard icon={Users} label="Program users" value={data.admin.users.length} detail="People in your directory" /><KpiCard icon={Building2} label="Dealerships" value={data.admin.dealerships.length} detail="A connected network" /><KpiCard icon={PackageCheck} label="Financial products" value={data.admin.pointRules.filter((item) => item.status !== 'Inactive').length} detail="Active earning opportunities" /><KpiCard icon={Gift} label="Curated rewards" value={data.rewards.length} detail="Recognition with purpose" tone="warning" /></section>
    <section className="admin-destinations">{areas.map(({ icon: Icon, ...area }, index) => <button key={area.page} onClick={() => setActivePage(area.page)}><span className="destination-index">0{index + 1}</span><Icon /><h3>{area.title}</h3><p>{area.detail}</p><ArrowUpRight /></button>)}</section>
  </div>
}
