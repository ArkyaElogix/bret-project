import { apiRequest } from './client'

export interface BehaviouralFactor {
  id: number
  behavioural_type_id: number
  name: string
  order_index: number
}

export async function listBehaviouralFactors(
  behavioural_type_id?: number
): Promise<BehaviouralFactor[]> {
  const query =
    behavioural_type_id != null ? `?behavioural_type_id=${behavioural_type_id}` : ''
  return apiRequest<BehaviouralFactor[]>(`/behavioural-factors/${query}`)
}

export async function createBehaviouralFactor(
  behavioural_type_id: number,
  name: string,
  order_index: number
): Promise<BehaviouralFactor> {
  return apiRequest<BehaviouralFactor>('/behavioural-factors/', {
    method: 'POST',
    body: {
      behavioural_type_id,
      name,
      order_index,
    },
  })
}

export async function updateBehaviouralFactor(
  id: number,
  name?: string,
  order_index?: number
): Promise<BehaviouralFactor> {
  return apiRequest<BehaviouralFactor>(`/behavioural-factors/${id}`, {
    method: 'PUT',
    body: {
      name,
      order_index,
    },
  })
}

export async function deleteBehaviouralFactor(id: number): Promise<void> {
  await apiRequest<void>(`/behavioural-factors/${id}`, { method: 'DELETE' })
}
