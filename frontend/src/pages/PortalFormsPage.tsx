import { useEffect, useState } from 'react'
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

  const [showAttemptModal, setShowAttemptModal] = useState<Form | null>(null)
  const [priorAttemptClaimed, setPriorAttemptClaimed] = useState(false)
  const [priorAttemptDetails, setPriorAttemptDetails] = useState('')

  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<{ id: number; message: string } | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [formsData, sessionsData] = await Promise.all([
        listForms(false), // Fetch ALL forms (active + inactive) so in-progress sessions always show
        listMySessions(),
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

  // Derived state
  const anyInProgress = mySessions.some((s) => s.status === 'in_progress')
  const completedSessions = mySessions.filter((s) => s.status === 'submitted')

  // Sessions currently in progress — always show Resume regardless of form.is_active
  const inProgressSessions = mySessions.filter((s) => s.status === 'in_progress')
  const inProgressForms = inProgressSessions
    .map((s) => forms.find((f) => f.id === s.form_id))
    .filter(Boolean) as Form[]

  // Active forms the user can start/restart (exclude forms already in-progress)
  const activeForms = forms.filter(
    (f) => f.is_active && !inProgressSessions.some((s) => s.form_id === f.id)
  )

  function sessionForForm(formId: number): Session | undefined {
    return mySessions.find((s) => s.form_id === formId)
  }

  function formatSubmittedAt(value: string | null) {
    if (!value) return 'Submitted time unavailable'
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  async function handleStart(form: Form, priorClaimed = false, priorDetails = '') {
    setStarting(true)
    setStartError(null)
    try {
      const session = await startSession(form.id, priorClaimed, priorDetails)
      await loadData()
      navigate(`/portal/sessions/${session.id}`)
    } catch (err) {
      setStartError({
        id: form.id,
        message: err instanceof ApiError ? err.message : 'Failed to start assessment.',
      })
    } finally {
      setStarting(false)
    }
  }

  async function handleStartAgain(form: Form) {
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
        <p className="text-sm text-gray-500 dark:text-gray-100">
          These are the assessments currently available to you. You can only work on one assessment at a time — finish
          any in-progress assessment before starting a new one.
        </p>

        {/* In-progress warning banner */}
        {anyInProgress && (
          <div className="bg-amber-50 border border-amber-200 dark:text-amber-300 dark:bg-yellow-900 dark:border-amber-900 text-amber-800 rounded-lg p-4 text-sm">
            You have an assessment in progress. Finish (or submit) it before starting another.
          </div>
        )}

        {loading && (
          <p className="p-6 text-sm text-gray-700 dark:text-gray-200 bg-white shadow rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">
            Loading forms...
          </p>
        )}
        {error && (
          <p className="p-6 text-sm text-red-700 dark:text-red-400 bg-white shadow rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">
            {error}
          </p>
        )}

        {/* Section 1: In-progress sessions — always visible regardless of form active status */}
        {!loading && !error && inProgressForms.length > 0 && (
          <div className="bg-white shadow rounded-lg divide-y dark:bg-gray-800 dark:divide-gray-700 dark:border dark:border-gray-700">
            {inProgressForms.map((form) => {
              const session = sessionForForm(form.id)!
              return (
                <div key={form.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-300">{form.name}</h2>
                    <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-400 px-2 py-1 rounded-full shrink-0">
                      In Progress
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/portal/sessions/${session.id}`)}
                      className="bg-blue-600 text-white rounded px-4 py-1.5 text-sm font-medium hover:bg-blue-700 dark:bg-blue-300 dark:text-blue-900 dark:hover:bg-blue-200"
                    >
                      Resume
                    </button>
                  </div>
                  {startError?.id === form.id && (
                    <p className="text-xs text-red-600 dark:text-red-400">{startError.message}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Section 2: Active forms available to start (or start again) */}
        {!loading && !error && !anyInProgress && activeForms.length === 0 && completedSessions.length === 0 && (
          <div className="bg-white shadow rounded-lg p-8 text-center text-sm text-gray-600 dark:text-gray-300 dark:bg-gray-800 dark:border dark:border-gray-700">
            No assessments are available right now. Please check back later.
          </div>
        )}

        {!loading && !error && activeForms.length > 0 && (
          <div className="bg-white shadow rounded-lg divide-y dark:bg-gray-800 dark:divide-gray-700 dark:border dark:border-gray-700">
            {activeForms.map((form) => {
              const session = sessionForForm(form.id)
              const isSubmitted = session?.status === 'submitted'

              return (
                <div key={form.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-300">{form.name}</h2>
                    <span className="text-xs bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 px-2 py-1 rounded-full shrink-0">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isSubmitted && (
                      <>
                        <span className="text-xs bg-green-100 text-green-700 dark:bg-emerald-800 dark:text-emerald-300 px-2 py-1 rounded-full">
                          Completed
                        </span>
                        <button
                          onClick={() => handleStartAgain(form)}
                          disabled={anyInProgress || starting}
                          className="border border-blue-300 text-blue-600 rounded px-4 py-1.5 text-sm hover:bg-blue-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={anyInProgress ? 'Finish your in-progress assessment first' : 'Start again'}
                        >
                          {starting ? 'Starting...' : 'Start Again'}
                        </button>
                      </>
                    )}

                    {!session && (
                      <button
                        onClick={() => setShowAttemptModal(form)}
                        disabled={anyInProgress || starting}
                        className="bg-blue-600 text-white rounded px-4 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={anyInProgress ? 'Finish your in-progress assessment first' : 'Start assessment'}
                      >
                        {starting ? 'Starting...' : 'Start Assessment'}
                      </button>
                    )}
                  </div>

                  {startError?.id === form.id && (
                    <p className="text-xs text-red-600 dark:text-red-400">{startError.message}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Section 3: Past submitted results */}
        {!loading && !error && completedSessions.length > 0 && (
          <div className="bg-white shadow rounded-lg divide-y dark:bg-gray-800 dark:divide-gray-700 dark:border dark:border-gray-700">
            <div className="p-5">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Previous Results</h2>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                Completed assessment results remain available even if the assessment is no longer active.
              </p>
            </div>
            {completedSessions.map((session) => (
              <div key={session.id} className="p-5 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{session.form_name}</p>
                  <p className="text-xs text-gray-700 dark:text-gray-200">
                    Submitted {formatSubmittedAt(session.submitted_at)}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/portal/sessions/${session.id}/results`)}
                  className="border border-gray-300 dark:border-gray-600 rounded px-4 py-1.5 text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  View Result
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prior Attempt Modal */}
      {showAttemptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Prior Attempt Check</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Have you attempted this assessment before under a different email address or at a different time?
            </p>

            <label className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={priorAttemptClaimed}
                onChange={(e) => setPriorAttemptClaimed(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm dark:text-white">Yes, I have attempted this before</span>
            </label>

            {priorAttemptClaimed && (
              <textarea
                placeholder="Please provide details (e.g. previous email used, approximate date)..."
                value={priorAttemptDetails}
                onChange={(e) => setPriorAttemptDetails(e.target.value)}
                className="w-full border rounded p-2 text-sm mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
              />
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowAttemptModal(null)
                  setPriorAttemptClaimed(false)
                  setPriorAttemptDetails('')
                }}
                className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleStart(showAttemptModal, priorAttemptClaimed, priorAttemptDetails)
                  setShowAttemptModal(null)
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continue to Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  )
}
