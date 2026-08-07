import { apiRequest } from './client'

export interface SessionActivityEvent {
    id: number
    session_id: number
    action: string
    detail: string | null
    created_at: string
}

export interface BehaviouralFlag {
    type: string
    message: string
}

export interface ActivitySummary {
    total_events: number
    first_event_at: string | null
    last_event_at: string | null
    total_active_minutes: number
    answer_count: number
    answer_change_count: number
    session_resumes: number
    avg_seconds_per_answer: number
    fastest_answer_seconds: number
    slowest_answer_seconds: number
    idle_gaps: { after_event_id: number; gap_minutes: number }[]
    flags: BehaviouralFlag[]
}

export interface SessionActivity {
    events: SessionActivityEvent[]
    summary: ActivitySummary
}

export async function getSessionActivity(sessionId: number): Promise<SessionActivity> {
    return apiRequest<SessionActivity>(`/sessions/${sessionId}/activity`)
}
