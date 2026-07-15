import { apiRequest } from './client'

export interface BehaviouralType {
  id: number
  code: string
  name: string
  instructions?: string | null
  order_index: number
}

export async function listBehaviouralTypes(formId?: number): Promise<BehaviouralType[]> {
  const query = formId != null ? `?form_id=${formId}` : ''
  return apiRequest<BehaviouralType[]>(`/behavioural-types/${query}`)
}

export async function createBehaviouralType(
  code: string,
  name: string,
  instructions: string,
  order_index: number
): Promise<BehaviouralType> {
  return apiRequest<BehaviouralType>('/behavioural-types/', {
    method: 'POST',
    body: {
      code,
      name,
      instructions,
      order_index,
    },
  })
}

export async function updateBehaviouralType(
  id: number,
  code: string,
  name: string,
  instructions: string,
  order_index: number
): Promise<BehaviouralType> {
  return apiRequest<BehaviouralType>(`/behavioural-types/${id}`, {
    method: 'PUT',
    body: {
      code,
      name,
      instructions,
      order_index,
    },
  })
}

export async function deleteBehaviouralType(id: number): Promise<void> {
  await apiRequest<void>(`/behavioural-types/${id}`, { method: 'DELETE' })
}