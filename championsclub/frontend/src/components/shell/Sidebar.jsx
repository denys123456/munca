import { LogIn } from 'lucide-react'
import { Brand } from './Brand.jsx'

export function Sidebar({ account, activePage, navigation, onNavigate }) {
  return <aside className="sidebar" aria-label="Primary navigation">
    <Brand compact />
    <nav className="main-navigation" aria-label="Main navigation">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = activePage === item.page || (activePage === 'advisor-detail' && item.page === 'advisors')
        return <a href={`#${item.page}`} aria-label={item.label} aria-current={isActive ? 'page' : undefined}
          className={isActive ? 'is-route-active' : ''} key={item.page} title={item.label}
          onClick={(event) => { event.preventDefault(); onNavigate(item.page) }}>
          <Icon aria-hidden="true" /><span>{item.label}</span>
        </a>
      })}
    </nav>
    <div className="rail-bottom"><span className="rail-edition"><LogIn /><span>CHAMPIONSCLUB / 01</span></span>
      <button className="rail-profile" type="button" title="Your profile" aria-label="Your profile" onClick={() => onNavigate('profile')}>
        <span className="avatar">{account.avatar}</span><span className="rail-profile-copy"><strong>{account.name}</strong><small>{account.title}</small></span>
      </button>
    </div>
  </aside>
}
