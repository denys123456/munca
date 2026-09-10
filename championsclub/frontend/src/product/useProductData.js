import { useEffect, useState } from 'react'
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

  return {
    ...demoProductData,
    currentUser: account,
    connectionState,
    liveDashboard,
  }
}
