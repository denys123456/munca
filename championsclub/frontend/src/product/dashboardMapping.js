export function mergeDashboard(state, dashboard, account) {
  if (!Number.isFinite(Number(dashboard.monthSales)) || !Number.isFinite(Number(dashboard.monthTarget))) throw new Error('The dashboard response is incomplete.')
  const advisorView = account.role === 'SALES_ADVISOR'
  const advisors = state.advisors.map((advisor) => {
    if (advisorView && advisor.id === account.advisorId) return { ...advisor, sales: Number(dashboard.monthSales), target: Number(dashboard.monthTarget), availablePoints: dashboard.availablePoints, points: dashboard.gamification?.currentPoints ?? advisor.points, level: dashboard.gamification?.currentLevel ?? advisor.level }
    const entry = dashboard.leaderboard?.find((item) => item.advisorId === advisor.id)
    return entry ? { ...advisor, sales: Number(entry.monthSales), points: entry.points } : advisor
  })
  const hasForecast = dashboard.forecast?.isAvailable && Number(dashboard.forecast.predictedSales) > 0
  const hasInsight = Boolean(dashboard.insight?.summary)
  const next = {
    ...state,
    advisors,
    dealership: advisorView ? state.dealership : { ...state.dealership, monthlySales: Number(dashboard.monthSales), monthlyTarget: Number(dashboard.monthTarget) },
    forecast: hasForecast ? { ...state.forecast, ...dashboard.forecast, predictedSales: Number(dashboard.forecast.predictedSales) } : state.forecast,
    forecastScope: advisorView ? 'advisor' : 'dealership',
    forecastSource: hasForecast ? 'live' : 'demo',
    insightSource: hasInsight ? 'live' : 'demo',
    aiInsights: hasInsight ? { ...state.aiInsights, summary: dashboard.insight.summary, nextActions: dashboard.insight.recommendations ?? [] } : state.aiInsights,
    alerts: Array.isArray(dashboard.alerts) ? dashboard.alerts.map((alert) => ({ ...alert, group: alert.type.split('_').join(' '), isUnread: state.alerts.find((item) => item.title === alert.title)?.isUnread ?? true })) : state.alerts
  }
  next.targets = state.targets.map((target) => {
    if (!target.primary) return target
    if (!advisorView && target.owner === 'Dealership') return { ...target, actual: Number(dashboard.monthSales), amount: Number(dashboard.monthTarget) }
    if (advisorView && target.advisorId === account.advisorId) return { ...target, actual: Number(dashboard.monthSales), amount: Number(dashboard.monthTarget) }
    return target
  })
  return next
}
