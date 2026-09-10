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

async function readError(response) {
  try {
    return await response.json()
  } catch {
    return { message: 'The service is currently unavailable.' }
  }
}

