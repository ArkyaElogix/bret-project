import { apiRequest } from './client'

export interface BehaviouralType {
  id: number
  code: string
  name: string
  instructions?: string | null
  order_index: number
}

export async function listBehaviouralTypes(form_id?: number): Promise<BehaviouralType[]> {
  const query = form_id != null ? `?form_id=${form_id}` : ''
  return apiRequest<BehaviouralType[]>(`/behavioural-types/${query}`)
}

