import { useEffect, useState, FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getForm, Form } from '../api/forms'
import {
  listBehaviouralTypes,
  BehaviouralType,
} from '../api/behavioralTypes'
import {
  listBehaviouralFactors,
  BehaviouralFactor,
} from '../api/behavioralFactors'
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  Question,
} from '../api/questions'
import AdminLayout from '../components/AdminLayout'

export default function FormBuilderPage() {
  const { id } = useParams()
  const formId = id ? parseInt(id, 10) : 0

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Form | null>(null)
  const [sections, setSections] = useState<BehaviouralType[]>([])
  const [factors, setFactors] = useState<BehaviouralFactor[]>([])
  const [questions, setQuestions] = useState<Question[]>([])

  // State to toggle the "Add Question" form under a specific section
  const [addingToSection, setAddingToSection] = useState<number | null>(null)

  // Add Question state
  const [newNumber, setNewNumber] = useState<number>(1)
  const [newOptionA, setNewOptionA] = useState('')
  const [newOptionB, setNewOptionB] = useState('')
  const [newFactorA, setNewFactorA] = useState<number | ''>('')
  const [newFactorB, setNewFactorB] = useState<number | ''>('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit Question state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNumber, setEditNumber] = useState<number>(1)
  const [editOptionA, setEditOptionA] = useState('')
  const [editOptionB, setEditOptionB] = useState('')
  const [editFactorA, setEditFactorA] = useState<number | ''>('')
  const [editFactorB, setEditFactorB] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete Question state
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<{ id: number; message: string } | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [formData, sectionsData, factorsData, questionsData] = await Promise.all([
        getForm(formId),
        listBehaviouralTypes(),
        listBehaviouralFactors(),
        listQuestions({ form_id: formId }),
      ])
      setForm(formData)
      setSections(sectionsData)
      setFactors(factorsData)
      setQuestions(questionsData)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load form data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (formId) {
      loadData()
    }
  }, [formId])

  function getFactorsForSection(sectionId: number) {
    return factors.filter((f) => f.behavioural_type_id === sectionId)
  }

  function getQuestionsForSection(sectionId: number) {
    return questions.filter((q) => q.behavioural_type_id === sectionId)
  }

  function handleStartAdding(sectionId: number) {
    setAddingToSection(sectionId)
    // Suggest the next number
    const existing = getQuestionsForSection(sectionId)
    const nextNum = existing.length > 0 ? Math.max(...existing.map((q) => q.number)) + 1 : 1
    setNewNumber(nextNum)
    setNewOptionA('')
    setNewOptionB('')
    setNewFactorA('')
    setNewFactorB('')
    setCreateError(null)
  }

  function handleCancelAdding() {
    setAddingToSection(null)
  }

  async function handleCreateQuestion(e: FormEvent, sectionId: number) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      await createQuestion(
        formId,
        sectionId,
        newNumber,
        newOptionA.trim(),
        newOptionB.trim(),
        newFactorA === '' ? null : newFactorA,
        newFactorB === '' ? null : newFactorB
      )
      setAddingToSection(null)
      // Reload questions
      const questionsData = await listQuestions({ form_id: formId })
      setQuestions(questionsData)
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create question.')
    } finally {
      setCreating(false)
    }
  }

  function handleStartEditing(q: Question) {
    setEditingId(q.id)
    setEditNumber(q.number)
    setEditOptionA(q.option_a_text)
    setEditOptionB(q.option_b_text)
    setEditFactorA(q.option_a_factor_id ?? '')
    setEditFactorB(q.option_b_factor_id ?? '')
    setEditError(null)
    setAddingToSection(null)
    setConfirmDeleteId(null)
  }

  function handleCancelEditing() {
    setEditingId(null)
  }

  async function handleSaveEdit(e: FormEvent, id: number) {
    e.preventDefault()
    setSaving(true)
    setEditError(null)
    try {
      await updateQuestion(id, {
        number: editNumber,
        option_a_text: editOptionA.trim(),
        option_b_text: editOptionB.trim(),
        option_a_factor_id: editFactorA === '' ? null : editFactorA,
        option_b_factor_id: editFactorB === '' ? null : editFactorB,
      })
      setEditingId(null)
      const questionsData = await listQuestions({ form_id: formId })
      setQuestions(questionsData)
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Failed to update question.')
    } finally {
      setSaving(false)
    }
  }

  function handleRequestDelete(id: number) {
    setConfirmDeleteId(id)
    setDeleteError(null)
    setEditingId(null)
  }

  async function handleConfirmDelete(id: number) {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteQuestion(id)
      setConfirmDeleteId(null)
      const questionsData = await listQuestions({ form_id: formId })
      setQuestions(questionsData)
    } catch (err) {
      setDeleteError({
        id,
        message: err instanceof ApiError ? err.message : 'Failed to delete question.',
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Form Builder">
        <p className="text-gray-500">Loading form details...</p>
      </AdminLayout>
    )
  }

  if (error || !form) {
    return (
      <AdminLayout title="Form Builder">
        <p className="text-red-600">{error || 'Form not found'}</p>
        <Link to="/forms" className="text-blue-600 hover:underline mt-4 inline-block">
          &larr; Back to Forms
        </Link>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Form Builder">
      <div className="max-w-5xl space-y-8">
        <div>
          <Link to="/forms" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
            &larr; Back to Forms
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {form.name} <span className="text-gray-400 font-normal text-lg ml-2">ID: {form.id}</span>
          </h1>
          {form.is_active && (
            <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Active Form
            </span>
          )}
        </div>

        {sections.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-yellow-800 text-sm">
            You don't have any Behavioural Types (Sections) defined yet.{' '}
            Create one from the section editor above.
          </div>
        ) : (
          <div className="space-y-12">
            {sections.map((section) => {
              const sectionQuestions = getQuestionsForSection(section.id)
              const sectionFactors = getFactorsForSection(section.id)

              return (
                <div key={section.id} className="bg-white shadow rounded-lg overflow-hidden">
                  {/* Section Header */}
                  <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {section.code} - {section.name}
                      </h2>
                      {section.instructions && (
                        <p className="text-sm text-gray-500 mt-1">{section.instructions}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleStartAdding(section.id)}
                      className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-700"
                    >
                      + Add Question
                    </button>
                  </div>

                  {/* Add Question Form */}
                  {addingToSection === section.id && (
                    <div className="p-6 bg-blue-50 border-b border-blue-100">
                      <form onSubmit={(e) => handleCreateQuestion(e, section.id)} className="space-y-4">
                        <h3 className="text-sm font-semibold text-blue-900">New Question</h3>

                        <div className="grid grid-cols-12 gap-4 items-start">
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">Number</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={newNumber}
                              onChange={(e) => setNewNumber(parseInt(e.target.value, 10))}
                              className="w-full border rounded px-2 py-1.5 text-sm"
                            />
                          </div>
                          
                          <div className="col-span-5 space-y-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Option A Text</label>
                              <textarea
                                required
                                rows={2}
                                value={newOptionA}
                                onChange={(e) => setNewOptionA(e.target.value)}
                                className="w-full border rounded px-2 py-1.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Maps to Factor (Optional)</label>
                              <select
                                value={newFactorA}
                                onChange={(e) => setNewFactorA(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                className="w-full border rounded px-2 py-1.5 text-sm"
                              >
                                <option value="">-- None --</option>
                                {sectionFactors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="col-span-5 space-y-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Option B Text</label>
                              <textarea
                                required
                                rows={2}
                                value={newOptionB}
                                onChange={(e) => setNewOptionB(e.target.value)}
                                className="w-full border rounded px-2 py-1.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Maps to Factor (Optional)</label>
                              <select
                                value={newFactorB}
                                onChange={(e) => setNewFactorB(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                className="w-full border rounded px-2 py-1.5 text-sm"
                              >
                                <option value="">-- None --</option>
                                {sectionFactors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>

                        {createError && <p className="text-xs text-red-600">{createError}</p>}

                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            disabled={creating}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {creating ? 'Saving...' : 'Save Question'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelAdding}
                            disabled={creating}
                            className="text-xs border px-3 py-1.5 rounded hover:bg-white disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* List Questions */}
                  <div className="divide-y">
                    {sectionQuestions.length === 0 && addingToSection !== section.id && (
                      <p className="p-6 text-sm text-gray-500 italic">No questions in this section yet.</p>
                    )}
                    {sectionQuestions.map((q) => (
                      <div key={q.id}>
                        {editingId === q.id ? (
                          /* Edit Question Form */
                          <div className="p-6 bg-gray-50 space-y-4">
                            <form onSubmit={(e) => handleSaveEdit(e, q.id)}>
                              <h3 className="text-sm font-semibold text-gray-700 mb-4">Edit Question {q.number}</h3>

                              <div className="grid grid-cols-12 gap-4 items-start mb-4">
                                <div className="col-span-2">
                                  <label className="block text-xs text-gray-600 mb-1">Number</label>
                                  <input
                                    type="number"
                                    required
                                    min={1}
                                    value={editNumber}
                                    onChange={(e) => setEditNumber(parseInt(e.target.value, 10))}
                                    className="w-full border rounded px-2 py-1.5 text-sm"
                                  />
                                </div>
                                
                                <div className="col-span-5 space-y-3">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Option A Text</label>
                                    <textarea
                                      required
                                      rows={2}
                                      value={editOptionA}
                                      onChange={(e) => setEditOptionA(e.target.value)}
                                      className="w-full border rounded px-2 py-1.5 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Maps to Factor (Optional)</label>
                                    <select
                                      value={editFactorA}
                                      onChange={(e) => setEditFactorA(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                      className="w-full border rounded px-2 py-1.5 text-sm"
                                    >
                                      <option value="">-- None --</option>
                                      {sectionFactors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                  </div>
                                </div>

                                <div className="col-span-5 space-y-3">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Option B Text</label>
                                    <textarea
                                      required
                                      rows={2}
                                      value={editOptionB}
                                      onChange={(e) => setEditOptionB(e.target.value)}
                                      className="w-full border rounded px-2 py-1.5 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Maps to Factor (Optional)</label>
                                    <select
                                      value={editFactorB}
                                      onChange={(e) => setEditFactorB(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                      className="w-full border rounded px-2 py-1.5 text-sm"
                                    >
                                      <option value="">-- None --</option>
                                      {sectionFactors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {editError && <p className="text-xs text-red-600 mb-4">{editError}</p>}

                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={saving}
                                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditing}
                                  disabled={saving}
                                  className="text-xs border px-3 py-1.5 rounded hover:bg-white disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          /* View Question Row */
                          <div className="p-4 flex gap-4 hover:bg-gray-50 transition">
                            <div className="w-8 shrink-0 text-gray-400 font-medium pt-1">
                              {q.number}.
                            </div>
                            
                            <div className="flex-1 grid grid-cols-2 gap-6">
                              <div>
                                <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border">{q.option_a_text}</p>
                                {q.option_a_factor_id && (
                                  <p className="text-xs text-blue-600 mt-1 pl-1">
                                    ↳ {factors.find(f => f.id === q.option_a_factor_id)?.name || `Factor ID: ${q.option_a_factor_id}`}
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded border">{q.option_b_text}</p>
                                {q.option_b_factor_id && (
                                  <p className="text-xs text-blue-600 mt-1 pl-1">
                                    ↳ {factors.find(f => f.id === q.option_b_factor_id)?.name || `Factor ID: ${q.option_b_factor_id}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="shrink-0 flex flex-col gap-2 w-24">
                              {confirmDeleteId === q.id ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-red-600 font-medium text-center">Are you sure?</span>
                                  <button
                                    onClick={() => handleConfirmDelete(q.id)}
                                    disabled={deleting}
                                    className="text-xs bg-red-600 text-white rounded px-2 py-1 hover:bg-red-700 disabled:opacity-50"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    disabled={deleting}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEditing(q)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 w-full"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleRequestDelete(q.id)}
                                    className="text-xs border border-red-300 text-red-600 rounded px-2 py-1 hover:bg-red-50 w-full"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        {deleteError?.id === q.id && (
                          <div className="px-16 pb-4">
                            <p className="text-xs text-red-600">{deleteError.message}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
