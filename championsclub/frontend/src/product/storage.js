import { demoProductData } from './demoData.js'
import { memberLevel } from './selectors.js'

const stateKey = 'championsclub-workspace-v3'

export function normalizeProductState(saved = {}) {
  const defaults = structuredClone(demoProductData)
  const state = { ...defaults, preferences: {}, audit: [], settings: { silver: 1200, gold: 2600, targetDays: 30, emailNotifications: true }, actionPlan: [], cycle: '2026-09', ...saved }
  state.settings = { silver: 1200, gold: 2600, targetDays: 30, emailNotifications: true, ...saved.settings }
  state.admin = { ...defaults.admin, ...saved.admin }
  for (const key of ['advisors', 'targets', 'rewards', 'redemptions', 'alerts', 'salesHistory', 'audit', 'actionPlan']) {
    if (!Array.isArray(state[key])) state[key] = defaults[key] ?? []
  }
  state.advisors = state.advisors.map((advisor) => ({ ...advisor, level: memberLevel(advisor.points, state.settings) }))
  state.salesHistory = state.salesHistory.map((sale, index) => ({ ...sale, id: sale.id ?? `initial-sale-${index}`, advisorId: sale.advisorId ?? state.advisors.find((advisor) => advisor.name === sale.advisor)?.id }))
  state.redemptions = state.redemptions.map((item, index) => ({ ...item, id: item.id ?? `initial-redemption-${index}`, advisorId: item.advisorId ?? state.advisors.find((advisor) => advisor.name === item.advisor)?.id }))
  state.targets = state.targets.map((target) => ({
    ...target,
    advisorId: target.advisorId ?? state.advisors.find((advisor) => target.name.includes(advisor.name))?.id,
    product: target.product ?? state.admin.pointRules.find((product) => target.name.includes(product.product))?.product,
    primary: target.primary ?? (target.name === 'Dealership monthly target' || target.name.includes('individual target'))
  }))
  return state
}

export function loadProductState() {
  try {
    const saved = JSON.parse(localStorage.getItem(stateKey))
    if (saved?.version === 3 && Array.isArray(saved.data?.advisors)) return normalizeProductState(saved.data)
  } catch {}
  return normalizeProductState()
}

export function saveProductState(state) {
  try { localStorage.setItem(stateKey, JSON.stringify({ version: 3, data: state })); return true } catch { return false }
}

export function readAccountId() {
  try { return sessionStorage.getItem('championsclub-account') ?? 'alex-manager' } catch { return 'alex-manager' }
}

export function saveAccountId(id) {
  try { sessionStorage.setItem('championsclub-account', id) } catch {}
}
