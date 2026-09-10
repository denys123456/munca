import { SaleBuilder } from './SaleBuilder.js'
import { catalogActions } from './catalogActions.js'

export function createWorkspaceActions({ getState, commit, account, isLive, post, retry }) {
  const requireAdmin = () => { if (account.role !== 'ADMIN') throw new Error('Administrator access is required.') }
  const requireManager = () => { if (account.role === 'SALES_ADVISOR') throw new Error('Manager access is required.') }
  const requireDemo = () => { if (isLive) throw new Error('This change requires a management API that is not configured. It is available in the demo workspace.') }
  const pendingRedemptions = new Set()

  return {
    ...catalogActions({ getState, commit, requireAdmin, requireDemo, post }),
    retry,
    async createSale(form) {
      const state = getState()
      const advisor = state.advisors.find((item) => item.id === Number(form.advisorId))
      if (!advisor || (account.role === 'SALES_ADVISOR' && advisor.id !== account.advisorId)) throw new Error('Choose an advisor you can record sales for.')
      const product = state.admin.pointRules.find((item) => item.product === form.product && item.status !== 'Inactive')
      if (!product) throw new Error('Choose an active financial product.')
      const sale = new SaleBuilder().withAdvisor(advisor, state.dealership.name).withProduct(product).withAmount(form.amount).onDate(form.date).build()
      await post('/api/sales', { advisorId: advisor.id, dealershipId: 1, productId: product.id, financedAmount: sale.amount, saleDate: form.date })
      const points = Math.floor(sale.amount / 1000) * product.points
      commit((current) => ({
        ...current,
        salesHistory: [sale, ...current.salesHistory],
        advisors: current.advisors.map((item) => item.id === advisor.id ? { ...item, sales: item.sales + sale.amount, points: item.points + points, availablePoints: (item.availablePoints ?? item.points) + points } : item),
        targets: current.targets.map((target) => target.owner === 'Dealership' || target.advisorId === advisor.id ? { ...target, actual: target.actual + sale.amount } : target),
        dealership: { ...current.dealership, monthlySales: current.dealership.monthlySales + sale.amount },
        charts: { ...current.charts, monthlySales: [...current.charts.monthlySales.slice(0, -1), current.dealership.monthlySales + sale.amount] }
      }), 'Sale recorded. Performance and points updated.')
    },
    async redeemReward(rewardId, requestedAdvisorId) {
      if (account.role === 'ADMIN') throw new Error('Reward redemption is available to advisors and managers.')
      const advisorId = account.role === 'SALES_ADVISOR' ? account.advisorId : Number(requestedAdvisorId)
      const key = `${advisorId}-${rewardId}`
      if (pendingRedemptions.has(key)) throw new Error('This redemption is already being processed.')
      const state = getState()
      const advisor = state.advisors.find((item) => item.id === advisorId)
      const reward = state.rewards.find((item) => item.id === rewardId)
      if (!advisor || !reward) throw new Error('Choose a valid advisor and reward.')
      if (reward.status === 'Inactive') throw new Error('This reward is no longer available.')
      if ((advisor.availablePoints ?? advisor.points) < reward.points) throw new Error('Not enough points to redeem this reward.')
      if (state.redemptions.some((item) => item.rewardId === rewardId && item.advisorId === advisorId && item.status === 'Submitted')) throw new Error('This reward has already been submitted.')
      pendingRedemptions.add(key)
      try {
        await post('/api/rewards/redemptions', { advisorId, rewardId })
        commit((current) => ({
          ...current,
          advisors: current.advisors.map((item) => item.id === advisorId ? { ...item, availablePoints: (item.availablePoints ?? item.points) - reward.points } : item),
          redemptions: [{ id: crypto.randomUUID(), rewardId, advisorId, reward: reward.name, advisor: advisor.name, points: reward.points, status: 'Submitted', date: new Intl.DateTimeFormat('en-GB').format(new Date()) }, ...current.redemptions]
        }), 'Redemption submitted. Points have been deducted.')
      } finally { pendingRedemptions.delete(key) }
    },
    updateTarget(name, patch) {
      requireManager()
      requireDemo()
      if (!Number.isFinite(Number(patch.amount)) || Number(patch.amount) <= 0) throw new Error('Target amount must be greater than zero.')
      if (!Number.isFinite(Number(patch.actual)) || Number(patch.actual) < 0) throw new Error('Actual amount cannot be negative.')
      commit((state) => ({ ...state, targets: state.targets.map((item) => item.name === name ? { ...item, ...patch, amount: Number(patch.amount), actual: Number(patch.actual) } : item), dealership: state.targets.find((item) => item.name === name)?.owner === 'Dealership' ? { ...state.dealership, monthlyTarget: Number(patch.amount) } : state.dealership }), 'Target updated.')
    },
    createTarget(form) {
      requireManager()
      requireDemo()
      if (!form.name.trim() || Number(form.amount) <= 0) throw new Error('Enter a name and a positive target amount.')
      if (getState().targets.some((item) => item.name === form.name.trim())) throw new Error('A target with that name already exists.')
      commit((state) => ({ ...state, targets: [...state.targets, { ...form, name: form.name.trim(), amount: Number(form.amount), actual: 0, status: 'ACTIVE' }] }), 'Target created.')
    },
    markAlertReviewed(title) {
      commit((state) => ({ ...state, alerts: state.alerts.map((item) => item.title === title ? { ...item, isUnread: false } : item) }), 'Alert reviewed.')
    },
    updatePreferences(preferences) {
      commit((state) => ({ ...state, preferences: { ...state.preferences, [account.id]: preferences } }), 'Your preferences have been saved.')
    },
    updateSettings(settings) {
      requireAdmin()
      requireDemo()
      if (Number(settings.silver) <= 0 || Number(settings.gold) <= Number(settings.silver)) throw new Error('Gold must be higher than Silver and Silver must be positive.')
      commit((state) => ({ ...state, settings: { ...settings, silver: Number(settings.silver), gold: Number(settings.gold) } }), 'Program settings saved.')
    },
    toggleAction(action) {
      commit((state) => ({ ...state, actionPlan: state.actionPlan.includes(action) ? state.actionPlan.filter((item) => item !== action) : [...state.actionPlan, action] }), 'Action plan updated.')
    }
  }
}
