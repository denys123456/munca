import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeProductState } from '../src/product/storage.js'
import { mergeDashboard } from '../src/product/dashboardMapping.js'
import { getStoryData } from '../src/experience/storyData.js'
import { demoAccounts } from '../src/product/demoData.js'

test('an unavailable live forecast never falls back to an aesthetic demo result', () => {
  const account = demoAccounts[1]
  const data = mergeDashboard(normalizeProductState(), { monthSales: 123456, monthTarget: 200000, forecast: { isAvailable: false }, leaderboard: [] }, account)
  const metrics = getStoryData({ ...data, currentUser: account, connectionState: 'live' })
  assert.equal(metrics.actual, 123456)
  assert.equal(metrics.target, 200000)
  assert.equal(metrics.forecast, null)
  assert.equal(metrics.contributors.length, 0)
  assert.equal(metrics.intelligenceSource, 'SERVICE INSIGHT UNAVAILABLE')
})

test('an advisor sees their service forecast without proportional fabrication', () => {
  const account = demoAccounts[0]
  const data = mergeDashboard(normalizeProductState(), { monthSales: 34000, monthTarget: 50000, availablePoints: 210, forecast: { isAvailable: true, predictedSales: 48500, confidence: .81 }, insight: { summary: 'Verified service brief', recommendations: ['Review the open pipeline'] } }, account)
  const metrics = getStoryData({ ...data, currentUser: account, connectionState: 'live' })
  assert.equal(metrics.actual, 34000)
  assert.equal(metrics.forecast, 48500)
  assert.equal(metrics.balance, 210)
  assert.equal(metrics.confidence, .81)
  assert.equal(metrics.insight, 'Verified service brief')
  assert.equal(metrics.signals[0][1], null)
  assert.equal(metrics.contributors.length, 1)
})

test('seeded dealership forecasts are not represented as personal forecasts', () => {
  const metrics = getStoryData({ ...normalizeProductState(), currentUser: demoAccounts[0], connectionState: 'demo' })
  assert.equal(metrics.forecast, null)
  assert.equal(metrics.actual, 118500)
  assert.equal(metrics.source, 'SEEDED DEMO DATA')
})
