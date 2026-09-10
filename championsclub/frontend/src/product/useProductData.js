import { useCallback, useEffect, useMemo, useState } from 'react'
import { postJson } from '../api/httpClient.js'
import { getAdvisorDashboard, getManagerDashboard } from '../api/dashboardApi.js'
import { getRewardCatalog } from '../api/rewardsApi.js'
import { demoProductData } from './demoData.js'

const credentials = {
  email: 'manager@championsclub.example',
  password: import.meta.env.VITE_DEMO_PASSWORD ?? 'change-this-before-production',
}

export function useProductData(account) {
  const [connectionState, setConnectionState] = useState('checking')
  const [liveDashboard, setLiveDashboard] = useState(null)
  const [productState, setProductState] = useState(() => structuredClone(demoProductData))

  useEffect(() => {
    let isCurrent = true

    async function loadLiveSummary() {
      setConnectionState('checking')
      try {
        const [advisorDashboard, managerDashboard, rewards] = await Promise.all([
          getAdvisorDashboard(1, credentials),
          getManagerDashboard(4, 1, credentials),
          getRewardCatalog(1, credentials),
        ])
        if (isCurrent) {
          setLiveDashboard({ advisorDashboard, managerDashboard, rewards })
          setProductState((current) => ({
            ...current,
            rewards: normalizeRewards(rewards, current.rewards),
          }))
          setConnectionState('live')
        }
      } catch {
        if (isCurrent) {
          setLiveDashboard(null)
          setConnectionState('demo')
        }
      }
    }

    loadLiveSummary()

    return () => {
      isCurrent = false
    }
  }, [account.id])

  const createSale = useCallback(async (form) => {
    const advisor = productState.advisors.find((item) => item.id === Number(form.advisorId)) ?? productState.advisors[0]
    const sale = {
      advisor: advisor.name,
      product: form.product,
      amount: Number(form.amount),
      status: 'Recorded',
      date: formatInputDate(form.date),
      dealership: productState.dealership.name,
    }

    if (connectionState === 'live') {
      await postJson('/api/sales', {
        advisorId: Number(form.advisorId),
        dealershipId: 1,
        productId: Number(form.productId),
        financedAmount: Number(form.amount),
        saleDate: form.date,
      }, credentials)
    }

    setProductState((current) => ({
      ...current,
      salesHistory: [sale, ...current.salesHistory],
      advisors: current.advisors.map((item) => (
        item.id === advisor.id ? { ...item, sales: item.sales + sale.amount, points: item.points + Math.round(sale.amount / 1000) * 12 } : item
      )),
      dealership: {
        ...current.dealership,
        monthlySales: current.dealership.monthlySales + sale.amount,
      },
    }))
  }, [connectionState, productState.advisors, productState.dealership.name])

  const createReward = useCallback(async (form) => {
    if (connectionState === 'live') {
      await postJson('/api/admin/catalog/rewards', {
        name: form.name,
        category: form.category,
        requiredPoints: Number(form.points),
      }, credentials)
    }

    setProductState((current) => ({
      ...current,
      rewards: [
        {
          id: Date.now(),
          name: form.name,
          category: form.category,
          points: Number(form.points),
          status: Number(form.points) <= 1330 ? 'Available' : 'Locked',
          progress: Math.min(100, Math.round((1330 / Number(form.points)) * 100)),
        },
        ...current.rewards,
      ],
    }))
  }, [connectionState])

  const updateReward = useCallback((rewardId, form) => {
    setProductState((current) => ({
      ...current,
      rewards: current.rewards.map((reward) => (
        reward.id === rewardId
          ? { ...reward, name: form.name, category: form.category, points: Number(form.points), status: form.status }
          : reward
      )),
    }))
  }, [])

  const deleteReward = useCallback((rewardId) => {
    setProductState((current) => ({
      ...current,
      rewards: current.rewards.filter((reward) => reward.id !== rewardId),
    }))
  }, [])

  const createFinancialProduct = useCallback(async (form) => {
    if (connectionState === 'live') {
      await postJson('/api/admin/catalog/financial-products', {
        name: form.name,
        pointsPerThousandEuro: Number(form.points),
        isEligible: form.status === 'Active',
      }, credentials)
    }

    setProductState((current) => ({
      ...current,
      admin: {
        ...current.admin,
        pointRules: [
          { product: form.name, points: Number(form.points), reason: form.reason || 'Configured in admin workspace' },
          ...current.admin.pointRules,
        ],
      },
    }))
  }, [connectionState])

  const updateFinancialProduct = useCallback((rowKey, form) => {
    setProductState((current) => ({
      ...current,
      admin: {
        ...current.admin,
        pointRules: current.admin.pointRules.map((rule) => (
          rule.product === rowKey
            ? { product: form.name, points: Number(form.points), reason: form.reason || rule.reason }
            : rule
        )),
      },
    }))
  }, [])

  const createAdminRow = useCallback((collection, row) => {
    setProductState((current) => ({
      ...current,
      admin: {
        ...current.admin,
        [collection]: [row, ...current.admin[collection]],
      },
    }))
  }, [])

  const updateAdminRow = useCallback((collection, rowKey, row) => {
    setProductState((current) => ({
      ...current,
      admin: {
        ...current.admin,
        [collection]: current.admin[collection].map((item) => (
          getRowKey(item) === rowKey ? row : item
        )),
      },
    }))
  }, [])

  const deleteAdminRow = useCallback((collection, rowKey) => {
    setProductState((current) => ({
      ...current,
      admin: {
        ...current.admin,
        [collection]: current.admin[collection].filter((item) => getRowKey(item) !== rowKey),
      },
    }))
  }, [])

  const updateTarget = useCallback((targetName, patch) => {
    setProductState((current) => ({
      ...current,
      targets: current.targets.map((target) => (
        target.name === targetName ? { ...target, ...patch, amount: Number(patch.amount), actual: Number(patch.actual) } : target
      )),
    }))
  }, [])

  const markAlertReviewed = useCallback((title) => {
    setProductState((current) => ({
      ...current,
      alerts: current.alerts.map((alert) => (
        alert.title === title ? { ...alert, isUnread: false, severity: 'REVIEWED' } : alert
      )),
    }))
  }, [])

  const redeemReward = useCallback(async (rewardId) => {
    const reward = productState.rewards.find((item) => item.id === rewardId)
    if (!reward) {
      throw new Error('Reward was not found.')
    }
    if (reward.status === 'Locked') {
      throw new Error('This reward is still locked for the current advisor.')
    }

    if (connectionState === 'live') {
      await postJson('/api/rewards/redemptions', { advisorId: 1, rewardId }, credentials)
    }

    setProductState((current) => ({
      ...current,
      rewards: current.rewards.map((item) => (
        item.id === rewardId ? { ...item, status: 'Redeemed', progress: 100 } : item
      )),
      redemptions: [
        { reward: reward.name, advisor: current.currentUser?.name ?? account.name, points: reward.points, status: 'Submitted', date: formatInputDate(new Date().toISOString().slice(0, 10)) },
        ...current.redemptions,
      ],
    }))
  }, [account.name, connectionState, productState.rewards])

  return useMemo(() => ({
    ...productState,
    currentUser: account,
    connectionState,
    liveDashboard,
    actions: {
      createAdminRow,
      createFinancialProduct,
      createReward,
      createSale,
      deleteAdminRow,
      deleteReward,
      markAlertReviewed,
      redeemReward,
      updateFinancialProduct,
      updateAdminRow,
      updateReward,
      updateTarget,
    },
  }), [account, connectionState, createAdminRow, createFinancialProduct, createReward, createSale, deleteAdminRow, deleteReward, liveDashboard, markAlertReviewed, productState, redeemReward, updateAdminRow, updateFinancialProduct, updateReward, updateTarget])
}

function normalizeRewards(liveRewards, fallbackRewards) {
  if (!Array.isArray(liveRewards) || liveRewards.length === 0) {
    return fallbackRewards
  }

  return liveRewards.map((reward, index) => ({
    id: reward.id ?? index + 1,
    name: reward.name,
    category: reward.category,
    points: reward.requiredPoints ?? reward.points ?? 0,
    status: reward.status ?? 'Available',
    progress: reward.progress ?? Math.min(100, Math.round((1330 / (reward.requiredPoints ?? reward.points ?? 1)) * 100)),
  }))
}

function formatInputDate(value) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

function getRowKey(row) {
  return row.email ?? row.name ?? row.product ?? row.service ?? JSON.stringify(row)
}
