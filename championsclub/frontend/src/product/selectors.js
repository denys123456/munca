export function advisorForAccount(data) {
  return data.advisors.find((advisor) => advisor.id === data.currentUser.advisorId) ?? data.advisors[0]
}

export function memberLevel(points, settings) {
  if (points >= settings.gold) return 'GOLD'
  if (points >= settings.silver) return 'SILVER'
  return 'BRONZE'
}

export function availableBalance(advisor) {
  return advisor?.availablePoints ?? advisor?.points ?? 0
}

export function advisorSales(data, advisor) {
  return data.salesHistory.filter((sale) => sale.advisorId === advisor.id || sale.advisor === advisor.name)
}

export function visibleTargets(data) {
  if (data.currentUser.role !== 'SALES_ADVISOR') return data.targets
  return data.targets.filter((target) => target.advisorId === data.currentUser.advisorId || target.owner === 'Dealership')
}
