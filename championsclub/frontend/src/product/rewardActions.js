import { availableBalance } from './selectors.js'

export function rewardActions({ getState, commit, account, post, pending, isLive }) {
  return {
    async redeemReward(rewardId, requestedAdvisorId) {
      if (account.role === 'ADMIN') throw new Error('Open an advisor demo account to redeem rewards.')
      if (isLive && account.role !== 'SALES_ADVISOR') throw new Error('Live redemptions must be submitted by an advisor.')
      const advisorId = account.role === 'SALES_ADVISOR' ? account.advisorId : Number(requestedAdvisorId)
      const key = `redemption-${advisorId}`
      if (pending.has(key)) throw new Error('A redemption is already being processed for this advisor.')
      const state = getState()
      const advisor = state.advisors.find((item) => item.id === advisorId)
      const reward = state.rewards.find((item) => item.id === rewardId)
      if (!advisor || !reward) throw new Error('Choose a valid advisor and reward.')
      if (reward.status === 'Inactive') throw new Error('This reward is no longer available.')
      if (availableBalance(advisor) < reward.points) throw new Error('Not enough points to redeem this reward.')
      if (state.redemptions.some((item) => item.rewardId === rewardId && item.advisorId === advisorId && item.status === 'Submitted')) throw new Error('This reward has already been submitted.')
      pending.add(key)
      try {
        await post('/api/rewards/redemptions', { advisorId, rewardId })
        commit((current) => ({
          ...current,
          advisors: current.advisors.map((item) => item.id === advisorId ? { ...item, availablePoints: availableBalance(item) - reward.points } : item),
          redemptions: [{ id: crypto.randomUUID(), rewardId, advisorId, reward: reward.name, advisor: advisor.name, points: reward.points, status: 'Submitted', date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()) }, ...current.redemptions]
        }), 'Redemption submitted. Points have been deducted.')
      } finally { pending.delete(key) }
    }
  }
}
