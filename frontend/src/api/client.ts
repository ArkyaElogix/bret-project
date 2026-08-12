// Central place for talking to the FastAPI backend.
// Handles the base URL, JSON headers, and attaching the JWT automatically.

const LOCAL_API_BASE_URL = 'http://localhost:8000'
const NETWORK_API_BASE_URL = 'http://192.168.1.103:8000'

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    ? LOCAL_API_BASE_URL
    : NETWORK_API_BASE_URL)

const USER_TOKEN_KEY = 'bret_user_token'
const ADMIN_TOKEN_KEY = 'bret_admin_token'
const LEGACY_TOKEN_KEYS = ['bret_token']

const AUTH_CHANGE_EVENT = 'bret-auth-change'

function parseTokenRole(token: string | null): 'ADMIN' | 'USER' | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(json)
    if (payload?.role === 'ADMIN') return 'ADMIN'
    if (payload?.role === 'USER') return 'USER'
    return null
  } catch {
    return null
  }
}

export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

export function getUserToken(): string | null {
  // prefer sessionStorage (current session) over localStorage (remember-me)
  const s = sessionStorage.getItem(USER_TOKEN_KEY)
  if (s) {
    return s
  }
  const l = localStorage.getItem(USER_TOKEN_KEY)
  if (l) {
    return l
  }
  return null
}

export function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

export function getAuthChangeEventName() {
  return AUTH_CHANGE_EVENT
}

export function isTokenValid(): boolean {
  const token = getToken()
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    const exp = payload?.exp

    if (typeof exp !== 'number') return false

    return exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export async function logout() {
  try {
    if (getToken()) {
      await apiRequest<void>('/auth/logout', { method: 'POST' })
    }
  } catch {
    // Still clear local auth even if backend logout fails.
  } finally {
    clearToken()
    notifyAuthChange()
    window.location.replace('/login')
  }
}

export function getToken(): string | null {
  return getAdminToken() ?? getUserToken()
}

export function setToken(token: string, remember = false) {
  sessionStorage.removeItem(USER_TOKEN_KEY)
  localStorage.removeItem(USER_TOKEN_KEY)
  
  // Prevent admin tokens from ever being saved to localStorage
  // even if "Remember Me" is checked, to prevent lingering admin access.
  const isTokenAdmin = parseTokenRole(token) === 'ADMIN'
  
  if (remember && !isTokenAdmin) {
    localStorage.setItem(USER_TOKEN_KEY, token)
  } else {
    sessionStorage.setItem(USER_TOKEN_KEY, token)
  }
  notifyAuthChange()
}

export function setAdminToken(token: string) {
  // Always session-only and isolated
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
  // Ensure no leftover persisted user token can masquerade as admin
  localStorage.removeItem(USER_TOKEN_KEY)
  notifyAuthChange()
}

export function clearToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
  sessionStorage.removeItem(USER_TOKEN_KEY)
  localStorage.removeItem(USER_TOKEN_KEY)
  for (const k of LEGACY_TOKEN_KEYS) {
    try {
      sessionStorage.removeItem(k)
      localStorage.removeItem(k)
    } catch {}
  }
  notifyAuthChange()
}

export type Role = 'ADMIN' | 'USER'

/**
 * Decode the JWT's "role" claim client-side. Used by route guards for an
 * instant, synchronous role check without a network call. Returns null if
 * there's no token or the role claim is missing (e.g. legacy tokens issued
 * before the role claim was added — the API still authenticates these).
 */
export function getRoleFromToken(): Role | null {
  const token = getToken()
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    // JWT payload is base64url; pad and convert to JSON
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(json)
    const role = payload?.role
    return role === 'ADMIN' || role === 'USER' ? role : null
  } catch {
    return null
  }
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
    const next = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.replace(`/login?next=${next}`)
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