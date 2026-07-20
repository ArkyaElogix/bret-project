import { apiRequest } from './client'
import type { User } from './users'

interface LoginResponse {
  access_token: string
  token_type: string
  role: 'ADMIN' | 'USER'
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export async function adminLogin(email: string, password: string): Promise<LoginResponse>{
  return apiRequest<LoginResponse>('/auth/admin/login',{
    method: 'POST',
    body: { email, password },
  })
}

/**
 * Fetch the currently logged-in user's profile (id, name, email, role).
 */
export async function getMe(): Promise<User> {
  return apiRequest<User>('/auth/me')
}

export async function registerCandidate(
  name: string,
  email: string,
  password: string
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  })
}