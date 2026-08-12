import { apiRequest } from './client'

export interface DuplicateFlag {
    id: number
    new_session_id: number
    new_user_id: number
    prior_registry_id: number
    prior_session_id: number
    match_type: string
    match_confidence: string
    status: string
    reviewed_by: number | null
    reviewed_at: string | null
    review_note: string | null
    created_at: string
}

export async function listDuplicateFlags(status: string = 'PENDING'): Promise<DuplicateFlag[]> {
    return apiRequest<DuplicateFlag[]>(`/admin/duplicates?status=${status}`)
}

export async function reviewDuplicateFlag(flagId: number, decision: 'APPROVED' | 'REJECTED', note?: string): Promise<DuplicateFlag> {
    return apiRequest<DuplicateFlag>(`/admin/duplicates/${flagId}/review`, {
        method: 'POST',
        body: { decision, note }
    })
}
