import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSessions, deleteSession, Session } from '../api/sessions'
import { ApiError } from '../api/client'
import AdminLayout from '../components/AdminLayout'

const STATUS_LABELS: Record<Session['status'], string> = {
  in_progress: 'In Progress',
  submitted: 'Submitted',
}

const STATUS_STYLES: Record<Session['status'], string> = {
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-green-100 text-green-700',
}

export default function SessionsPage() {
  // ── List state ──────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Filters ───────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<'' | 'in_progress' | 'submitted'>('')

  // ── Delete state ──────────────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<{ id: number; message: string } | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────
  async function loadSessions() {
    setLoading(true)
    setError(null)
    try {
      const data = await listSessions(statusFilter ? { status_filter: statusFilter } : undefined)
      setSessions(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load sessions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  // ── Delete ────────────────────────────────────────────────────────────
  function requestDelete(id: number) {
    setConfirmDeleteId(id)
    setDeleteError(null)
  }

  function cancelDelete() {
    setConfirmDeleteId(null)
    setDeleteError(null)
  }

  async function confirmDelete(id: number) {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteSession(id)
      setConfirmDeleteId(null)
      await loadSessions()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete session.'
      setDeleteError({ id, message })
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Sessions">
      <div className="max-w-4xl space-y-6">

        {/* ── Filter bar ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Filter by status:</span>
          {(['', 'in_progress', 'submitted'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                statusFilter === value
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {value === '' ? 'All' : STATUS_LABELS[value]}
            </button>
          ))}

          <button
            onClick={loadSessions}
            className="ml-auto text-xs border border-gray-300 rounded px-3 py-1 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {/* ── Session list ─────────────────────────────────────────── */}
        <div className="bg-white shadow rounded-lg divide-y">
          {loading && <p className="p-6 text-sm text-gray-500">Loading sessions...</p>}
          {error && <p className="p-6 text-sm text-red-600">{error}</p>}
          {!loading && !error && sessions.length === 0 && (
            <p className="p-6 text-sm text-gray-500">No sessions found.</p>
          )}

          {!loading && !error && sessions.map((session) => (
            <div key={session.id} className="p-4 flex items-center justify-between gap-4">

              {/* Session info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">Session #{session.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[session.status]}`}>
                    {STATUS_LABELS[session.status]}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {session.product_type}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  User ID: {session.user_id} &nbsp;·&nbsp; Form ID: {session.form_id}
                </p>
                {deleteError?.id === session.id && (
                  <p className="text-xs text-red-600">{deleteError.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="shrink-0 flex items-center gap-2">
                {session.status === 'submitted' && (
                  <Link
                    to={`/sessions/${session.id}/results`}
                    className="text-xs border border-blue-300 text-blue-600 rounded px-3 py-1 hover:bg-blue-50"
                  >
                    View Results
                  </Link>
                )}
                {confirmDeleteId === session.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Delete this session?</span>
                    <button
                      onClick={() => confirmDelete(session.id)}
                      disabled={deleting}
                      className="text-xs bg-red-600 text-white rounded px-2 py-1 hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button
                      onClick={cancelDelete}
                      disabled={deleting}
                      className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => requestDelete(session.id)}
                    className="text-xs border border-red-300 text-red-600 rounded px-3 py-1 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>

      </div>
    </AdminLayout>
  )
}