export function catalogActions({ getState, commit, requireAdmin, requireDemo, post }) {
  function updateCollection(collection, transform, message) {
    requireAdmin()
    requireDemo()
    commit((state) => ({ ...state, admin: { ...state.admin, [collection]: transform(state.admin[collection]) } }), message)
  }

  function validateName(name) {
    if (!name?.trim()) throw new Error('Name is required.')
  }

  function validatePoints(points) {
    if (!Number.isInteger(Number(points)) || Number(points) <= 0) throw new Error('Points must be a positive whole number.')
  }

  return {
    async createReward(form) {
      requireAdmin()
      validateName(form.name)
      validatePoints(form.points)
      if (!form.category?.trim()) throw new Error('Category is required.')
      if (getState().rewards.some((item) => item.name.toLowerCase() === form.name.trim().toLowerCase())) throw new Error('A reward with that name already exists.')
      const response = await post('/api/admin/catalog/rewards', { name: form.name.trim(), category: form.category.trim(), requiredPoints: Number(form.points) })
      const reward = { id: response?.id ?? crypto.randomUUID(), name: form.name.trim(), category: form.category.trim(), points: Number(form.points), status: 'Active' }
      commit((state) => ({ ...state, rewards: [reward, ...state.rewards] }), 'Reward added to the collection.')
    },
    updateReward(id, form) {
      requireAdmin()
      requireDemo()
      validateName(form.name)
      validatePoints(form.points)
      commit((state) => ({ ...state, rewards: state.rewards.map((item) => item.id === id ? { ...item, ...form, name: form.name.trim(), points: Number(form.points) } : item) }), 'Reward updated.')
    },
    deleteReward(id) {
      requireAdmin()
      requireDemo()
      commit((state) => ({ ...state, rewards: state.rewards.filter((item) => item.id !== id) }), 'Reward removed from the collection.')
    },
    async createFinancialProduct(form) {
      requireAdmin()
      validateName(form.name)
      validatePoints(form.points)
      if (getState().admin.pointRules.some((item) => item.product.toLowerCase() === form.name.trim().toLowerCase())) throw new Error('A product with that name already exists.')
      const response = await post('/api/admin/catalog/financial-products', { name: form.name.trim(), pointsPerThousandEuro: Number(form.points), isEligible: form.status === 'Active' })
      const product = { id: response?.id ?? crypto.randomUUID(), product: form.name.trim(), points: Number(form.points), reason: form.reason || 'Program incentive', status: form.status }
      commit((state) => ({ ...state, admin: { ...state.admin, pointRules: [product, ...state.admin.pointRules] } }), 'Financial product created.')
    },
    updateFinancialProduct(key, form) {
      validateName(form.name)
      validatePoints(form.points)
      updateCollection('pointRules', (rows) => rows.map((item) => item.product === key ? { ...item, product: form.name.trim(), points: Number(form.points), reason: form.reason || item.reason, status: form.status } : item), 'Financial product updated.')
    },
    createAdminRow(collection, row) {
      validateName(row.name)
      if (getState().admin[collection].some((item) => getRowKey(item).toLowerCase() === getRowKey(row).toLowerCase())) throw new Error('An entry with these details already exists.')
      updateCollection(collection, (rows) => [row, ...rows], 'New entry created.')
    },
    updateAdminRow(collection, key, row) {
      validateName(row.name)
      updateCollection(collection, (rows) => rows.map((item) => getRowKey(item) === key ? row : item), 'Entry updated.')
    },
    deleteAdminRow(collection, key) {
      updateCollection(collection, (rows) => rows.filter((item) => getRowKey(item) !== key), 'Entry deleted.')
    }
  }
}

export function getRowKey(row) {
  return row.email ?? row.name ?? row.product ?? row.service ?? String(row.id)
}
