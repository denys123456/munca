import { getJson } from './httpClient.js'

export function getAdvisorDashboard(advisorId, credentials) {
  return getJson(`/api/dashboard/advisor/${advisorId}`, credentials)
}

export function getManagerDashboard(managerId, dealershipId, credentials) {
  return getJson(`/api/dashboard/manager/${managerId}/dealership/${dealershipId}`, credentials)
}

