const status = { key: 'status', label: 'Status', options: ['Active', 'Inactive'] }
const name = { key: 'name', label: 'Name' }
const points = { key: 'points', label: 'Points', type: 'number', min: 1 }

export const catalogSchema = {
  users: { title: 'Users', fields: [name, { key: 'email', label: 'Email', type: 'email' }, { key: 'role', label: 'Role', options: ['SALES_ADVISOR', 'MANAGER', 'ADMIN'] }, status] },
  dealerships: { title: 'Dealerships', fields: [name, { key: 'city', label: 'City' }, { key: 'region', label: 'Region' }, status] },
  rewards: { title: 'Reward catalog', fields: [name, { key: 'category', label: 'Category' }, points, status] },
  products: { title: 'Financial products', fields: [name, points, { key: 'reason', label: 'Purpose' }, status] },
  pointRules: { title: 'Point rules', fields: [name, points, { key: 'reason', label: 'Purpose' }, status] }
}

export function collectionRows(data, collection) {
  if (collection === 'rewards') return data.rewards
  if (collection === 'products' || collection === 'pointRules') return data.admin.pointRules
  return data.admin[collection]
}

export function formDefaults(collection, row) {
  return Object.fromEntries(catalogSchema[collection].fields.map((field) => [field.key, field.key === 'name' ? row?.name ?? row?.product ?? '' : row?.[field.key] ?? field.options?.[0] ?? '']))
}
