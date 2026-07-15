import { apiRequest } from './client'

export interface User {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'USER'
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
  role: 'ADMIN' | 'USER'
): Promise<User> {
  return apiRequest<User>('/users/', {
    method: 'POST',
    body: { name, email, password, role },
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
