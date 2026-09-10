const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export async function getJson(path, credentials) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Basic ${btoa(`${credentials.email}:${credentials.password}`)}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const error = await readError(response)
    throw new Error(error.message)
  }

  return response.json()
}

export async function postJson(path, body, credentials) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${credentials.email}:${credentials.password}`)}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await readError(response)
    throw new Error(error.message)
  }

  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

async function readError(response) {
  try {
    return await response.json()
  } catch {
    return { message: 'The service is currently unavailable.' }
  }
}
