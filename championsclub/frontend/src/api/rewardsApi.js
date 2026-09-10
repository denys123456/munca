import { getJson } from './httpClient.js'

export function getRewardCatalog(advisorId, credentials) {
  return getJson(`/api/rewards/advisor/${advisorId}`, credentials)
}

