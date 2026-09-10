export function Sidebar({ account, activePage, navigation, onNavigate }) {
  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="brand-lockup">
        <div className="brand-symbol" aria-hidden="true">
          <span />
        </div>
        <div className="brand-copy">
          <strong>ChampionsClub</strong>
          <span>Performance Intelligence</span>
        </div>
      </div>
      <nav className="main-navigation" aria-label="Main navigation">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <button
              aria-current={activePage === item.page ? 'page' : undefined}
              className={activePage === item.page ? 'is-route-active' : ''}
              key={item.page}
              onClick={() => onNavigate(item.page)}
              title={item.label}
              type="button"
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="rail-profile">
        <div className="avatar">{account.avatar}</div>
        <div>
          <strong>{account.name}</strong>
          <span>{formatRole(account.role)}</span>
        </div>
      </div>
    </aside>
  )
}

function formatRole(role) {
  if (role === 'SALES_ADVISOR') {
    return 'Sales Advisor'
  }
  if (role === 'ADMIN') {
    return 'Administrator'
  }
  return 'Manager'
}
