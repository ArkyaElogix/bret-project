import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSessionResults, SectionResult } from '../api/sessions'
import { ApiError } from '../api/client'
import AdminLayout from '../components/AdminLayout'

const PALETTE = [
  { bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800' },
  { bar: 'bg-violet-500', badge: 'bg-violet-100 text-violet-800' },
  { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
  { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800' },
  { bar: 'bg-rose-500', badge: 'bg-rose-100 text-rose-800' },
  { bar: 'bg-cyan-500', badge: 'bg-cyan-100 text-cyan-800' },
  { bar: 'bg-fuchsia-500', badge: 'bg-fuchsia-100 text-fuchsia-800' },
  { bar: 'bg-lime-500', badge: 'bg-lime-100 text-lime-800' },
]

function colour(index: number) {
  return PALETTE[index % PALETTE.length]
}

export default function SessionResultsPage() {
  const { id } = useParams()
  const sessionId = id ? parseInt(id, 10) : 0

  const [sections, setSections] = useState<SectionResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    getSessionResults(sessionId)
      .then(setSections)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load results.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <AdminLayout title="Session Results">
        <p className="text-sm text-gray-500">Loading results...</p>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Session Results">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm mb-4">{error}</div>
        <Link to="/sessions" className="text-blue-600 hover:underline text-sm">← Back to Sessions</Link>
      </AdminLayout>
    )
  }

  if (sections.length === 0) {
    return (
      <AdminLayout title="Session Results">
        <div className="bg-white shadow rounded-lg p-8 text-center text-sm text-gray-500">
          No results available for this session yet. The session may not be submitted, or no questions had factor mappings.
        </div>
        <Link to="/sessions" className="text-blue-600 hover:underline text-sm mt-4 inline-block">← Back to Sessions</Link>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Session Results">
      <div className="max-w-4xl space-y-8">
        <Link to="/sessions" className="text-blue-600 hover:underline text-sm inline-block">← Back to Sessions</Link>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          
          <h1 className="text-2xl font-bold text-gray-900">Behavioural Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Results are grouped by section. Each section has its own set of behavioural factors; the dominant factor in each section is highlighted.
          </p>
        </div>

        {sections.map((section) => {
          const top = section.factors[0]
          return (
            <div key={section.section_id} className="bg-white rounded-xl shadow border border-gray-100 p-6 space-y-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-800">
                  {section.section_code} - {section.section_name}
                </h2>
                {top && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Dominant Factor</p>
                    <p className="text-base font-bold text-slate-800">{top.factor_name}</p>
                    <p className="text-sm font-extrabold text-blue-600">{top.percentage}%</p>
                  </div>
                )}
              </div>

              {section.factors.map((factor, i) => {
                const col = colour(i)
                return (
                  <div key={factor.factor_id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-4">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${col.badge}`}>
                        {factor.factor_name}
                      </span>
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <span className="text-xs text-gray-500">{factor.score} pts</span>
                        <span className="text-sm font-bold text-gray-800 w-12 text-right">{factor.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${col.bar}`}
                        style={{ width: `${factor.percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}