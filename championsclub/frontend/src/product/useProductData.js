import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getJson, postJson } from '../api/httpClient.js'
import { loadProductState, saveProductState } from './storage.js'
import { createWorkspaceActions } from './workspaceActions.js'
import { mergeDashboard } from './dashboardMapping.js'

const apiConfigured = Boolean(import.meta.env.VITE_API_BASE_URL)

export function useProductData(account) {
  const [state, setState] = useState(loadProductState)
  const stateRef = useRef(state)
  const pending = useRef(new Set())
  const [connectionState, setConnectionState] = useState(apiConfigured ? 'checking' : 'demo')
  const [serviceError, setServiceError] = useState('')
  const [revision, setRevision] = useState(0)
  const [message, setMessage] = useState('')
  const clearMessage = useCallback(() => setMessage(''), [])
  const retry = useCallback(() => setRevision((value) => value + 1), [])
  const credentials = useMemo(() => ({
    email: `${account.role === 'SALES_ADVISOR' ? 'advisor' : account.role.toLowerCase()}@championsclub.example`,
    password: import.meta.env.VITE_DEMO_PASSWORD ?? 'change-this-before-production'
  }), [account.role])

  useEffect(() => {
    if (!apiConfigured) return
    const controller = new AbortController()
    let disposed = false
    const timeout = window.setTimeout(() => controller.abort(), 7000)
    setConnectionState('checking')
    const path = account.role === 'SALES_ADVISOR' ? `/api/dashboard/advisor/${account.advisorId}` : '/api/dashboard/manager/4/dealership/1'
    getJson(path, credentials, controller.signal).then((dashboard) => {
      if (controller.signal.aborted) return
      const next = mergeDashboard(stateRef.current, dashboard, account)
      stateRef.current = next
      setState(next)
      setServiceError('')
      setConnectionState('live')
    }).catch(() => {
      if (!disposed) {
        setServiceError('Live services are unavailable. Your demo workspace remains available.')
        setConnectionState('demo')
      }
    }).finally(() => window.clearTimeout(timeout))
    return () => { disposed = true; window.clearTimeout(timeout); controller.abort() }
  }, [account.id, account.advisorId, account.role, credentials, revision])

  const commit = useCallback((transform, confirmation) => {
    const next = transform(stateRef.current)
    const entry = { id: crypto.randomUUID(), actor: account.name, action: confirmation, at: new Date().toISOString() }
    const updated = { ...next, audit: [entry, ...(next.audit ?? [])].slice(0, 100) }
    stateRef.current = updated
    setState(updated)
    const saved = saveProductState(updated)
    setMessage(saved ? confirmation : `${confirmation} Browser storage is unavailable; keep this tab open.`)
  }, [account.name])

  const actions = useMemo(() => createWorkspaceActions({
    getState: () => stateRef.current, commit, account, isLive: connectionState === 'live', retry, pending: pending.current,
    post: (path, body) => connectionState === 'live' ? postJson(path, body, credentials) : Promise.resolve(null)
  }), [account, commit, connectionState, credentials, retry])

  return useMemo(() => ({ ...state, currentUser: account, connectionState, serviceError, actions, message, clearMessage }), [state, account, connectionState, serviceError, actions, message, clearMessage])
}
