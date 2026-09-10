import { demoProductData } from './demoData.js'

const stateKey = 'championsclub-workspace-v3'

export function loadProductState() {
  try {
    const saved = JSON.parse(localStorage.getItem(stateKey))
    if (saved?.version === 3 && Array.isArray(saved.data?.advisors)) return saved.data
  } catch {}
  return { ...structuredClone(demoProductData), preferences: {}, audit: [], settings: { silver: 1200, gold: 2600, targetDays: 30, emailNotifications: true }, actionPlan: [] }
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
