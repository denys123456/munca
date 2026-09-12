import { navigationByRole } from '../../product/navigation.js'
import { getDefaultPageForRole } from '../../product/pageRegistry.js'

export function routeFor(pathname, role) {
  const [candidate, id] = pathname.split('/').filter(Boolean)
  const permitted = candidate === 'profile' || candidate === 'closing' || candidate === 'advisor-detail' && role === 'MANAGER' || navigationByRole[role].some((item) => item.page === candidate)
  return { page: permitted ? candidate : role === 'MANAGER' ? 'team-performance' : getDefaultPageForRole(role), advisorId: Number(id) || 1 }
}

export const routeKey = (route) => route.page === 'advisor-detail' ? `${route.page}/${route.advisorId}` : route.page
export const equalRoute = (first, second) => routeKey(first) === routeKey(second)
