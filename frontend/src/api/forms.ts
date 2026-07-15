import { apiRequest } from './client'

export interface Form {
  id: number
  name: string
  is_active: boolean
}

/**
 * Fetch all forms.
 */
export async function listForms(): Promise<Form[]> {
  return apiRequest<Form[]>('/forms/')
}

export async function getForm(id: number): Promise<Form> {
  return apiRequest<Form>(`/forms/${id}`)
}

/**
 * Create a new form.
 */
export async function createForm(
  name: string,
  is_active: boolean
): Promise<Form> {
  return apiRequest<Form>('/forms/', {
    method: 'POST',
    body: {
      name,
      is_active,
    },
  })
}

/**
 * Update an existing form.
 */
export async function updateForm(
  id: number,
  name: string,
  is_active: boolean
): Promise<Form> {
  return apiRequest<Form>(`/forms/${id}`, {
    method: 'PUT',
    body: {
      name,
      is_active,
    },
  })
}

/**
 * Delete a form. Will fail if sessions are attached to it.
 */
export async function deleteForm(id: number): Promise<void> {
  await apiRequest<void>(`/forms/${id}`, { method: 'DELETE' })
}