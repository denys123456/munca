export function DemoAccountSwitcher({ accounts, currentAccountId, onChange }) {
  return (
    <label className="demo-account-switcher">
      <span>Demo account switcher</span>
      <select aria-label="Demo account switcher" value={currentAccountId} onChange={(event) => onChange(event.target.value)}>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} - {formatRole(account.role)}
          </option>
        ))}
      </select>
    </label>
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
