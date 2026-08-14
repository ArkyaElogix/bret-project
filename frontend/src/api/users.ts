import { apiRequest } from './client'

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  account_type: string;
  education?: string;
  address?: string;
  country?: string;
  age?: number;
  profession?: string;
  income_range?: string;
  phone?: string;
  consent_given_at?: string;
  created_at?: string;
  is_single_use?: boolean;
  single_use_status?: 'pending_registration' | 'active' | 'locked' | 'admin_unlocked' | null;
  deletion_scheduled_at?: string | null;
  assessment_started_at?: string | null;
}

export async function createSingleUseUser(
  email: string,
  account_type: 'BASIC' | 'EXECUTIVE',
  name?: string
): Promise<User> {
  return apiRequest<User>('/users/single-use', {
    method: 'POST',
    body: { email, account_type, name },
  })
}

export async function unlockSingleUseUser(id: number): Promise<User> {
  return apiRequest<User>(`/users/${id}/single-use/unlock`, {
    method: 'POST',
  })
}

export interface SingleUseCleanupResult {
  checked: number
  deleted: number
  skipped: number
  warnings: string[]
}

export async function cleanupSingleUseUsers(): Promise<SingleUseCleanupResult> {
  return apiRequest<SingleUseCleanupResult>('/users/single-use/cleanup', {
    method: 'POST',
  })
}
/**
 * Admin-only: list all users.
 */
export async function listUsers(): Promise<User[]> {
  return apiRequest<User[]>('/users/')
}

/**
 * Admin-only: create a new user (password is hashed server-side).
 */
export async function createUser(
  name: string,
  email: string,
  password: string,
  role: 'ADMIN' | 'USER',
  account_type: 'BASIC' | 'EXECUTIVE',

): Promise<User> {
  return apiRequest<User>('/users/', {
    method: 'POST',
    body: { name, email, password, role, account_type },
  })
}

/**
 * Admin-only: delete a user. Will fail (409) if the user has sessions.
 */
export async function deleteUser(id: number): Promise<void> {
  await apiRequest<void>(`/users/${id}`, { method: 'DELETE' })
}

/**
 * Admin-only: set a new password for a user.
 */
export async function changePassword(
  id: number,
  newPassword: string
): Promise<User> {
  return apiRequest<User>(`/users/${id}/password`, {
    method: 'PATCH',
    body: { new_password: newPassword },
  })
}

export async function changeUserType(
  id: number,
  accountType: 'BASIC' | 'EXECUTIVE'
): Promise<User> {
  return apiRequest<User>(`/users/${id}/type`, {
    method: 'PATCH',
    body: { account_type: accountType },
  })
}

export async function exportMyData(): Promise<any> {
  return apiRequest<any>('/users/me/export')
}

export async function deleteMe(password: string): Promise<void> {
  await apiRequest<void>('/users/me', {
    method: 'DELETE',
    body: { password },
  })
}

export interface AuditLog {
  id: number
  action: string
  user_id: number | null
  target_user_id: number | null
  ip_address: string | null
  detail: string | null
  created_at: string
}

/**
 * Admin-only: fetch recent audit log entries.
 * Optionally filter by action type or user_id.
 */
export async function getAuditLog(params?: {
  limit?: number
  action?: string
  user_id?: number
}): Promise<AuditLog[]> {
  const query = new URLSearchParams()
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.action) query.set('action', params.action)
  if (params?.user_id) query.set('user_id', String(params.user_id))
  const qs = query.toString()
  return apiRequest<AuditLog[]>(`/audit/${qs ? `?${qs}` : ''}`)
}


export async function updateMyProfile(updates: Partial<Omit<User, 'id' | 'role' | 'account_type'>>) {
  return apiRequest<User>('/users/me', {
    method: 'PATCH',
    body: updates,
  })
}
