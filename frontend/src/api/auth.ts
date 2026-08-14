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

export async function adminLogin(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/admin/login', {
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
  password: string,
  productType: 'BASIC' | 'EXECUTIVE',
  consentAccepted: boolean,
  education: string,
  age: number,
  address: string,
  country: string,
  profession: string,
  income_range: string,
  phone: string,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/register', {
    method: 'POST',
    body: { name, email, password, account_type: productType, consent_accepted: consentAccepted, education, age, address, country, profession, income_range, phone },
  })
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { token, new_password: newPassword },
  })
}

export async function completeRegistration(
  sessionId: number,
  phone: string,
  address: string,
  country: string,
  age: number,
  profession: string,
  incomeRange: string,
  consentAccepted: boolean,
): Promise<User> {
  return apiRequest<User>('/auth/complete-registration', {
    method: 'POST',
    body: {
      session_id: sessionId,
      phone,
      address,
      country,
      age,
      profession,
      income_range: incomeRange,
      consent_accepted: consentAccepted,
    },
  })
}