import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { listForms, Form } from '../api/forms'
import { listMySessions, startSession, Session } from '../api/sessions'
import { ApiError } from '../api/client'
import PortalLayout from '../components/PortalLayout'



export default function PortalFormsPage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<Form[]>([])
  const [mySessions, setMySessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<{ id: number; message: string } | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [formsData, sessionsData] = await Promise.all([
        listForms(), // active forms only
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
  function sessionAgainForForm(formId: number): Session[] {
    return mySessions.filter((s) => s.form_id === formId)
  }


  async function handleStart(form: Form) {
    setStarting(true)
    setStartError(null)
    try {
      const session = await startSession(form.id)
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

  async function handleStartAgain(form: Form, previousSession: Session) {
    setStarting(true)
    setStartError(null)

    try {
      const session = await startSession(form.id)
      await loadData()
      navigate(`/portal/sessions/${session.id}`)
    } catch (err) {
      setStartError({
        id: form.id,
        message: err instanceof ApiError ? err.message : 'Failed to start assessment again.',
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
              const attempts = sessionAgainForForm(form.id)
              const isInProgress = session?.status === 'in_progress'
              const isSubmitted = session?.status === 'submitted'

              return (
                <div key={form.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-gray-800">{form.name}</h2>
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
                        {/* <button
                          onClick={() => navigate(`/portal/sessions/${session.id}/results`)}
                          className="border border-gray-300 rounded px-4 py-1.5 text-sm hover:bg-gray-50"
                        >
                          View Results
                        </button> */}
                        {/* Note: starting again after submitting is allowed by the
                            backend (old session is no longer in_progress). */}
                        <button
                          onClick={() => handleStartAgain(form, session)}
                          disabled={anyInProgress || starting}
                          className="border border-blue-300 text-blue-600 rounded px-4 py-1.5 text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={anyInProgress ? 'Finish your in-progress assessment first' : 'Start again'}
                        >
                          {starting ? 'Starting...' : 'Start Again'}
                        </button>
                      </>
                    )}

                    {!session && (
                      <button
                        onClick={() => handleStart(form)}
                        disabled={anyInProgress || starting}
                        className="bg-blue-600 text-white rounded px-4 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={anyInProgress ? 'Finish your in-progress assessment first' : 'Start assessment'}
                      >
                        {starting ? 'Starting...' : 'Start Assessment'}
                      </button>
                    )}
                  </div>

                  {attempts.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                        Previous Attempts
                      </p>

                      <div className="space-y-2">
                        {attempts.map((attempt, index) => (
                          <div
                            key={attempt.id}
                            className="flex items-center justify-between gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Attempt {attempts.length - index}
                              </p>
                              <p className="text-xs text-gray-500">
                                {attempt.status === 'submitted' ? 'Completed' : 'In progress'}
                              </p>
                            </div>

                            {attempt.status === 'submitted' ? (
                              <button
                                onClick={() => navigate(`/portal/sessions/${attempt.id}/results`)}
                                className="border border-gray-300 rounded px-3 py-1.5 text-xs hover:bg-white"
                              >
                                View Result
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/portal/sessions/${attempt.id}`)}
                                className="bg-blue-600 text-white rounded px-3 py-1.5 text-xs font-medium hover:bg-blue-700"
                              >
                                Resume
                              </button>
                            )}

                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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