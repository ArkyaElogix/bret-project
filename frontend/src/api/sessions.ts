import { apiRequest } from './client'


export interface Session {
  id: number
  user_id: number
  user_name: string
  form_id: number
  form_name: string
  status: 'in_progress' | 'submitted'
  submitted_at: string | null
  auto_logout?: boolean
}

/**
 * Start (or resume) an assessment session for the logged-in user + a form.
 * Reuses an existing in-progress session for the same user+form if present.
 */
export async function startSession(
  formId: number,
  priorAttemptClaimed: boolean = false,
  priorAttemptDetails: string | null = null
): Promise<Session> {
  return apiRequest<Session>('/sessions/start', {
    method: 'POST',
    body: {
      form_id: formId,
      prior_attempt_claimed: priorAttemptClaimed,
      prior_attempt_details: priorAttemptDetails
    },
  })
}

/**
 * List the current user's own sessions, newest first. Optional status filter.
 */
export async function listMySessions(statusFilter?: string): Promise<Session[]> {
  const query = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : ''
  return apiRequest<Session[]>(`/sessions/me${query}`)
}

export interface ResponseData {
  id: number
  session_id: number
  question_id: number
  chosen_option: 'A' | 'B'
}

export interface SessionProgress {
  session: Session
  answered_question_ids: number[]
  responses: ResponseData[]
}

/**
 * Get a session's current answers (for resume / progress display).
 * Accessible by the session's owner or an admin.
 */
export async function getSessionProgress(sessionId: number): Promise<SessionProgress> {
  return apiRequest<SessionProgress>(`/sessions/${sessionId}/progress`)
}

/**
 * Submit (upsert) one answer. Safe to call repeatedly — overwrites the prior
 * choice for the same question. Owner or admin only.
 */
export async function submitAnswer(
  sessionId: number,
  questionId: number,
  chosenOption: 'A' | 'B'
): Promise<ResponseData> {
  return apiRequest<ResponseData>(`/sessions/${sessionId}/answers`, {
    method: 'POST',
    body: { question_id: questionId, chosen_option: chosenOption },
  })
}

/**
 * Finalize a session. Requires all questions answered; triggers server-side
 * scoring. Returns the updated session (status = submitted).
 */
export async function submitSession(sessionId: number): Promise<Session> {
  return apiRequest<Session>(`/sessions/${sessionId}/submit`, { method: 'POST' })
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

// export interface SectionBreakdown {
//   section_id: number
//   section_name: string
//   score: number
// }

export interface FactorResult {
  factor_id: number
  factor_name: string
  score: number
  percentage: number
}

export interface SectionResult {
  section_id: number
  section_code: string
  section_name: string
  factors: FactorResult[]
}

/**
 * Get aggregated factor results (totals + percentages) for a submitted session.
 * Accessible by the session's owner or an admin.
 */
export async function getSessionResults(sessionId: number): Promise<SectionResult[]> {
  return apiRequest<SectionResult[]>(`/sessions/${sessionId}/results`)
}


export interface ReportFactor {
  factor_id: number;
  factor_name: string;
  raw_score: number;
  score: number;
  score_label: string | null;
  statement_title: string | null;
  statement: string | null;
  color?: string | null;
}

export interface ReportSection {
  section_id: number;
  section_code: string;
  section_name: string;
  section_definitions?: string;
  factors: ReportFactor[];
}

export interface OrientationInsight {
  label: string;
  body: string;
}

export type OrientationInsightMap = {
  [key: string]: OrientationInsight | string | undefined;
  leadership?: OrientationInsight | string;
  team?: OrientationInsight | string;
  motivation?: OrientationInsight | string;
  change?: OrientationInsight | string;
  stress?: OrientationInsight | string;
};

export interface SessionReport {
  session: Session;
  user: { name: string; product_type: string };
  form: { id: number; name: string };
  sections: ReportSection[];
}

export async function getSessionReport(sessionId: number, reportToken?: string): Promise<SessionReport> {
  const qs = reportToken ? `?report_token=${encodeURIComponent(reportToken)}` : ''
  return apiRequest<SessionReport>(`/sessions/${sessionId}/report${qs}`);
}

export async function resendReportEmail(sessionId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/sessions/${sessionId}/resend-report`, { method: 'POST' })
}

