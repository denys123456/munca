import { catalogActions } from './catalogActions.js'
import { targetActions } from './targetActions.js'
import { saleActions } from './saleActions.js'
import { rewardActions } from './rewardActions.js'
import { memberLevel } from './selectors.js'

export function createWorkspaceActions({ getState, commit, account, isLive, post, retry, pending = new Set() }) {
  const requireAdmin = () => { if (account.role !== 'ADMIN') throw new Error('Administrator access is required.') }
  const requireManager = () => { if (account.role === 'SALES_ADVISOR') throw new Error('Manager access is required.') }
  const requireDemo = () => { if (isLive) throw new Error('This management feature is available in the demo workspace. A live management service is not connected.') }
  return {
    ...catalogActions({ getState, commit, requireAdmin, requireDemo, post }),
    ...targetActions({ getState, commit, requireManager, requireDemo }),
    ...saleActions({ getState, commit, account, post, pending }),
    ...rewardActions({ getState, commit, account, post, pending, isLive }),
    retry,
    markAlertReviewed(title) {
      commit((state) => ({ ...state, alerts: state.alerts.map((item) => item.title === title ? { ...item, isUnread: false } : item) }), 'Alert reviewed.')
    },
    updatePreferences(preferences) {
      commit((state) => ({ ...state, preferences: { ...state.preferences, [account.id]: preferences } }), 'Your preferences have been saved.')
    },
    updateSettings(settings) {
      requireAdmin()
      requireDemo()
      const silver = Number(settings.silver)
      const gold = Number(settings.gold)
      const targetDays = Number(settings.targetDays)
      if (!Number.isInteger(silver) || !Number.isInteger(gold) || silver <= 0 || gold <= silver) throw new Error('Use whole points. Gold must be higher than Silver and Silver must be positive.')
      if (!Number.isInteger(targetDays) || targetDays < 1 || targetDays > 366) throw new Error('A target cycle must be between 1 and 366 days.')
      const updated = { ...settings, silver, gold, targetDays }
      commit((state) => ({ ...state, settings: updated, advisors: state.advisors.map((advisor) => ({ ...advisor, level: memberLevel(advisor.points, updated) })) }), 'Program settings saved.')
    },
    toggleAction(action) {
      commit((state) => ({ ...state, actionPlan: state.actionPlan.includes(action) ? state.actionPlan.filter((item) => item !== action) : [...state.actionPlan, action] }), 'Action plan updated.')
    }
  }
}
