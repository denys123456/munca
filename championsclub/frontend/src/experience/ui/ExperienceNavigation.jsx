import { useState } from 'react'
import { ArrowUpRight, ChevronDown, X } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog.jsx'

export function ExperienceNavigation({ account, accounts, data, workspaceOpen, onExperience, onWorkspace, onChangeAccount }) {
  const [accountsOpen, setAccountsOpen] = useState(false)
  return <header className={`experience-navigation ${workspaceOpen ? 'in-workspace' : ''}`}>
    <button className="experience-brand" onClick={onExperience} aria-label="ChampionsClub experience">CHAMPIONSCLUB<span>®</span></button>
    <span className="navigation-edition">THE ENGINEERING OF PERFORMANCE</span>
    <div className="navigation-actions"><button className="account-toggle" onClick={() => setAccountsOpen(true)} aria-label="Choose demo account"><i />{account.name}<ChevronDown /></button><button className="workspace-toggle" onClick={workspaceOpen ? onExperience : () => onWorkspace()}>{workspaceOpen ? 'EXPERIENCE' : 'WORKSPACE'}{workspaceOpen ? <X /> : <ArrowUpRight />}</button></div>
    {accountsOpen && <Dialog title="Your perspective" onClose={() => setAccountsOpen(false)} className="account-dialog"><p className="account-dialog-intro">One system. A different point of view.</p><div className="account-options">{accounts.map((item) => <button key={item.id} aria-pressed={item.id === account.id} onClick={() => { onChangeAccount(item.id); setAccountsOpen(false) }}><span className="account-initials">{item.avatar}</span><span><strong>{item.name}</strong><small>{item.role === 'ADMIN' ? 'Administrator' : item.role === 'MANAGER' ? 'Manager' : 'Sales Advisor'}</small></span><span>{item.id === account.id ? 'CONNECTED' : '↗'}</span></button>)}</div><label className="sr-only">Demo account switcher<select aria-label="Demo account switcher" value={account.id} onChange={(event) => { onChangeAccount(event.target.value); setAccountsOpen(false) }}>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.title}</option>)}</select></label><span className="account-source">{data.connectionState === 'live' ? 'CONNECTED API' : 'PERSISTENT DEMO WORKSPACE'} / DISTINCT ACCOUNT IDENTITIES</span></Dialog>}
  </header>
}
