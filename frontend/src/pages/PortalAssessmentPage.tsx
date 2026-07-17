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
        <div className="bg-white shadow rounded-lg p-6 space-y-3 max-w-md">
          <p className="text-sm text-gray-700">This assessment has already been submitted.</p>
          <Link
            to={`/portal/sessions/${sessionId}/results`}
            className="inline-block bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            View Results
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
        {/* Progress + submit bar */}
        <div className="bg-white shadow rounded-lg p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-medium text-gray-800">
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
          <p className="text-xs text-gray-500">
            Answer all {totalQuestions} questions to enable submission. Your answers are saved automatically as you go.
          </p>
        )}

        {/* Sections */}
        {sections.map((section) => {
          const sectionQuestions = getQuestionsForSection(section.id)
          if (sectionQuestions.length === 0) return null
          return (
            <div key={section.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {section.code} - {section.name}
                </h2>
                {section.instructions && (
                  <p className="mt-1 text-sm text-gray-500">{section.instructions}</p>
                )}
              </div>

              <div className="divide-y divide-gray-100">
                {sectionQuestions.map((question) => {
                  const selected = answers[question.id]
                  const saving = savingIds.has(question.id)
                  return (
                    <div key={question.id} className="p-6">
                      <p className="text-sm font-semibold text-gray-500 mb-3">
                        Question {question.number}
                      </p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {(['A', 'B'] as Option[]).map((opt) => {
                          const isSel = selected === opt
                          const text = opt === 'A' ? question.option_a_text : question.option_b_text
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelect(question.id, opt)}
                              className={`text-left rounded-lg border p-4 transition ${
                                isSel
                                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <span className="text-xs font-bold text-gray-400 mr-2">
                                Option {opt}
                              </span>
                              <span className="text-sm text-gray-700">{text}</span>
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
      </div>
    </PortalLayout>
  )
}