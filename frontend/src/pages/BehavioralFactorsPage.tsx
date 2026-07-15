import { useEffect, useState, FormEvent } from 'react'
import {
  listBehaviouralFactors,
  createBehaviouralFactor,
  updateBehaviouralFactor,
  deleteBehaviouralFactor,
  BehaviouralFactor,
} from '../api/behavioralFactors'
import { listBehaviouralTypes, BehaviouralType } from '../api/behavioralTypes'
import { ApiError } from '../api/client'
import AdminLayout from '../components/AdminLayout'

export default function BehaviouralFactorsPage() {
  // ── Data State ───────────────────────────────────────────────────────────
  const [factors, setFactors] = useState<BehaviouralFactor[]>([])
  const [sections, setSections] = useState<BehaviouralType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Filter State ─────────────────────────────────────────────────────────
  const [filterSectionId, setFilterSectionId] = useState<number | 'ALL'>('ALL')

  // ── Create State ─────────────────────────────────────────────────────────
  const [newSectionId, setNewSectionId] = useState<number | ''>('')
  const [newName, setNewName] = useState('')
  const [newOrderIndex, setNewOrderIndex] = useState(0)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // ── Edit State ───────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editOrderIndex, setEditOrderIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // ── Delete State ─────────────────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<{ id: number; message: string } | null>(null)

  // ── Load Data ────────────────────────────────────────────────────────────
  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [factorsData, sectionsData] = await Promise.all([
        listBehaviouralFactors(),
        listBehaviouralTypes(),
      ])
      setFactors(factorsData)
      setSections(sectionsData)
      if (sectionsData.length > 0 && newSectionId === '') {
        setNewSectionId(sectionsData[0].id)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ── Actions ──────────────────────────────────────────────────────────────
  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!newSectionId) {
      setCreateError('Please select a section/subsection.')
      return
    }
    setCreateError(null)
    setCreating(true)
    try {
      await createBehaviouralFactor(Number(newSectionId), newName.trim(), newOrderIndex)
      setNewName('')
      setNewOrderIndex(0)
      // reload
      const factorsData = await listBehaviouralFactors()
      setFactors(factorsData)
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create factor.')
    } finally {
      setCreating(false)
    }
  }

  function startEditing(factor: BehaviouralFactor) {
    setEditingId(factor.id)
    setEditName(factor.name)
    setEditOrderIndex(factor.order_index)
    setEditError(null)
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
      await updateBehaviouralFactor(id, editName.trim(), editOrderIndex)
      setEditingId(null)
      // reload
      const factorsData = await listBehaviouralFactors()
      setFactors(factorsData)
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Failed to update factor.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteBehaviouralFactor(id)
      setConfirmDeleteId(null)
      // reload
      const factorsData = await listBehaviouralFactors()
      setFactors(factorsData)
    } catch (err) {
      setDeleteError({
        id,
        message: err instanceof ApiError ? err.message : 'Failed to delete factor.',
      })
    } finally {
      setDeleting(false)
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const filteredFactors = factors.filter((f) => {
    if (filterSectionId === 'ALL') return true
    return f.behavioural_type_id === Number(filterSectionId)
  })

  // Group factors by section for display
  const groupedSections = sections.map((sec) => {
    const secFactors = filteredFactors.filter((f) => f.behavioural_type_id === sec.id)
    return {
      ...sec,
      factors: secFactors,
    }
  }).filter((sec) => {
    // If filtering by specific section, only show that section
    if (filterSectionId !== 'ALL' && sec.id !== Number(filterSectionId)) {
      return false
    }
    return true
  })

  return (
    <AdminLayout title="Behavioural Factors">
      <div className="max-w-6xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Define and manage the traits and factors (e.g. Altruistic, Emotional) mapped to subsections.
          </p>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Section:</label>
            <select
              value={filterSectionId}
              onChange={(e) => setFilterSectionId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Sections</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.code} - {sec.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3 items-start">
          {/* Add Form */}
          <div className="bg-white shadow rounded-lg p-6 space-y-4 md:col-span-1">
            <h2 className="text-base font-semibold text-gray-800">Add Behavioural Factor</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Section / Subsection</label>
                <select
                  required
                  value={newSectionId}
                  onChange={(e) => setNewSectionId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.code} - {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Factor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Altruistic"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Order Index</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newOrderIndex}
                  onChange={(e) => setNewOrderIndex(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {createError && <p className="text-xs text-red-600">{createError}</p>}

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {creating ? 'Adding...' : 'Add Factor'}
              </button>
            </form>
          </div>

          {/* Factors List */}
          <div className="md:col-span-2 space-y-6">
            {loading && <p className="text-sm text-gray-500">Loading behavioural factors...</p>}

            {!loading && groupedSections.every((s) => s.factors.length === 0) && (
              <div className="bg-white shadow rounded-lg p-6 text-center text-sm text-gray-500">
                No behavioral factors found for the selected filter. Add one on the left.
              </div>
            )}

            {!loading &&
              groupedSections.map(
                (sec) =>
                  sec.factors.length > 0 && (
                    <div key={sec.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                      <div className="bg-slate-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-slate-800">
                          {sec.code} - {sec.name}
                        </h3>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          {sec.factors.length} factors
                        </span>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {sec.factors.map((factor) => (
                          <div key={factor.id} className="p-4 space-y-3">
                            {editingId === factor.id ? (
                              // Edit Mode
                              <div className="space-y-3 bg-gray-50 p-3 rounded border border-gray-200">
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Name</label>
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Order Index</label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={editOrderIndex}
                                      onChange={(e) => setEditOrderIndex(Number(e.target.value))}
                                      className="w-full border border-gray-300 rounded px-2.5 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                                {editError && <p className="text-xs text-red-600">{editError}</p>}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSave(factor.id)}
                                    disabled={saving}
                                    className="bg-blue-600 text-white rounded px-3 py-1.5 text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    {saving ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    disabled={saving}
                                    className="border border-gray-300 rounded px-3 py-1.5 text-xs hover:bg-white disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{factor.name}</p>
                                  <p className="text-xs text-gray-500">Order Index: {factor.order_index}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => startEditing(factor)}
                                    className="text-xs border border-gray-300 text-gray-700 rounded px-3 py-1 hover:bg-gray-50"
                                  >
                                    Edit
                                  </button>
                                  {confirmDeleteId === factor.id ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-red-600 font-medium">Delete?</span>
                                      <button
                                        onClick={() => handleDelete(factor.id)}
                                        disabled={deleting}
                                        className="bg-red-600 text-white rounded px-2.5 py-1 text-xs hover:bg-red-700 disabled:opacity-50"
                                      >
                                        {deleting ? '...' : 'Confirm'}
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        disabled={deleting}
                                        className="border border-gray-300 rounded px-2.5 py-1 text-xs hover:bg-white disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteId(factor.id)}
                                      className="text-xs border border-red-300 text-red-600 rounded px-3 py-1 hover:bg-red-50"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {deleteError?.id === factor.id && (
                              <p className="text-xs text-red-600 font-medium mt-1">{deleteError.message}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
              )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}