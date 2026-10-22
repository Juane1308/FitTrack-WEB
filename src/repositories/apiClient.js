const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
const API_URL = configuredApiUrl ? configuredApiUrl.replace(/\/$/, '') : ''
const ACCESS_TOKEN_KEY = 'fittrack_access_token'

export function getApiUrl(path) {
  return `${API_URL}${path}`
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers ?? {})
  headers.set('Accept', 'application/json')

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(getApiUrl(path), { ...options, headers })
  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const error = new Error(data?.message ?? data?.status ?? 'No fue posible completar la solicitud')
    error.status = response.status
    error.code = data?.status
    throw error
  }

  return data
}

export { ACCESS_TOKEN_KEY }
