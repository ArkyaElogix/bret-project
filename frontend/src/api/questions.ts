import { apiRequest } from './client'

export interface Question {
  id: number
  form_id: number
  behavioural_type_id: number
  number: number
  option_a_text: string
  option_b_text: string
  option_a_factor_id?: number | null
  option_b_factor_id?: number | null
}

export async function listQuestions(filters?: {
  form_id?: number
  behavioural_type_id?: number
}): Promise<Question[]> {
  const params = new URLSearchParams()
  if (filters?.form_id != null) params.set('form_id', String(filters.form_id))
  if (filters?.behavioural_type_id != null) {
    params.set('behavioural_type_id', String(filters.behavioural_type_id))
  }
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<Question[]>(`/questions/${query}`)
}

export async function createQuestion(
  form_id: number,
  behavioural_type_id: number,
  number: number,
  option_a_text: string,
  option_b_text: string,
  option_a_factor_id: number,
  option_b_factor_id: number
): Promise<Question> {
  return apiRequest<Question>('/questions/', {
    method: 'POST',
    body: {
      form_id,
      behavioural_type_id,
      number,
      option_a_text,
      option_b_text,
      option_a_factor_id,
      option_b_factor_id,
    },
  })
}

export async function updateQuestion(
  id: number,
  updates: {
    number?: number
    option_a_text?: string
    option_b_text?: string
    option_a_factor_id: number
    option_b_factor_id: number
  }
): Promise<Question> {
  return apiRequest<Question>(`/questions/${id}`, {
    method: 'PUT',
    body: updates,
  })
}

export async function deleteQuestion(id: number): Promise<void> {
  await apiRequest<void>(`/questions/${id}`, { method: 'DELETE' })
}
