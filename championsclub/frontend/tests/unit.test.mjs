import assert from 'node:assert/strict'
import test from 'node:test'
import { date, label, localDate, money, number, percent } from '../src/lib/format.js'
import { ApiError, query, request, setAccessToken } from '../src/api/client.js'

test('missing metrics remain unavailable while actual zero values are displayed', () => {
  assert.equal(money(null), '—')
  assert.equal(number(undefined), '—')
  assert.equal(percent(null), '—')
  assert.equal(money(0), '€0')
  assert.equal(number(-1500), '-1,500')
  assert.equal(percent(114.44), '114.4%')
  assert.equal(money(1500.25), '€1,500.25')
  assert.equal(number(NaN), '—')
})

test('business dates are calendar dates and scopes produce exact encoded queries', () => {
  assert.equal(date('2026-09-20'), '20 Sept 2026')
  assert.equal(localDate(new Date(2026, 8, 20, 23, 59)), '2026-09-20')
  assert.equal(label('SALES_ADVISOR'), 'Sales Advisor')
  assert.equal(query('/api/sales', { page: 0, status: '', advisorId: 4, from: null }), '/api/sales?page=0&advisorId=4')
  assert.equal(query('/api/advisors', { search: 'Jane & John' }), '/api/advisors?search=Jane+%26+John')
})

test('requests use Bearer authentication and accept bodyless confirmations', async () => {
  const original = global.fetch
  setAccessToken('test-only-token')
  global.fetch = async (url, options) => {
    assert.equal(url, '/api/auth/logout')
    assert.equal(options.headers.Authorization, 'Bearer test-only-token')
    assert.equal(options.method, 'POST')
    return new Response(null, { status: 204 })
  }
  try { assert.equal(await request('/api/auth/logout', { method: 'POST' }), null) } finally { global.fetch = original; setAccessToken(null) }
})

test('conflicts preserve validation details and cannot become success responses', async () => {
  const original = global.fetch
  global.fetch = async () => new Response(JSON.stringify({ message: 'The external sale reference already exists.', code: 'SALE_ALREADY_EXISTS', fieldErrors: [{ field: 'externalReference', message: 'Already used' }] }), { status: 409 })
  try {
    await assert.rejects(request('/api/sales', { method: 'POST', body: { externalReference: 'duplicate' } }), error => error instanceof ApiError && error.status === 409 && error.code === 'SALE_ALREADY_EXISTS' && error.fields[0].field === 'externalReference')
  } finally { global.fetch = original }
})

test('network and server failures use safe actionable error states', async () => {
  const original = global.fetch
  try {
    global.fetch = async () => { throw new TypeError('Internal socket details') }
    await assert.rejects(request('/api/me'), { message: 'Unable to reach ChampionsClub. Check your connection and try again.' })
    global.fetch = async () => new Response(JSON.stringify({ message: 'SQL internal details' }), { status: 500 })
    await assert.rejects(request('/api/me'), { message: 'The service could not complete this request. Please try again.' })
  } finally { global.fetch = original }
})

test('cancelled navigation does not turn into a service failure', async () => {
  const original = global.fetch
  const controller = new AbortController()
  const cancellation = new DOMException('Cancelled', 'AbortError')
  controller.abort()
  global.fetch = async () => { throw cancellation }
  try { await assert.rejects(request('/api/me', { signal: controller.signal }), error => error === cancellation) } finally { global.fetch = original }
})

test('missing login API and HTML fallback report the unavailable service', async () => {
  const original = global.fetch
  try {
    for (const status of [200, 404, 405]) {
      global.fetch = async () => new Response('<html>Static site</html>', { status })
      await assert.rejects(request('/api/auth/login', { method: 'POST', anonymous: true }), error => error.code === 'AUTH_SERVICE_UNAVAILABLE')
    }
  } finally { global.fetch = original }
})

test('a stale unauthorized request cannot expire the replacement session', async () => {
  const originalFetch = global.fetch
  const originalWindow = global.window
  const events = []
  global.window = { dispatchEvent: event => events.push(event.type) }
  let respond
  global.fetch = () => new Promise(resolve => { respond = resolve })
  try {
    setAccessToken('old-token')
    const pending = request('/api/me')
    setAccessToken('replacement-token')
    respond(new Response('Unauthorized', { status: 401 }))
    await assert.rejects(pending, error => error.status === 401)
    assert.deepEqual(events, [])
    global.fetch = async () => new Response('Unauthorized', { status: 401 })
    await assert.rejects(request('/api/me'), error => error.status === 401)
    assert.deepEqual(events, ['championsclub:expired'])
  } finally {
    global.fetch = originalFetch
    global.window = originalWindow
    setAccessToken(null)
  }
})

test('response body network failures receive the connection error', async () => {
  const original = global.fetch
  global.fetch = async () => ({ text: async () => { throw new TypeError('Internal connection details') } })
  try {
    await assert.rejects(request('/api/me'), { message: 'Unable to reach ChampionsClub. Check your connection and try again.' })
  } finally { global.fetch = original }
})
