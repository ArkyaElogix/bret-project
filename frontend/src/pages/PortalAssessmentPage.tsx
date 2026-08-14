import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  getSessionProgress,
  submitAnswer,
  submitSession,
  Session,
} from '../api/sessions'
import { listBehaviouralTypes, BehaviouralType } from '../api/behavioralTypes'
import { listQuestions, Question } from '../api/questions'
import { getForm, Form } from '../api/forms'
import { ApiError, clearToken } from '../api/client'
import PortalLayout from '../components/PortalLayout'
import AssessmentStepper from '../components/AssessmentStepper'

type Option = 'A' | 'B'

export default function PortalAssessmentPage() {
  const { id } = useParams()
  const sessionId = id ? parseInt(id, 10) : 0
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [sections, setSections] = useState<BehaviouralType[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, Option>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())
  const [saveErrors, setSaveErrors] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const progress = await getSessionProgress(sessionId)
      setSession(progress.session)

      const initialAnswers: Record<number, Option> = {}
      for (const r of progress.responses) {
        initialAnswers[r.question_id] = r.chosen_option
      }
      setAnswers(initialAnswers)

      const [sectionsData, questionsData, formData] = await Promise.all([
        listBehaviouralTypes(progress.session.form_id),
        listQuestions({ form_id: progress.session.form_id }),
        getForm(progress.session.form_id),
      ])
      setSections(sectionsData)
      setQuestions(questionsData)
      setForm(formData)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load assessment.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionId) loadData()
  }, [sessionId])

  async function handleSelect(questionId: number, option: Option) {
    if (session?.status === 'submitted') return
    if (form && !form.is_active) return
    if (answers[questionId] === option) return

    // Optimistic update
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
    setSavingIds((prev) => new Set(prev).add(questionId))
    setSaveErrors((prev) => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })

    try {
      await submitAnswer(sessionId, questionId, option)
    } catch (err) {
      setSaveErrors((prev) => ({
        ...prev,
        [questionId]: err instanceof ApiError ? err.message : 'Failed to save answer.',
      }))
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }

    async function handleSubmit() {
    if (form && !form.is_active) {
      setSubmitError('This assessment is no longer available.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await submitSession(sessionId)

      if (result.auto_logout) {
        clearToken()
        navigate('/assessment-complete', { replace: true })
        return
      }

      navigate(`/portal/sessions/${sessionId}/results`, { replace: true })
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Failed to submit assessment.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PortalLayout title="Assessment">
        <p className="text-sm text-gray-500">Loading assessment...</p>
      </PortalLayout>
    )
  }

  if (error || !session) {
    return (
      <PortalLayout title="Assessment">
        <p className="text-sm text-red-600">{error || 'Assessment not found.'}</p>
        <Link to="/portal" className="text-blue-600 hover:underline text-sm mt-4 inline-block">
          ← Back to Forms
        </Link>
      </PortalLayout>
    )
  }

  if (session.status === 'submitted') {
    return (
      <PortalLayout title="Assessment Complete">
        <div className="bg-white shadow rounded-lg p-6 space-y-3 max-w-md dark:bg-gray-800 dark:border dark:border-gray-700">
          <h2 className="text-lg font-bold text-green-700 dark:text-green-400">Success!</h2>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Thank you for completing the BRET Assessment. Your customized report has been generated and emailed to you.
          </p>
          <Link
            to={`/portal/sessions/${sessionId}/results`}
            className="inline-block bg-blue-600 dark:bg-blue-300 text-white dark:text-black rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-400"
          >
            View Results
          </Link>
          <p className="text-sm text-gray-700 dark:text-gray-200 mt-4">
            Please check your inbox (and spam folder) for a secure link to view your report.
          </p>
        </div>
      </PortalLayout>
    )
  }


  if (form && !form.is_active) {
    return (
      <PortalLayout title="Assessment Unavailable">
        <div className="bg-white shadow rounded-lg p-6 space-y-3 max-w-md dark:bg-gray-800 dark:border dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            This questionnaire is no longer available.
          </p>
          <Link
            to="/portal"
            className="inline-block bg-blue-600 dark:bg-blue-300 text-white dark:text-black rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-400"
          >
            Back to Questionnaires Page
          </Link>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout title={form?.name || 'Assessment'}>
      <div className="mb-6 flex justify-end">
        <Link
          to="/portal"
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Pause & Return to Portal
        </Link>
      </div>
      <AssessmentStepper
        sections={sections}
        questions={questions}
        answers={answers}
        savingIds={savingIds}
        saveErrors={saveErrors}
        onSelect={handleSelect}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={submitError}
      />
    </PortalLayout>
  )
}
