import { useEffect, useState, FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
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
  const [newFactorA, setNewFactorA] = useState<number>(0)
  const [newFactorB, setNewFactorB] = useState<number>(0)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNumber, setEditNumber] = useState<number>(1)
  const [editOptionA, setEditOptionA] = useState('')
  const [editOptionB, setEditOptionB] = useState('')
  const [editFactorA, setEditFactorA] = useState<number>(0)
  const [editFactorB, setEditFactorB] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<{ id: number; message: string } | null>(null)

  const [newSectionCode, setNewSectionCode] = useState('')
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionInstructions, setNewSectionInstructions] = useState('')
  const [newSectionOrder, setNewSectionOrder] = useState(0)

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
    return factors.filter((factor) => factor.behavioural_type_id === sectionId)
  }
  function isSectionAtMaxQuestions(sectionId: number) {
  return getQuestionsForSection(sectionId).length >= 10
}
  function getQuestionsForSection(sectionId: number) {
    return questions.filter((question) => question.behavioural_type_id === sectionId)
  }

  function getCompletionStatus() {
  if (sections.length !== 3) {
    return {
      isComplete: false,
      message: 'This Questionnaire needs 3 sections before it can be activated.',
    }
  }

  const sectionStatus = sections.map((section) => ({
    section,
    count: getQuestionsForSection(section.id).length,
  }))

  const incompleteSection = sectionStatus.find((item) => item.count !== 10)

  if (incompleteSection) {
    return {
      isComplete: false,
      message: `${incompleteSection.section.code} needs ${incompleteSection.count}/10 questions before activation.`,
    }
  }

  return {
    isComplete: true,
    message: 'Complete and ready to activate.',
  }
}

  function getFactorUsageCount(
    sectionId: number,
    factorId: number,
    excludeQuestionId?: number
  ): number {
    const qs = getQuestionsForSection(sectionId).filter(
      (q) => q.id !== excludeQuestionId
    )
    let count = 0
    for (const q of qs) {
      if (q.option_a_factor_id === factorId) count++
      if (q.option_b_factor_id === factorId) count++
    }
    return count
  }
  function handleStartAdding(sectionId: number) {
  const existing = getQuestionsForSection(sectionId)
  if (existing.length >= 10) {
    setCreateError('This section already has the maximum of 10 questions.')
    return
  }

  setAddingToSection(sectionId)
  const nextNumber =
    existing.length > 0
      ? Math.max(...existing.map((question) => question.number)) + 1
      : 1
  setNewNumber(nextNumber)
  setNewOptionA('')
  setNewOptionB('')
  const factors = getFactorsForSection(sectionId)
  const defaultFactor = factors.length > 0 ? factors[0].id : 0
  setNewFactorA(defaultFactor)
  setNewFactorB(defaultFactor)
  setCreateError(null)
}

  function handleCancelAdding() {
    setAddingToSection(null)
  }

  async function handleCreateQuestion(e: FormEvent, sectionId: number) {
  e.preventDefault()
  setCreateError(null)

  const existing = getQuestionsForSection(sectionId)
  if (existing.length >= 10) {
    setCreateError('This section already has the maximum of 10 questions.')
    return
  }

  setCreating(true)
  try {
    await createQuestion(
      formId,
      sectionId,
      newNumber,
      newOptionA.trim(),
      newOptionB.trim(),
      newFactorA,
      newFactorB
    )
    setAddingToSection(null)
    await loadData()
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
    setEditFactorA(question.option_a_factor_id ?? 0)
    setEditFactorB(question.option_b_factor_id ?? 0)
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
        option_a_factor_id: editFactorA,
        option_b_factor_id: editFactorB,
      })
      setEditingId(null)
      await loadData()
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
      await loadData()
    } catch (err) {
      setDeleteError({ id, message: err instanceof ApiError ? err.message : 'Failed to delete question.' })
    } finally {
      setDeleting(false)
    }
  }


  if (loading) {
    return (
      <AdminLayout title="Manage Form">
        <p className="text-gray-600 dark:text-gray-200">Loading form details...</p>
      </AdminLayout>
    )
  }

  if (error || !form) {
    return (
      <AdminLayout title="Manage Form">
        <p className="text-red-600 dark:text-red-200">{error || 'Form not found'}</p>
        <Link to="/forms" className="text-blue-600 hover:underline mt-4 inline-block">
          &larr; Back to Forms
        </Link>
      </AdminLayout>
    )
  }

  function FactorReference() {
    return (
    <aside className="self-start rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:sticky lg:top-6">
        <details open>
          <summary className="cursor-pointer list-none border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
            Available Factors
          </summary>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
            {sections.map((section) => {
              const sectionFactors = getFactorsForSection(section.id)

              return (
                <div key={section.id} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    {section.code} - {section.name}
                  </h3>

                  {sectionFactors.length === 0 ? (
                    <p className="text-xs text-gray-700 dark:text-gray-200">No factors configured.</p>
                  ) : (
                    <ul className="space-y-1">
                      {sectionFactors.map((factor) => (
                        <li
                          key={factor.id}
                          className="rounded border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-200"
                        >
                          {factor.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </details>
      </aside>
    )
  }

  const completionStatus = getCompletionStatus()

  return (
    <AdminLayout title="Manage Questionnaire">
      <div className="max-w-7xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to="/forms" className="text-blue-600 dark:text-blue-200 hover:underline text-sm inline-block mb-3">
              &larr; Back to Questionnaire's page
            </Link>
            {/* <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{form.name}</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-100">
              Manage sections and questions for this form from one place.
            </p> */}

            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
  {form.name}
  <span className="ml-2 text-lg font-normal text-gray-400">ID: {form.id}</span>
</h1>

<div className="mt-2 flex flex-wrap items-center gap-2">
  <span
    className={`inline-block rounded-full px-2 py-1 text-xs ${
      form.is_active
        ? 'bg-green-100 text-green-700 dark:bg-green-500 dark:text-black'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-400 dark:text-black'
    }`}
  >
    {form.is_active ? 'Active Form' : 'Inactive Form'}
  </span>

  <span
    className={`inline-block rounded-full px-2 py-1 text-xs ${
      completionStatus.isComplete
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-300 dark:text-emerald-900'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-300 dark:text-amber-900'
    }`}
  >
    {completionStatus.isComplete ? 'Complete' : 'Incomplete'}
  </span>
</div>

{!completionStatus.isComplete && (
  <p className="mt-2 text-sm text-amber-700">
    {completionStatus.message}
  </p>
)}

<p className="mt-2 text-sm text-gray-500 dark:text-gray-100">
  Manage sections and questions for this Questionnaire from one place.
</p>
          </div>
          <Link to={`/forms/${form.id}`} className="rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            View Details

          </Link>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-6 rg:flex-row">

      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          {sections.map((section) => {
            const sectionQuestions = getQuestionsForSection(section.id)
            const sectionFactors = getFactorsForSection(section.id)
            return (
            <div key={section.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-slate-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900/60">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-300">
                      {section.code} - {section.name}
                      {(() => {
                        const fullFactors = getFactorsForSection(section.id).filter(
                          (f) => getFactorUsageCount(section.id, f.id) >= 5
                        )
                        return fullFactors.length > 0 ? (
                          <p className="mt-1 text-xs text-amber-700 font-medium dark:text-amber-300">
                            {fullFactors.length} factor{fullFactors.length > 1 ? 's' : ''} at capacity (used 5/5 times):{' '}
                            {fullFactors.map((f) => f.name).join(', ')}
                          </p>
                        ) : null
                      })()}

                    </h2>
                    <h2 className="mt-1 text-sm font-bold text-red-800 dark:text-red-400">Instruction displayed to candidates who are answering: </h2>
                    {section.instructions && (
                      <p className="mt-1 text-sm font-bold text-black dark:text-gray-300">{section.instructions}</p>
                    )}
                  </div>

                </div>



                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-100">
                      Questions
                    </h3>
                    <button
                      onClick={() => handleStartAdding(section.id)}
                      className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-200 dark:text-blue-700 dark:hover:bg-blue-300"
                    >
                      + Add Question
                    </button>
                  </div>
                  {isSectionAtMaxQuestions(section.id) && (
                    <p className="text-l font-bold text-red-600 dark:text-red-400 mt-1">
                      This section already contains 10 questions.
                    </p>
                  )}

                  {addingToSection === section.id && (
                    <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
                      <form onSubmit={(e) => handleCreateQuestion(e, section.id)} className="space-y-4">
                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">New Question</h3>
                        <div className="grid gap-4 lg:grid-cols-12">
                          <div className="lg:col-span-2">
                            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-200">Number</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={newNumber}
                              onChange={(e) => setNewNumber(parseInt(e.target.value, 10))}
                              className="w-full rounded border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
                            />
                          </div>
                          <div className="space-y-3 lg:col-span-5">
                            <div>
                              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">Option A Text</label>
                              <textarea
                                required
                                rows={2}
                                value={newOptionA}
                                onChange={(e) => setNewOptionA(e.target.value)}
                                className="w-full rounded border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">Maps to Factor</label>
                              <select
                                value={newFactorA}
                                onChange={(e) => setNewFactorA(parseInt(e.target.value, 10))}
                                className="w-full rounded border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
                              >

                                {sectionFactors.map((factor) => {
                                  const used = getFactorUsageCount(section.id, factor.id)
                                  const full = used >= 5
                                  return (
                                    <option key={factor.id} value={factor.id} disabled={full}>
                                      {factor.name} ({used}/5 used){full ? ' — FULL' : ''}
                                    </option>
                                  )
                                })}

                              </select>
                            </div>
                          </div>
                          <div className="space-y-3 lg:col-span-5">
                            <div>
                              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">Option B Text</label>
                              <textarea
                                required
                                rows={2}
                                value={newOptionB}
                                onChange={(e) => setNewOptionB(e.target.value)}
                                className="w-full rounded border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">Maps to Factor</label>
                              <select
                                value={newFactorB}
                                onChange={(e) => setNewFactorB(parseInt(e.target.value, 10))}
                                className="w-full rounded border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
                              >

                                {sectionFactors.map((factor) => {
                                  const used = getFactorUsageCount(section.id, factor.id)
                                  const full = used >= 5
                                  return (
                                    <option key={factor.id} value={factor.id} disabled={full}>
                                      {factor.name} ({used}/5 used){full ? ' — FULL' : ''}
                                    </option>
                                  )
                                })}

                              </select>
                            </div>
                          </div>
                        </div>
                        {createError && <p className="text-xs text-red-600 dark:text-red-300">{createError}</p>}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={creating}
                            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white dark:bg-blue-300 dark:text-gray-500 hover:bg-blue-700 disabled:opacity-50"
                          >
                            {creating ? 'Saving...' : 'Save Question'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelAdding}
                            disabled={creating}
                            className="rounded border border-gray-300 px-3 py-1.5 text-xs disabled:opacity-50 text-black dark:text-gray-300 dark:hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="divide-y divide-gray-100">
                    {sectionQuestions.length === 0 && addingToSection !== section.id && (
                      <p className="py-4 text-sm text-gray-600 dark:text-gray-300">No questions in this section yet.</p>
                    )}
                    {sectionQuestions.map((question) => (
                      <div key={question.id}>
                        {editingId === question.id ? (
                          <div className="py-4">
                            <form onSubmit={(e) => handleSaveEdit(e, question.id)} className="space-y-4">
                              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Edit Question {question.number}</h3>
                              <div className="grid gap-4 lg:grid-cols-12">
                                <div className="lg:col-span-2">
                                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700">Number</label>
                                  <input
                                    type="number"
                                    required
                                    min={1}
                                    value={editNumber}
                                    onChange={(e) => setEditNumber(parseInt(e.target.value, 10))}
                                    className="w-full rounded border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
                                  />
                                </div>
                                <div className="space-y-3 lg:col-span-5">
                                  <div>
                                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700">Option A Text</label>
                                    <textarea
                                      required
                                      rows={2}
                                      value={editOptionA}
                                      onChange={(e) => setEditOptionA(e.target.value)}
                                      className="w-full rounded border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700">Maps to Factor</label>
                                    <select
                                      value={editFactorA}
                                      onChange={(e) => setEditFactorA(parseInt(e.target.value, 10))}
                                      className="w-full rounded border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
                                    >

                                      {sectionFactors.map((factor) => {
                                        const used = getFactorUsageCount(section.id, factor.id)
                                        const full = used >= 5
                                        return (
                                          <option key={factor.id} value={factor.id} disabled={full}>
                                            {factor.name} ({used}/5 used){full ? ' — FULL' : ''}
                                          </option>
                                        )
                                      })}

                                    </select>
                                  </div>
                                </div>
                                <div className="space-y-3 lg:col-span-5">
                                  <div>
                                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700">Option B Text</label>
                                    <textarea
                                      required
                                      rows={2}
                                      value={editOptionB}
                                      onChange={(e) => setEditOptionB(e.target.value)}
                                      className="w-full rounded border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700">Maps to Factor</label>
                                    <select
                                      value={editFactorB}
                                      onChange={(e) => setEditFactorB(parseInt(e.target.value, 10))}
                                      className="w-full rounded border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-sm text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
                                    >

                                      {sectionFactors.map((factor) => {
                                        const used = getFactorUsageCount(section.id, factor.id, question.id)
                                        const full = used >= 5
                                        return (
                                          <option key={factor.id} value={factor.id} disabled={full}>
                                            {factor.name} ({used}/5 used){full ? ' — FULL' : ''}
                                          </option>
                                        )
                                      })}

                                    </select>
                                  </div>
                                </div>
                              </div>
                              {editError && <p className="text-xs text-red-600 dark:text-red-300">{editError}</p>}
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={saving}
                                  className="rounded bg-blue-600 dark:bg-blue-300 px-3 py-1.5 text-xs font-medium text-white dark:text-black hover:bg-blue-700 dark:hover:bg-blue-400 disabled:opacity-50"
                                >
                                  {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditing}
                                  disabled={saving}
                                  className="rounded border border-gray-300 px-3 py-1.5 text-xs disabled:opacity-50 text-black dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4 py-4 md:flex-row md:items-start">
                            <div className="w-8 shrink-0 text-sm font-semibold text-gray-500 dark:text-gray-300">{question.number}.</div>
                            <div className="grid flex-1 gap-4 md:grid-cols-2">
                              <div className="rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/60">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Option A</p>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{question.option_a_text}</p>
                                {question.option_a_factor_id && (
                                  <p className="mt-2 text-xs text-blue-600">
                                    Maps to: {factors.find((factor) => factor.id === question.option_a_factor_id)?.name || `Factor ${question.option_a_factor_id}`}
                                  </p>
                                )}
                              </div>
                              <div className="rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/60">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Option B</p>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{question.option_b_text}</p>
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
                                  <span className="text-center text-[10px] font-medium text-red-600 dark:text-red-300">Delete?</span>
                                  <button
                                    onClick={() => handleConfirmDelete(question.id)}
                                    disabled={deleting}
                                    className="rounded bg-red-600 dark:bg-red-300 px-2 py-1 text-xs font-medium text-white dark:text-red-800 hover:bg-red-700 dark:hover:bg-red-400 disabled:opacity-50"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    disabled={deleting}
                                    className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50 text-black dark:text-gray-300 dark:hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEditing(question)}
                                    className="bg-white dark:bg-[#A384BD] text-black dark:text-gray-900 rounded border border-gray-300 dark:border-gray-900 px-2 py-1 text-xs hover:bg-gray-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleRequestDelete(question.id)}
                                    className="bg-white dark:bg-[#A384BD]  dark:text-red-800 rounded border border-red-300 dark:border-red-900 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        {deleteError?.id === question.id && <p className="pb-2 text-xs text-red-600 dark:text-red-300">{deleteError.message}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            )
          })}
        </div>
        <FactorReference />
      </div>
    </AdminLayout>
  )
}
