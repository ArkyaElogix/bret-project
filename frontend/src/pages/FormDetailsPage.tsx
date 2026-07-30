import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getForm, Form } from '../api/forms'
import { listBehaviouralTypes, BehaviouralType } from '../api/behavioralTypes'
import { listBehaviouralFactors, BehaviouralFactor } from '../api/behavioralFactors'
import { listQuestions, Question } from '../api/questions'
import AdminLayout from '../components/AdminLayout'

export default function FormDetailsPage() {
  const { id } = useParams()
  const formId = id ? parseInt(id, 10) : 0

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [sections, setSections] = useState<BehaviouralType[]>([])
  const [factors, setFactors] = useState<BehaviouralFactor[]>([])
  const [questions, setQuestions] = useState<Question[]>([])

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
      setError(err instanceof ApiError ? err.message : 'Failed to load Questionnaire details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (formId) {
      loadData()
    }
  }, [formId])

  function getQuestionsForSection(sectionId: number) {
    return questions.filter((q) => q.behavioural_type_id === sectionId)
  }

  if (loading) {
    return (
      <AdminLayout title="Questionnaires Details">
        <p className="text-gray-500">Loading Questionnaire details...</p>
      </AdminLayout>
    )
  }

  if (error || !form) {
    return (
      <AdminLayout title="Form Details">
        <p className="text-red-600">{error || 'Form not found.'}</p>
        <Link to="/forms" className="text-blue-600 hover:underline mt-4 inline-block">
          &larr; Back to Questionnaires page
        </Link>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Questionnaire Details || View only">
      <div className="max-w-5xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to="/forms" className="text-blue-600 dark:text-blue-200 hover:underline text-sm inline-block mb-3">
              &larr; Back to Questionnaires page
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 ">{form.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-100 mt-2">
              View-only overview of the sections, questions, and mapping factors for this Questionnaire.
            </p>
          </div>
          <Link
            to={`/forms/${form.id}/edit`}
            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Manage Questions
          </Link>
        </div>

        {sections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
            This form does not have any sections yet.
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => {
              const sectionQuestions = getQuestionsForSection(section.id)
              return (
                <div key={section.id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 bg-slate-50 px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                          {section.code} - {section.name}
                        </h2>
                        <h2 className="mt-1 text-sm font-bold text-red-800">Instruction displayed to candidates: </h2>
                        {section.instructions && (
                          <p className="mt-1 text-sm font-bold text-black">{section.instructions}</p>
                        )}
                      </div>
                      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {sectionQuestions.length} question{sectionQuestions.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {sectionQuestions.length === 0 ? (
                      <p className="p-6 text-sm text-gray-500">No questions have been added to this section yet.</p>
                    ) : (
                      sectionQuestions.map((q) => (
                        <div key={q.id} className="p-6">
                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-500">{q.number}.</span>
                            <span className="text-sm text-gray-500">Question</span>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded border border-gray-200 bg-gray-50 p-3">
                              <p className="text-sm font-medium text-gray-700">Option A</p>
                              <p className="mt-1 text-sm text-gray-600">{q.option_a_text}</p>
                              {q.option_a_factor_id && (
                                <p className="mt-2 text-xs text-blue-600">
                                  Maps to: {factors.find((f) => f.id === q.option_a_factor_id)?.name || `Factor ${q.option_a_factor_id}`}
                                </p>
                              )}
                            </div>
                            <div className="rounded border border-gray-200 bg-gray-50 p-3">
                              <p className="text-sm font-medium text-gray-700">Option B</p>
                              <p className="mt-1 text-sm text-gray-600">{q.option_b_text}</p>
                              {q.option_b_factor_id && (
                                <p className="mt-2 text-xs text-blue-600">
                                  Maps to: {factors.find((f) => f.id === q.option_b_factor_id)?.name || `Factor ${q.option_b_factor_id}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
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
