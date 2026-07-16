import { useEffect, useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { listForms, createForm, deleteForm, updateForm, Form } from '../api/forms'
import { ApiError } from '../api/client'

import AdminLayout from '../components/AdminLayout'

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newIsActive, setNewIsActive] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<{ id: number; message: string } | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  async function handleToggleActive(form:Form){
    setTogglingId(form.id)
    try {
      await updateForm(form.id, form.name,!form.is_active )
      await loadForms()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to toggle active status.')
    } finally {
      setTogglingId(null)
    }
  }

  async function loadForms() {
    setLoading(true)
    setError(null)
    try {
      const data = await listForms()
      setForms(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load forms.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForms()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      await createForm(newName, newIsActive)
      setNewName('')
      setNewIsActive(false)
      await loadForms() // refresh the list to show the new one
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create form.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: number) {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteForm(id)
      setConfirmDeleteId(null)
      await loadForms()
    } catch (err) {
      setDeleteError({ id, message: err instanceof ApiError ? err.message : 'Failed to delete form.' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout title="Forms">
      <div className="max-w-4xl space-y-8">
        <h1 className="text-xl font-semibold text-gray-800">Forms</h1>

        {/* Create form */}
        <form onSubmit={handleCreate} className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">Create a new form</h2>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. BRET v2"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={newIsActive}
              onChange={(e) => setNewIsActive(e.target.checked)}
            />
            Set as active form
          </label>

          {createError && <p className="text-sm text-red-600">{createError}</p>}

          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create form'}
          </button>
        </form>

        {/* List */}
        <div className="bg-white shadow rounded-lg divide-y">
          {loading && <p className="p-6 text-sm text-gray-500">Loading forms...</p>}
          {error && <p className="p-6 text-sm text-red-600">{error}</p>}
          {!loading && !error && forms.length === 0 && (
            <p className="p-6 text-sm text-gray-500">No forms yet. Create one above.</p>
          )}
          {!loading &&
            !error &&
            forms.map((form) => (
              <div key={form.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{form.name}</p>
                  <p className="text-xs text-gray-500">ID: {form.id}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/*form.is_active && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Active
                    </span>
                  )*/}
                  <button
                    onClick={() => handleToggleActive(form)}
                    disabled={togglingId === form.id}
                    className={`text-xs px-3 py-1 rounded ${form.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}
                  > Active: {form.is_active ? 'Yes' : 'No'}
                  </button>
                  <Link
                    to={`/forms/${form.id}`}
                    className="text-xs border border-blue-300 text-blue-600 rounded px-3 py-1 hover:bg-blue-50"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/forms/${form.id}/edit`}
                    className="text-xs border border-slate-300 text-slate-700 rounded px-3 py-1 hover:bg-slate-50"
                  >
                    Manage Form
                  </Link>
                  {confirmDeleteId === form.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 font-medium">Delete?</span>
                      <button
                        onClick={() => handleDelete(form.id)}
                        disabled={deleting}
                        className="text-xs bg-red-600 text-white rounded px-2.5 py-1 hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleting ? '...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => { setConfirmDeleteId(null); setDeleteError(null) }}
                        disabled={deleting}
                        className="text-xs border border-gray-300 rounded px-2.5 py-1 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmDeleteId(form.id); setDeleteError(null) }}
                      className="text-xs border border-red-300 text-red-600 rounded px-3 py-1 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
                {deleteError?.id === form.id && (
                  <p className="text-xs text-red-600 mt-1 text-right">{deleteError.message}</p>
                )}
              </div>
            ))}
        </div>
      </div>
    </AdminLayout>
  )
}