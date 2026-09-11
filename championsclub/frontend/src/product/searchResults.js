export function searchResults(data, navigation, query) {
  const search = query.trim().toLowerCase()
  if (!search) return []
  const role = data.currentUser.role
  const pages = navigation.map((item) => ({ type: 'Page', label: item.label, detail: item.title, page: item.page }))
  const advisors = role === 'MANAGER' ? data.advisors.map((advisor) => ({ type: 'Advisor', label: advisor.name, detail: `${advisor.title} / ${advisor.risk} risk`, page: 'advisor-detail', advisorId: advisor.id })) : role === 'ADMIN' ? data.admin.users.map((user) => ({ type: 'User', label: user.name, detail: user.email, page: 'admin-users' })) : []
  const rewards = data.rewards.map((reward) => ({ type: 'Reward', label: reward.name, detail: `${reward.category} / ${reward.points} points`, page: role === 'ADMIN' ? 'admin-rewards' : 'rewards' }))
  const products = data.admin.pointRules.map((product) => ({ type: 'Product', label: product.product, detail: `${product.points} points per EUR 1,000`, page: role === 'ADMIN' ? 'admin-products' : role === 'MANAGER' ? 'dealership-activity' : 'sales-history' }))
  const dealerships = (role === 'ADMIN' ? data.admin.dealerships : [data.dealership]).map((item) => ({ type: 'Dealership', label: item.name, detail: `${item.city}, ${item.region}`, page: role === 'ADMIN' ? 'admin-dealerships' : 'overview' }))
  return [...pages, ...advisors, ...rewards, ...products, ...dealerships].filter((item) => `${item.label} ${item.detail} ${item.type}`.toLowerCase().includes(search))
}
