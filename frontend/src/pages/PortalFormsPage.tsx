import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { listForms, Form } from '../api/forms'
import { listMySessions, startSession, Session } from '../api/sessions'
import { ApiError } from '../api/client'
import PortalLayout from '../components/PortalLayout'

type ProductType = 'BASIC' | 'EXECUTIVE'

export default function PortalFormsPage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<Form[]>([])
  const [mySessions, setMySessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [startFormId, setStartFormId] = useState<number | null>(null)
  const [productType, setProductType] = useState<ProductType>('BASIC')
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<{ id: number; message: string } | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [formsData, sessionsData] = await Promise.all([
        listForms(true), // active forms only
        listMySessions(), // all my sessions, newest first
      ])
      setForms(formsData)
      setMySessions(sessionsData)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Is there an in-progress session for ANY form? (Used to disable Start.)
  const anyInProgress = mySessions.some((s) => s.status === 'in_progress')

  function sessionForForm(formId: number): Session | undefined {
    // mySessions is newest-first; find the most recent session for this form
    return mySessions.find((s) => s.form_id === formId)
  }

  function openStartForm(form: Form) {
    setStartFormId(form.id)
    setProductType('BASIC')
    setStartError(null)
  }

  function cancelStart() {
    setStartFormId(null)
    setStartError(null)
  }

  async function handleStart(e: FormEvent, form: Form) {
    e.preventDefault()
    setStarting(true)
    setStartError(null)
    try {
      const session = await startSession(form.id, productType)
      await loadData() // refresh so the new in-progress state shows
      navigate(`/portal/sessions/${session.id}`)
    } catch (err) {
      // 409 happens if the backend gate blocks: user has an in-progress
      // session on a different form. Show the message; the disabled Start
      // buttons also reflect this.
      setStartError({
        id: form.id,
        message: err instanceof ApiError ? err.message : 'Failed to start assessment.',
      })
    } finally {
      setStarting(false)
    }
  }

  return (
    <PortalLayout title="Available Assessments">
      <div className="space-y-6">
        <p className="text-sm text-gray-500">
          These are the assessments currently available to you. You can only work on one assessment at a time — finish any in-progress assessment before starting a new one.
        </p>

        {/* Helper banner when blocked */}
        {anyInProgress && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm">
            You have an assessment in progress. Finish (or submit) it before starting another.
          </div>
        )}

        {loading && (
          <p className="p-6 text-sm text-gray-500 bg-white shadow rounded-lg">Loading forms...</p>
        )}
        {error && (
          <p className="p-6 text-sm text-red-600 bg-white shadow rounded-lg">{error}</p>
        )}
        {!loading && !error && forms.length === 0 && (
          <div className="bg-white shadow rounded-lg p-8 text-center text-sm text-gray-500">
            No assessments are available right now. Please check back later.
          </div>
        )}

        {!loading && !error && forms.length > 0 && (
          <div className="bg-white shadow rounded-lg divide-y">
            {forms.map((form) => {
              const session = sessionForForm(form.id)
              const isInProgress = session?.status === 'in_progress'
              const isSubmitted = session?.status === 'submitted'

              return (
                <div key={form.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-gray-800">{form.name}</h2>
                      <p className="mt-1 text-xs text-gray-500">Form ID: {form.id}</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>

                  {/* Action row — context-aware per form */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {isInProgress && session && (
                      <>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          In Progress
                        </span>
                        <button
                          onClick={() => navigate(`/portal/sessions/${session.id}`)}
                          className="bg-blue-600 text-white rounded px-4 py-1.5 text-sm font-medium hover:bg-blue-700"
                        >
                          Resume
                        </button>
                      </>
                    )}

                    {isSubmitted && session && (
                      <>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Completed
                        </span>
                        <button
                          onClick={() => navigate(`/portal/sessions/${session.id}/results`)}
                          className="border border-gray-300 rounded px-4 py-1.5 text-sm hover:bg-gray-50"
                        >
                          View Results
                        </button>
                        {/* Note: starting again after submitting is allowed by the
                            backend (old session is no longer in_progress). */}
                        <button
                          onClick={() => openStartForm(form)}
                          disabled={anyInProgress}
                          className="border border-blue-300 text-blue-600 rounded px-4 py-1.5 text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={anyInProgress ? 'Finish your in-progress assessment first' : 'Start again'}
                        >
                          Start Again
                        </button>
                      </>
                    )}

                    {!session && (
                      <>
                        {startFormId === form.id ? (
                          <form
                            onSubmit={(e) => handleStart(e, form)}
                            className="flex items-center gap-3 flex-wrap"
                          >
                            <label className="text-sm text-gray-600">Product type:</label>
                            <select
                              value={productType}
                              onChange={(e) => setProductType(e.target.value as ProductType)}
                              className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="BASIC">BASIC</option>
                              <option value="EXECUTIVE">EXECUTIVE</option>
                            </select>
                            <button
                              type="submit"
                              disabled={starting}
                              className="bg-blue-600 text-white rounded px-4 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                              {starting ? 'Starting...' : 'Confirm Start'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelStart}
                              disabled={starting}
                              className="border border-gray-300 rounded px-4 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <button
                            onClick={() => openStartForm(form)}
                            disabled={anyInProgress}
                            className="bg-blue-600 text-white rounded px-4 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={anyInProgress ? 'Finish your in-progress assessment first' : 'Start assessment'}
                          >
                            Start Assessment
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {startError?.id === form.id && (
                    <p className="text-xs text-red-600">{startError.message}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  )
}