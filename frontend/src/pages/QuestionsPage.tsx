import { useEffect, useState, FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getForm, Form } from '../api/forms'
import {
  listBehaviouralTypes,
  createBehaviouralType,
  updateBehaviouralType,
  deleteBehaviouralType,
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

export default function QuestionsPage() {
  const { id } = useParams()
  const formId = id ? parseInt(id, 10) : 0

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Form | null>(null)
  const [sections, setSections] = useState<BehaviouralType[]>([])
  const [factors, setFactors] = useState<BehaviouralFactor[]>([])
  const [questions, setQuestions] = useState<Question[]>([])

  const [addingToSection, setAddingToSection] = useState<number | null>(null)
  const [newNumber, setNewNumber] = useState<number>(1)
  const [newOptionA, setNewOptionA] = useState('')
  const [newOptionB, setNewOptionB] = useState('')
  const [newFactorA, setNewFactorA] = useState<number | ''>('')
  const [newFactorB, setNewFactorB] = useState<number | ''>('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNumber, setEditNumber] = useState<number>(1)
  const [editOptionA, setEditOptionA] = useState('')
  const [editOptionB, setEditOptionB] = useState('')
  const [editFactorA, setEditFactorA] = useState<number | ''>('')
  const [editFactorB, setEditFactorB] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<{ id: number; message: string } | null>(null)

  const [newSectionCode, setNewSectionCode] = useState('')
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionInstructions, setNewSectionInstructions] = useState('')
  const [newSectionOrder, setNewSectionOrder] = useState(0)
  const [creatingSection, setCreatingSection] = useState(false)
  const [createSectionError, setCreateSectionError] = useState<string | null>(null)

  const [editingSectionId, setEditingSectionId] = useState<number | null>(null)
  const [editSectionCode, setEditSectionCode] = useState('')
  const [editSectionName, setEditSectionName] = useState('')
  const [editSectionInstructions, setEditSectionInstructions] = useState('')
  const [editSectionOrder, setEditSectionOrder] = useState(0)
  const [savingSection, setSavingSection] = useState(false)
  const [editSectionError, setEditSectionError] = useState<string | null>(null)
  const [confirmDeleteSectionId, setConfirmDeleteSectionId] = useState<number | null>(null)
  const [deletingSection, setDeletingSection] = useState(false)
  const [deleteSectionError, setDeleteSectionError] = useState<{ id: number; message: string } | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [formData, sectionsData, factorsData, questionsData] = await Promise.all([
        getForm(formId),
        listBehaviouralTypes(formId),
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
    return factors.filter((factor) => factor.behavioural_type_id === sectionId)
  }

  function getQuestionsForSection(sectionId: number) {
    return questions.filter((question) => question.behavioural_type_id === sectionId)
  }

  function handleStartAdding(sectionId: number) {
    setAddingToSection(sectionId)
    const existing = getQuestionsForSection(sectionId)
    const nextNumber = existing.length > 0 ? Math.max(...existing.map((question) => question.number)) + 1 : 1
    setNewNumber(nextNumber)
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
      const questionsData = await listQuestions({ form_id: formId })
      setQuestions(questionsData)
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create question.')
    } finally {
      setCreating(false)
    }
  }

  function handleStartEditing(question: Question) {
    setEditingId(question.id)
    setEditNumber(question.number)
    setEditOptionA(question.option_a_text)
    setEditOptionB(question.option_b_text)
    setEditFactorA(question.option_a_factor_id ?? '')
    setEditFactorB(question.option_b_factor_id ?? '')
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
      setDeleteError({ id, message: err instanceof ApiError ? err.message : 'Failed to delete question.' })
    } finally {
      setDeleting(false)
    }
  }

  async function handleCreateSection(e: FormEvent) {
    e.preventDefault()
    setCreateSectionError(null)
    setCreatingSection(true)
    try {
      await createBehaviouralType(
        newSectionCode.trim(),
        newSectionName.trim(),
        newSectionInstructions.trim(),
        newSectionOrder
      )
      setNewSectionCode('')
      setNewSectionName('')
      setNewSectionInstructions('')
      setNewSectionOrder(0)
      await loadData()
    } catch (err) {
      setCreateSectionError(err instanceof ApiError ? err.message : 'Failed to create section.')
    } finally {
      setCreatingSection(false)
    }
  }

  function handleStartEditingSection(section: BehaviouralType) {
    setEditingSectionId(section.id)
    setEditSectionCode(section.code)
    setEditSectionName(section.name)
    setEditSectionInstructions(section.instructions ?? '')
    setEditSectionOrder(section.order_index)
    setEditSectionError(null)
    setConfirmDeleteSectionId(null)
    setDeleteSectionError(null)
  }

  function handleCancelEditingSection() {
    setEditingSectionId(null)
    setEditSectionError(null)
  }

  async function handleSaveSection(id: number) {
    setSavingSection(true)
    setEditSectionError(null)
    try {
      await updateBehaviouralType(
        id,
        editSectionCode.trim(),
        editSectionName.trim(),
        editSectionInstructions.trim(),
        editSectionOrder
      )
      setEditingSectionId(null)
      await loadData()
    } catch (err) {
      setEditSectionError(err instanceof ApiError ? err.message : 'Failed to update section.')
    } finally {
      setSavingSection(false)
    }
  }

  function handleRequestDeleteSection(id: number) {
    setConfirmDeleteSectionId(id)
    setDeleteSectionError(null)
    setEditingSectionId(null)
  }

  function handleCancelDeleteSection() {
    setConfirmDeleteSectionId(null)
    setDeleteSectionError(null)
  }

  async function handleConfirmDeleteSection(id: number) {
    setDeletingSection(true)
    setDeleteSectionError(null)
    try {
      await deleteBehaviouralType(id)
      setConfirmDeleteSectionId(null)
      await loadData()
    } catch (err) {
      setDeleteSectionError({ id, message: err instanceof ApiError ? err.message : 'Failed to delete section.' })
    } finally {
      setDeletingSection(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Manage Form">
        <p className="text-gray-500">Loading form details...</p>
      </AdminLayout>
    )
  }

  if (error || !form) {
    return (
      <AdminLayout title="Manage Form">
        <p className="text-red-600">{error || 'Form not found'}</p>
        <Link to="/forms" className="text-blue-600 hover:underline mt-4 inline-block">
          &larr; Back to Forms
        </Link>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Manage Form">
      <div className="max-w-6xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to="/forms" className="text-blue-600 hover:underline text-sm inline-block mb-3">
              &larr; Back to Forms
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">{form.name}</h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage sections and questions for this form from one place.
            </p>
          </div>
          <Link to={`/forms/${form.id}`} className="rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            View Details
          </Link>
        </div>

        <form onSubmit={handleCreateSection} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Add a new section</h2>
            <span className="text-xs uppercase tracking-wide text-gray-400">Section / subsection</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Code</label>
              <input
                type="text"
                required
                value={newSectionCode}
                onChange={(e) => setNewSectionCode(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. A"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Name</label>
              <input
                type="text"
                required
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. Section A"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Description / instructions</label>
            <textarea
              value={newSectionInstructions}
              onChange={(e) => setNewSectionInstructions(e.target.value)}
              rows={3}
              className="w-full resize-y rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Add guidance shown for this subsection"
            />
          </div>
          <div className="w-32">
            <label className="mb-1 block text-sm text-gray-600">Order</label>
            <input
              type="number"
              min={0}
              value={newSectionOrder}
              onChange={(e) => setNewSectionOrder(Number(e.target.value))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {createSectionError && <p className="text-sm text-red-600">{createSectionError}</p>}
          <button
            type="submit"
            disabled={creatingSection}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creatingSection ? 'Creating...' : 'Create section'}
          </button>
        </form>

        <div className="space-y-6">
          {sections.map((section) => {
            const sectionQuestions = getQuestionsForSection(section.id)
            const sectionFactors = getFactorsForSection(section.id)
            return (
              <div key={section.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-slate-50 px-6 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {section.code} - {section.name}
                    </h2>
                    {section.instructions && (
                      <p className="mt-1 text-sm text-gray-500">{section.instructions}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEditingSection(section)}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-white"
                    >
                      Edit Section
                    </button>
                    {confirmDeleteSectionId === section.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Delete?</span>
                        <button
                          onClick={() => handleConfirmDeleteSection(section.id)}
                          disabled={deletingSection}
                          className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingSection ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          onClick={handleCancelDeleteSection}
                          disabled={deletingSection}
                          className="rounded border border-gray-300 px-2.5 py-1 text-xs hover:bg-white disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRequestDeleteSection(section.id)}
                        className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete Section
                      </button>
                    )}
                  </div>
                </div>

                {editingSectionId === section.id && (
                  <div className="border-b border-gray-200 bg-gray-50 p-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-gray-600">Code</label>
                        <input
                          type="text"
                          value={editSectionCode}
                          onChange={(e) => setEditSectionCode(e.target.value)}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-600">Name</label>
                        <input
                          type="text"
                          value={editSectionName}
                          onChange={(e) => setEditSectionName(e.target.value)}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">Description / instructions</label>
                      <textarea
                        value={editSectionInstructions}
                        onChange={(e) => setEditSectionInstructions(e.target.value)}
                        rows={3}
                        className="w-full resize-y rounded border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="w-32">
                      <label className="mb-1 block text-xs text-gray-600">Order</label>
                      <input
                        type="number"
                        min={0}
                        value={editSectionOrder}
                        onChange={(e) => setEditSectionOrder(Number(e.target.value))}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    {editSectionError && <p className="text-sm text-red-600">{editSectionError}</p>}
                    {deleteSectionError?.id === section.id && <p className="text-sm text-red-600">{deleteSectionError.message}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveSection(section.id)}
                        disabled={savingSection}
                        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingSection ? 'Saving...' : 'Save Section'}
                      </button>
                      <button
                        onClick={handleCancelEditingSection}
                        disabled={savingSection}
                        className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-white disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Questions</h3>
                    <button
                      onClick={() => handleStartAdding(section.id)}
                      className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      + Add Question
                    </button>
                  </div>

                  {addingToSection === section.id && (
                    <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                      <form onSubmit={(e) => handleCreateQuestion(e, section.id)} className="space-y-4">
                        <h3 className="text-sm font-semibold text-blue-900">New Question</h3>
                        <div className="grid gap-4 lg:grid-cols-12">
                          <div className="lg:col-span-2">
                            <label className="mb-1 block text-xs text-gray-600">Number</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={newNumber}
                              onChange={(e) => setNewNumber(parseInt(e.target.value, 10))}
                              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="space-y-3 lg:col-span-5">
                            <div>
                              <label className="mb-1 block text-xs text-gray-600">Option A Text</label>
                              <textarea
                                required
                                rows={2}
                                value={newOptionA}
                                onChange={(e) => setNewOptionA(e.target.value)}
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-600">Maps to Factor (Optional)</label>
                              <select
                                value={newFactorA}
                                onChange={(e) => setNewFactorA(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                              >
                                <option value="">-- None --</option>
                                {sectionFactors.map((factor) => (
                                  <option key={factor.id} value={factor.id}>
                                    {factor.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="space-y-3 lg:col-span-5">
                            <div>
                              <label className="mb-1 block text-xs text-gray-600">Option B Text</label>
                              <textarea
                                required
                                rows={2}
                                value={newOptionB}
                                onChange={(e) => setNewOptionB(e.target.value)}
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-600">Maps to Factor (Optional)</label>
                              <select
                                value={newFactorB}
                                onChange={(e) => setNewFactorB(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                              >
                                <option value="">-- None --</option>
                                {sectionFactors.map((factor) => (
                                  <option key={factor.id} value={factor.id}>
                                    {factor.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        {createError && <p className="text-xs text-red-600">{createError}</p>}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={creating}
                            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {creating ? 'Saving...' : 'Save Question'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelAdding}
                            disabled={creating}
                            className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-white disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="divide-y divide-gray-100">
                    {sectionQuestions.length === 0 && addingToSection !== section.id && (
                      <p className="py-4 text-sm text-gray-500">No questions in this section yet.</p>
                    )}
                    {sectionQuestions.map((question) => (
                      <div key={question.id}>
                        {editingId === question.id ? (
                          <div className="py-4">
                            <form onSubmit={(e) => handleSaveEdit(e, question.id)} className="space-y-4">
                              <h3 className="text-sm font-semibold text-gray-700">Edit Question {question.number}</h3>
                              <div className="grid gap-4 lg:grid-cols-12">
                                <div className="lg:col-span-2">
                                  <label className="mb-1 block text-xs text-gray-600">Number</label>
                                  <input
                                    type="number"
                                    required
                                    min={1}
                                    value={editNumber}
                                    onChange={(e) => setEditNumber(parseInt(e.target.value, 10))}
                                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                                  />
                                </div>
                                <div className="space-y-3 lg:col-span-5">
                                  <div>
                                    <label className="mb-1 block text-xs text-gray-600">Option A Text</label>
                                    <textarea
                                      required
                                      rows={2}
                                      value={editOptionA}
                                      onChange={(e) => setEditOptionA(e.target.value)}
                                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs text-gray-600">Maps to Factor (Optional)</label>
                                    <select
                                      value={editFactorA}
                                      onChange={(e) => setEditFactorA(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                                    >
                                      <option value="">-- None --</option>
                                      {sectionFactors.map((factor) => (
                                        <option key={factor.id} value={factor.id}>
                                          {factor.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="space-y-3 lg:col-span-5">
                                  <div>
                                    <label className="mb-1 block text-xs text-gray-600">Option B Text</label>
                                    <textarea
                                      required
                                      rows={2}
                                      value={editOptionB}
                                      onChange={(e) => setEditOptionB(e.target.value)}
                                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs text-gray-600">Maps to Factor (Optional)</label>
                                    <select
                                      value={editFactorB}
                                      onChange={(e) => setEditFactorB(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                                    >
                                      <option value="">-- None --</option>
                                      {sectionFactors.map((factor) => (
                                        <option key={factor.id} value={factor.id}>
                                          {factor.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                              {editError && <p className="text-xs text-red-600">{editError}</p>}
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={saving}
                                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditing}
                                  disabled={saving}
                                  className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-white disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4 py-4 md:flex-row md:items-start">
                            <div className="w-8 shrink-0 text-sm font-semibold text-gray-400">{question.number}.</div>
                            <div className="grid flex-1 gap-4 md:grid-cols-2">
                              <div className="rounded border border-gray-200 bg-gray-50 p-3">
                                <p className="text-sm font-medium text-gray-700">Option A</p>
                                <p className="mt-1 text-sm text-gray-600">{question.option_a_text}</p>
                                {question.option_a_factor_id && (
                                  <p className="mt-2 text-xs text-blue-600">
                                    Maps to: {factors.find((factor) => factor.id === question.option_a_factor_id)?.name || `Factor ${question.option_a_factor_id}`}
                                  </p>
                                )}
                              </div>
                              <div className="rounded border border-gray-200 bg-gray-50 p-3">
                                <p className="text-sm font-medium text-gray-700">Option B</p>
                                <p className="mt-1 text-sm text-gray-600">{question.option_b_text}</p>
                                {question.option_b_factor_id && (
                                  <p className="mt-2 text-xs text-blue-600">
                                    Maps to: {factors.find((factor) => factor.id === question.option_b_factor_id)?.name || `Factor ${question.option_b_factor_id}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col gap-2">
                              {confirmDeleteId === question.id ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-center text-[10px] font-medium text-red-600">Delete?</span>
                                  <button
                                    onClick={() => handleConfirmDelete(question.id)}
                                    disabled={deleting}
                                    className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    disabled={deleting}
                                    className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEditing(question)}
                                    className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleRequestDelete(question.id)}
                                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        {deleteError?.id === question.id && <p className="pb-2 text-xs text-red-600">{deleteError.message}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}