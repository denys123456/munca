import { advisorForAccount, availableBalance } from '../product/selectors.js'

export const currency = (value) => Number.isFinite(value) ? new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value) : 'Unavailable'
export const percentage = (value) => Number.isFinite(value) ? `${Math.round(value)}%` : 'Unavailable'

export function getStoryData(data) {
  const advisor = advisorForAccount(data)
  const personal = data.currentUser.role === 'SALES_ADVISOR'
  const actual = personal ? advisor?.sales ?? 0 : data.dealership.monthlySales
  const target = personal ? advisor?.target ?? 0 : data.dealership.monthlyTarget
  const live = data.connectionState === 'live'
  const appropriateForecast = !personal || data.forecastScope === 'advisor'
  const validForecast = appropriateForecast && (!live || data.forecastSource === 'live')
  const forecast = validForecast && Number.isFinite(data.forecast?.predictedSales) ? data.forecast.predictedSales : null
  const liveInsight = live && data.insightSource === 'live'
  return {
    actual, target, forecast,
    achievement: target > 0 ? actual / target * 100 : null,
    confidence: forecast != null ? data.forecast.confidence : null,
    source: live ? 'LIVE PERFORMANCE' : 'SEEDED DEMO DATA',
    forecastSource: forecast == null ? 'NO VERIFIED FORECAST FOR THIS ACCOUNT' : live ? 'ML SERVICE FORECAST' : 'SEEDED DEMO FORECAST',
    scope: personal ? `${data.currentUser.name} / PERSONAL PERFORMANCE` : `${data.dealership.name} / TEAM PERFORMANCE`,
    advisor,
    contributors: personal ? [advisor].filter(Boolean) : live ? data.advisors.filter((item) => data.liveAdvisorIds?.includes(item.id)) : data.advisors,
    personal,
    live,
    balance: personal ? availableBalance(advisor) : data.advisors.reduce((sum, item) => sum + availableBalance(item), 0),
    intelligenceSource: liveInsight ? 'SERVICE INSIGHT' : live ? 'SERVICE INSIGHT UNAVAILABLE' : 'SEEDED DEMO INSIGHT',
    insight: liveInsight || !live ? data.aiInsights.summary : 'Connect a verified intelligence response to see the next recommended action.',
    signals: [
      ['WHAT CHANGED', live ? null : data.aiInsights.whatChanged?.[0]],
      ['WHY IT MATTERS', liveInsight || !live ? data.aiInsights.summary : null],
      ['RISK', live ? data.alerts.find((alert) => alert.severity === 'WARNING')?.message : data.aiInsights.needsAttention?.[0]],
      ['OPPORTUNITY', data.alerts.find((alert) => alert.group === 'Opportunity' || alert.type === 'EXCEPTIONAL_PERFORMANCE')?.message],
      ['NEXT BEST ACTION', liveInsight || !live ? data.aiInsights.nextActions?.[0] : null]
    ]
  }
}
