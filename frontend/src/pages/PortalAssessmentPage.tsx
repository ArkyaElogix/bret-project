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
import { ApiError } from '../api/client'
import PortalLayout from '../components/PortalLayout'

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
      // Fetch progress first (gives us form_id), then the form's structure.
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
    if (answers[questionId] === option) return // no change

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
      await submitSession(sessionId)
      navigate(`/portal/sessions/${sessionId}/results`)
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

  // Already submitted — can't change answers, point to results.
  if (session.status === 'submitted') {
    return (
      <PortalLayout title="Assessment">
        <div className="bg-white shadow rounded-lg p-6 space-y-3 max-w-md dark:bg-gray-800 dark:border dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-200">This questionnaire has already been submitted.</p>
          <Link
            to={`/portal/sessions/${sessionId}/results`}
            className="inline-block bg-blue-600 dark:bg-blue-300 text-white dark:text-black rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-400"
          >
            View Results
          </Link>
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

  const totalQuestions = questions.length
  const answeredCount = questions.filter((q) => answers[q.id]).length
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions

  function getQuestionsForSection(sectionId: number) {
    return questions.filter((q) => q.behavioural_type_id === sectionId)
  }

  return (
    <PortalLayout title={form?.name || 'Assessment'}>
      <div className="space-y-6">

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg dark:bg-yellow-900/30 dark:border-amber-600 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Important Disclaimer
              </h3>
              <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                <p>
                  Please answer honestly based on your true inclinations, not what you think is expected. Your results are confidential and used solely for your personal assessment.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Progress + submit bar */}
        <div className="sticky top-4 z-50 bg-white shadow rounded-lg p-5 flex items-center justify-between gap-4 flex-wrap dark:bg-gray-800 dark:border dark:border-gray-700">
          <div className="max-w-2xl ">
            <p className="text-sm text-blue-900 dark:text-blue-300 font-semibold leading-6">
              This Assessment is designed to help you understand your behavioural response to different triggers and situations. It is divided into three sections.
              <ul className='list-style-type: square;'><li >Section A identifies your key and pre-dominant drivers and Motivators.</li>
                <li>Section B identifies your Change and Adaptability quotient through your response to uncertainty.</li>
                <li>Section C identifies your Communication style.</li></ul>
              Each section has a set of instruction before the start.
              Please read and follow the instructions since they are different for each section.

            </p>
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-300">
              Progress: {answeredCount} of {totalQuestions} answered
            </p>

            <div className="mt-2 h-2 w-64 max-w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {savingIds.size > 0 && (
              <span className="text-xs text-gray-500">Saving answers...</span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {submitError}
          </div>
        )}

        {!allAnswered && (
          <p className="text-xs text-gray-700 dark:text-blue-300 font-bold">
            Answer all {totalQuestions} choices to enable submission. Your answers are saved automatically as you go.
          </p>
        )}

        {/* Sections */}
        {sections.map((section) => {
          const sectionQuestions = getQuestionsForSection(section.id)
          if (sectionQuestions.length === 0) return null
          return (
            <div key={section.id} className="bg-white shadow rounded-lg overflow-hidden dark:bg-gray-800 dark:border dark:border-gray-700">
              <div className="bg-slate-50 dark:bg-slate-700 border-b border-gray-200 dark:border-gray-900 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {section.code} - {section.name}
                </h2>
                {section.instructions && (
                  <p className="mt-1 text-sm font-bold text-red-700 dark:text-red-400">{section.instructions}</p>
                )}
              </div>

              <div className="divide-y divide-gray-100">
                {sectionQuestions.map((question) => {
                  const selected = answers[question.id]
                  const saving = savingIds.has(question.id)
                  return (
                    <div key={question.id} className="p-6">

                      <div className="grid gap-3 md:grid-cols-2">
                        {(['A', 'B'] as Option[]).map((opt) => {
                          const isSel = selected === opt
                          const text = opt === 'A' ? question.option_a_text : question.option_b_text
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelect(question.id, opt)}
                              className={`text-left rounded-lg border p-4 transition ${isSel
                                ? 'border-green-700 bg-green-100 ring-2 ring-green-300 dark:border-green-300 dark:bg-green-800 dark:ring-green-900 '
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-100 dark:border-gray-300 dark:bg-gray-700'
                                }`}
                            >
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-200 mr-2">
                                {question.number} {opt}
                              </span>
                              <span className="text-sm text-gray-700 dark:text-gray-200">{text}</span>
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-2 h-4">
                        {saving && <span className="text-xs text-gray-400">Saving...</span>}
                        {saveErrors[question.id] && (
                          <span className="text-xs text-red-600">
                            {saveErrors[question.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Questionnaire'}
        </button>
      </div>
    </PortalLayout>
  )
}
