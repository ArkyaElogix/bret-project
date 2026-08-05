//This page is for the admin's pov. 

import { listSessions, deleteSession, Session } from '../api/sessions'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import AdminLayout from '../components/AdminLayout'
import { ApiError } from '../api/client'

function formatSessionStatus(status: Session['status']) {
  switch (status) {
    case 'in_progress':
      return 'In progress'
    case 'submitted':
      return 'Submitted'
    default:
      return String(status)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase())
  }
}

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
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading sessions...</p>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Sessions">
        <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-700 dark:border-red-900 dark:text-red-300 rounded-lg p-4">
          {error}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Sessions">
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center text-sm text-gray-600 dark:bg-gray-800 dark:border dark:border-gray-700 dark:text-gray-300">
            No sessions found.
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden dark:bg-gray-800 dark:border dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">Form</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-800 dark:divide-gray-700">
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{session.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{session.user_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{session.form_name}</td>
                    <td className="px-6 py-4 text-sm">
  <span
    className={
      session.status === 'in_progress'
        ? 'inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-800 px-2.5 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-400'
        : 'inline-flex items-center rounded-full bg-green-100 dark:bg-green-800 px-2.5 py-1 text-xs font-medium text-green-800 dark:text-green-400'
    }
  >
    {formatSessionStatus(session.status)}
  </span>
</td>
                    <td className="px-6 py-4 text-sm text-blue-700 dark:text-blue-300">
                      <Link to={`/sessions/${session.id}/results`} className={"hover:underline text-xs px-3 py-1 rounded bg-blue-100 dark:bg-blue-800 dark:text-blue-300 text-blue-800 disabled:opacity-50"}>
                        View Results
                      </Link>
                      <button onClick={() => handleDelete(session.id)} className=' hover:underline text-xs px-3 py-1 rounded bg-red-100 dark:bg-red-800 dark:text-red-400 text-red-800 disabled:opacity-50'>
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
