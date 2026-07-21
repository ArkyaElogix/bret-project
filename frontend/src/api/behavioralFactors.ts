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
