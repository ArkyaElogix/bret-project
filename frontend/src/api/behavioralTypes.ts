import { apiRequest } from './client'

export interface BehaviouralType {
  id: number
  code: string
  name: string
  instructions?: string | null
  order_index: number
}

export async function listBehaviouralTypes(): Promise<BehaviouralType[]> {
  return apiRequest<BehaviouralType[]>('/behavioural-types/')
}

