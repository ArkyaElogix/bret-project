import { apiRequest } from './client'

export interface Session {
  id: number
  user_id: number
  form_id: number
  product_type: 'BASIC' | 'EXECUTIVE'
  status: 'in_progress' | 'submitted'
}

/**
 * Start (or resume) an assessment session for the logged-in user + a form.
 * Reuses an existing in-progress session for the same user+form if present.
 */
export async function startSession(
  formId: number,
  productType: 'BASIC' | 'EXECUTIVE'
): Promise<Session> {
  return apiRequest<Session>('/sessions/start', {
    method: 'POST',
    body: { form_id: formId, product_type: productType },
  })
}

/**
 * Admin-only: list all sessions, with optional filters.
 */
export async function listSessions(filters?: {
  form_id?: number
  user_id?: number
  status_filter?: string
}): Promise<Session[]> {
  const params = new URLSearchParams()
  if (filters?.form_id != null) params.set('form_id', String(filters.form_id))
  if (filters?.user_id != null) params.set('user_id', String(filters.user_id))
  if (filters?.status_filter) params.set('status_filter', filters.status_filter)

  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<Session[]>(`/sessions/${query}`)
}

/**
 * Admin-only: hard-delete a session (cascades to responses + scores).
 */
export async function deleteSession(id: number): Promise<void> {
  await apiRequest<void>(`/sessions/${id}`, { method: 'DELETE' })
}

export interface SectionBreakdown {
  section_id: number
  section_name: string
  score: number
}

export interface FactorResult {
  factor_id: number
  factor_name: string
  section_breakdown: SectionBreakdown[]
  total_score: number
  percentage: number
}

/**
 * Get aggregated factor results (totals + percentages) for a submitted session.
 * Accessible by the session's owner or an admin.
 */
export async function getSessionResults(sessionId: number): Promise<FactorResult[]> {
  return apiRequest<FactorResult[]>(`/sessions/${sessionId}/results`)
}
