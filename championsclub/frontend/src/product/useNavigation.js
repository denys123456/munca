import { useCallback, useEffect, useState } from 'react'
import { navigationByRole } from './navigation.js'
import { getDefaultPageForRole } from './pageRegistry.js'

export function canVisitPage(role, page) {
  return page === 'profile' || (page === 'advisor-detail' && role === 'MANAGER') || navigationByRole[role].some((item) => item.page === page)
}

function readRoute(role) {
  const [page, advisorId] = location.hash.slice(1).split('/')
  return { page: canVisitPage(role, page) ? page : getDefaultPageForRole(role), advisorId: Number(advisorId) || 1 }
}

export function useNavigation(role) {
  const [route, setRoute] = useState(() => readRoute(role))
  const [selectedAdvisorId, setSelectedAdvisorId] = useState(route.advisorId)
  useEffect(() => {
    const sync = () => {
      const nextRoute = readRoute(role)
      setRoute(nextRoute)
      if (nextRoute.page === 'advisor-detail') setSelectedAdvisorId(nextRoute.advisorId)
    }
    window.addEventListener('hashchange', sync)
    sync()
    return () => window.removeEventListener('hashchange', sync)
  }, [role])
  const navigate = useCallback((page, advisorId) => {
    const permitted = canVisitPage(role, page) ? page : getDefaultPageForRole(role)
    const selectedId = advisorId ?? selectedAdvisorId
    if (permitted === 'advisor-detail') setSelectedAdvisorId(selectedId)
    location.hash = permitted === 'advisor-detail' ? `${permitted}/${selectedId}` : permitted
    setRoute({ page: permitted, advisorId: selectedId })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [role, selectedAdvisorId])
  const activePage = canVisitPage(role, route.page) ? route.page : getDefaultPageForRole(role)
  return { activePage, selectedAdvisorId, setSelectedAdvisorId, navigate }
}
