//admin-side view
import { useEffect, useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { listForms, createForm, deleteForm, updateForm, Form } from '../api/forms'
import { listBehaviouralTypes, BehaviouralType } from '../api/behavioralTypes'
import {
  listBehaviouralFactors,
  BehaviouralFactor,
} from '../api/behavioralFactors'
import { listQuestions, Question } from '../api/questions'
import { ApiError } from '../api/client'

import AdminLayout from '../components/AdminLayout'

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [factors, setFactors] = useState<BehaviouralFactor[]>([])
  const [newName, setNewName] = useState('')
  const [newIsActive, setNewIsActive] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<{ id: number; message: string } | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [completionState, setCompletionState] = useState<Record<number, { isComplete: boolean; message: string }>>({})
  const [popupError, setPopupError] = useState<string | null>(null)

  function getFactorUsageCount(
    sectionId: number,
    factorId: number,
    questions: Question[]
  ): number {
    return questions.reduce((total, question) => {
      if (question.behavioural_type_id !== sectionId) return total
      if (question.option_a_factor_id === factorId) total++
      if (question.option_b_factor_id === factorId) total++
      return total
    }, 0)
  }

  function getCompletionState(sections: BehaviouralType[], questions: Question[], factors: BehaviouralFactor[]) 
  {
    if (sections.length !== 3) {
      return {
        isComplete: false,
        message: `This Questionnaire needs 3 sections before it can be activated.`,
      }
    }

    for (const section of sections) {
      const count = questions.filter(
        (question) => question.behavioural_type_id === section.id
      ).length

      if (count < 10) {
        return {
          isComplete: false,
          message: `${section.code} needs at least 10 questions before activation.`,
        }
      }

      if (count % 2 !== 0) {
        return {
          isComplete: false,
          message: `${section.code} needs an even number of questions before activation.`,
        }
      }

      const sectionFactors = factors.filter(
        (factor) => factor.behavioural_type_id === section.id
      )
      if (sectionFactors.length !== 4) {
        return {
          isComplete: false,
          message: `${section.code} must have exactly 4 behavioural factors configured.`,
        }
      }

      const requiredCount = (count * 2) / 4
      for (const factor of sectionFactors) {
        const actual = getFactorUsageCount(section.id, factor.id, questions)

        if (actual !== requiredCount) {
          return {
            isComplete: false,
            message: `${count} questions requires each factor to appear ${requiredCount} times — ${factor.name} currently appears ${actual} times.`,
          }
        }
      }
    }

    return {
      isComplete: true,
      message: 'Complete and ready to activate.',
    }
  }

  async function handleToggleActive(form: Form) {
    if (!form.is_active && !form.is_complete) {
      setPopupError(`Cannot activate "${form.name}" until every section has at least 10 questions, uses an even number of questions, and balances all 4 factors evenly.`)
      return
    }

    setPopupError(null)
    setTogglingId(form.id)
    try {
      await updateForm(form.id, form.name, !form.is_active)
      await loadForms()
    } catch (err) {
      setPopupError(err instanceof ApiError ? err.message : 'Failed to toggle active status.')
    } finally {
      setTogglingId(null)
    }
  }

  async function loadForms() {
    setLoading(true)
    setError(null)
    setPopupError(null)
    
    try {
      const [formsData, sectionsData, factorsData] = await Promise.all([
        listForms(),
        listBehaviouralTypes(),
        listBehaviouralFactors(),
      ])
    
      const questionResults = await Promise.all(
        formsData.map((form) => listQuestions({ form_id: form.id }))
      )

      const nextCompletionState: Record<number, { isComplete: boolean; message: string }> = {}
      const nextForms = formsData.map((form, index) => {
        const state = getCompletionState(sectionsData, questionResults[index], factorsData)
        nextCompletionState[form.id] = state
        return {
          ...form,
          is_complete: state.isComplete,
        }
      })
      setFactors(factorsData)
      setForms(nextForms)
      setCompletionState(nextCompletionState)
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
    <AdminLayout title="Questionnaires">
      <div className="max-w-4xl space-y-8">
        {/* Create form */}
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">Create a new questionnaire</h2>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. BRET v2"
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={newIsActive}
              onChange={(e) => setNewIsActive(e.target.checked)}
            />
            Set as active
          </label>

          {createError && <p className="text-sm text-red-600">{createError}</p>}

          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create new Questionnaire'}
          </button>
        </form>

        {/* List */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y dark:divide-gray-700">
          {loading && <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading Questionnaires...</p>}
          {error && <p className="p-6 text-sm text-red-600">{error}</p>}
          {!loading && !error && forms.length === 0 && (
            <p className="p-6 text-sm text-gray-500 dark:text-gray-400">No Questionnaires yet. Create one above.</p>
          )}
          {popupError && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/50 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300 shadow-sm">
              {popupError}
            </div>
          )}
          {!loading &&
            !error &&
            forms.map((form) => (
              <div key={form.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{form.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleToggleActive(form)}
                    disabled={togglingId === form.id}
                    className={`text-xs px-3 py-1 rounded ${form.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'} disabled:opacity-50`}
                  > Active: {form.is_active ? 'Yes' : 'No'}
                  </button>
                  <Link
                    to={`/forms/${form.id}`}
                    className="text-xs border border-blue-300 text-blue-600 rounded px-3 py-1 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/50"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/forms/${form.id}/edit`}
                    className="text-xs border border-slate-300 text-slate-700 rounded px-3 py-1 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Manage Questionnaire
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
                        className="text-xs border border-gray-300 rounded px-2.5 py-1 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmDeleteId(form.id); setDeleteError(null) }}
                      className="text-xs border border-red-300 text-red-600 rounded px-3 py-1 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/50"
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