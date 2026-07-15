// Central place for talking to the FastAPI backend.
// Handles the base URL, JSON headers, and attaching the JWT automatically.

const API_BASE_URL = 'http://localhost:8000'

const TOKEN_KEY = 'bret_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

interface RequestOptions {
  method?: string
  body?: unknown
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  /*const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let detail = response.statusText
    try {
      const errorBody = await response.json()
      detail = errorBody.detail ?? detail
    } catch {
      // response wasn't JSON, fall back to statusText
    }
    throw new ApiError(response.status, typeof detail === 'string' ? detail : JSON.stringify(detail))
  }*/
 const response = await fetch(`${API_BASE_URL}${path}`, {
  method: options.method ?? 'GET',
  headers,
  body: options.body ? JSON.stringify(options.body) : undefined,
})

// Token expired or invalid
  if (response.status === 401) {
    clearToken()
    window.location.replace ('/login')
    return Promise.reject(new ApiError(401, 'Unauthorized'))
  }

  if (!response.ok) {
    let detail = response.statusText

  try {
    const errorBody = await response.json()
    detail = errorBody.detail ?? detail
  } catch {
    // response wasn't JSON
  }

  throw new ApiError(
    response.status,
    typeof detail === 'string' ? detail : JSON.stringify(detail)
  )
}

  // 204 No Content has no body to parse
  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}