import { useEffect, useState, FormEvent } from 'react'
import {
  listBehaviouralTypes,
  createBehaviouralType,
  updateBehaviouralType,
  deleteBehaviouralType,
  BehaviouralType,
} from '../api/behavioralTypes'
import { ApiError } from '../api/client'
import AdminLayout from '../components/AdminLayout'

export default function BehaviouralTypesPage() {
  // ── List state ──────────────────────────────────────────────────────────
  const [types, setTypes] = useState<BehaviouralType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Create state ─────────────────────────────────────────────────────────
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newInstructions, setNewInstructions] = useState('')
  const [newOrderIndex, setNewOrderIndex] = useState(0)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // ── Edit state ───────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editCode, setEditCode] = useState('')
  const [editName, setEditName] = useState('')
  const [editInstructions, setEditInstructions] = useState('')
  const [editOrderIndex, setEditOrderIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // ── Delete state ─────────────────────────────────────────────────────────
  // Tracks which row is showing the "Are you sure?" confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<{ id: number; message: string } | null>(null)

  // ── Load ─────────────────────────────────────────────────────────────────
  async function loadTypes() {
    setLoading(true)
    setError(null)
    try {
      const data = await listBehaviouralTypes()
      setTypes(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load behavioural types.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTypes()
  }, [])

  // ── Create ────────────────────────────────────────────────────────────────
  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      await createBehaviouralType(newCode.trim(), newName.trim(), newInstructions.trim(), newOrderIndex)
      setNewCode('')
      setNewName('')
      setNewInstructions('')
      setNewOrderIndex(0)
      await loadTypes()
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create behavioural type.')
    } finally {
      setCreating(false)
    }
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  function startEditing(bt: BehaviouralType) {
    setEditingId(bt.id)
    setEditCode(bt.code)
    setEditName(bt.name)
    setEditInstructions(bt.instructions ?? '')
    setEditOrderIndex(bt.order_index)
    setEditError(null)
    // dismiss any delete confirmation on the same row
    setConfirmDeleteId(null)
    setDeleteError(null)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditError(null)
  }

  async function handleSave(id: number) {
    setSaving(true)
    setEditError(null)
    try {
      await updateBehaviouralType(id, editCode.trim(), editName.trim(), editInstructions.trim(), editOrderIndex)
      setEditingId(null)
      await loadTypes()
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Failed to update behavioural type.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  function requestDelete(id: number) {
    setConfirmDeleteId(id)
    setDeleteError(null)
    // close any open edit form
    setEditingId(null)
  }

  function cancelDelete() {
    setConfirmDeleteId(null)
    setDeleteError(null)
  }

  async function confirmDelete(id: number) {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteBehaviouralType(id)
      setConfirmDeleteId(null)
      await loadTypes()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete behavioural type.'
      setDeleteError({ id, message })
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Behavioural Types">
      <div className="max-w-4xl space-y-8">

        {/* ── Create form ─────────────────────────────────────────────── */}
        <form onSubmit={handleCreate} className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">Add a new behavioural type</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Code</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. OB"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Openness to Behaviour"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Instructions (optional)</label>
            <textarea
              value={newInstructions}
              onChange={(e) => setNewInstructions(e.target.value)}
              rows={3}
              placeholder="Instructions shown to the user during this section..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          <div className="w-32">
            <label className="block text-sm text-gray-600 mb-1">Order index</label>
            <input
              type="number"
              value={newOrderIndex}
              onChange={(e) => setNewOrderIndex(Number(e.target.value))}
              min={0}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {createError && <p className="text-sm text-red-600">{createError}</p>}

          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create behavioural type'}
          </button>
        </form>

        {/* ── List ────────────────────────────────────────────────────── */}
        <div className="bg-white shadow rounded-lg divide-y">
          {loading && <p className="p-6 text-sm text-gray-500">Loading behavioural types...</p>}
          {error && <p className="p-6 text-sm text-red-600">{error}</p>}
          {!loading && !error && types.length === 0 && (
            <p className="p-6 text-sm text-gray-500">No behavioural types yet. Create one above.</p>
          )}

          {!loading && !error && types.map((bt) => (
            <div key={bt.id}>

              {/* Row — normal view */}
              {editingId !== bt.id && (
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block bg-slate-100 text-slate-700 text-xs font-mono font-semibold px-2 py-0.5 rounded">
                        {bt.code}
                      </span>
                      <p className="text-sm font-medium text-gray-800">{bt.name}</p>
                      <span className="text-xs text-gray-400 ml-auto">order: {bt.order_index}</span>
                    </div>
                    {bt.instructions && (
                      <p className="text-xs text-gray-500 truncate">{bt.instructions}</p>
                    )}
                    {/* Delete error for this row */}
                    {deleteError?.id === bt.id && (
                      <p className="text-xs text-red-600 mt-1">{deleteError.message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {confirmDeleteId === bt.id ? (
                      /* Inline delete confirmation */
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Are you sure?</span>
                        <button
                          onClick={() => confirmDelete(bt.id)}
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
                      <>
                        <button
                          onClick={() => startEditing(bt)}
                          className="text-xs border border-gray-300 rounded px-3 py-1 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => requestDelete(bt.id)}
                          className="text-xs border border-red-300 text-red-600 rounded px-3 py-1 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Row — inline edit form */}
              {editingId === bt.id && (
                <div className="p-4 bg-gray-50 space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Editing ID {bt.id}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Code</label>
                      <input
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Instructions</label>
                    <textarea
                      value={editInstructions}
                      onChange={(e) => setEditInstructions(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-xs text-gray-600 mb-1">Order index</label>
                    <input
                      type="number"
                      value={editOrderIndex}
                      onChange={(e) => setEditOrderIndex(Number(e.target.value))}
                      min={0}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {editError && <p className="text-xs text-red-600">{editError}</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(bt.id)}
                      disabled={saving}
                      className="bg-blue-600 text-white rounded px-3 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={saving}
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm hover:bg-white disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}