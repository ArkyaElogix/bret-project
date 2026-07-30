import { listSessions, deleteSession, Session } from '../api/sessions'

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import AdminLayout from '../components/AdminLayout'
import { ApiError } from '../api/client'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  async function handleDelete(id: number) {
    if (!window.confirm('Are you sure you want to completely delete this session? This action cannot be undone.')) {
      return
    }

    try {
      await deleteSession(id)
      // Remove the deleted session from the local state to update the UI immediately
      setSessions(sessions.filter((s) => s.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete session.')
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listSessions()
        setSessions(data)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load sessions.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <AdminLayout title="Sessions">
        <p className="text-sm text-gray-500">Loading sessions...</p>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Sessions">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Sessions">
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center text-sm text-gray-500">
            No sessions found.
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Form</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 text-sm text-gray-700">{session.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{session.user_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{session.form_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{session.status}</td>
                    <td className="px-6 py-4 text-sm text-blue-600">
                      <Link to={`/sessions/${session.id}/results`} className={"hover:underline text-xs px-3 py-1 rounded bg-blue-100 text-blue-800 disabled:opacity-50"}>
                        View Results
                      </Link>
                      <button onClick={() => handleDelete(session.id)} className=' hover:underline text-xs px-3 py-1 rounded bg-red-100 text-red-800 disabled:opacity-50'>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}