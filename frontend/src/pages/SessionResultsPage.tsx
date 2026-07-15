import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSessionResults, FactorResult } from '../api/sessions'
import { ApiError } from '../api/client'
import AdminLayout from '../components/AdminLayout'

// A colour palette for the factor bars / badges
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

  const [results, setResults] = useState<FactorResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    getSessionResults(sessionId)
      .then(setResults)
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
        <Link to="/sessions" className="text-blue-600 hover:underline text-sm">
          ← Back to Sessions
        </Link>
      </AdminLayout>
    )
  }

  if (results.length === 0) {
    return (
      <AdminLayout title="Session Results">
        <div className="bg-white shadow rounded-lg p-8 text-center text-sm text-gray-500">
          No results available for this session yet. The session may not be submitted, or no questions had factor mappings.
        </div>
        <Link to="/sessions" className="text-blue-600 hover:underline text-sm mt-4 inline-block">
          ← Back to Sessions
        </Link>
      </AdminLayout>
    )
  }

  const grandTotal = results.reduce((sum, r) => sum + r.total_score, 0)
  const topFactor = results[0]

  return (
    <AdminLayout title="Session Results">
      <div className="max-w-4xl space-y-8">
        {/* Breadcrumb */}
        <Link to="/sessions" className="text-blue-600 hover:underline text-sm inline-block">
          ← Back to Sessions
        </Link>

        {/* Header summary card */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Session #{sessionId}</p>
            <h1 className="text-2xl font-bold text-gray-900">Behavioural Profile</h1>
            <p className="text-sm text-gray-500 mt-1">
              Based on <span className="font-medium text-gray-700">{grandTotal}</span> scored responses across {results.length} factor{results.length !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className="flex-shrink-0 text-center bg-slate-50 rounded-xl px-6 py-4 border border-slate-200">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Dominant Factor</p>
            <p className="text-xl font-bold text-slate-800">{topFactor.factor_name}</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1">{topFactor.percentage}%</p>
          </div>
        </div>

        {/* Bar chart card */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-800">Factor Breakdown</h2>
          {results.map((result, i) => {
            const col = colour(i)
            return (
              <div key={result.factor_id} className="space-y-1.5">
                {/* Label row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${col.badge}`}>
                      {result.factor_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-xs text-gray-500">{result.total_score} pts</span>
                    <span className="text-sm font-bold text-gray-800 w-12 text-right">
                      {result.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${col.bar}`}
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Section breakdown per factor */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Section Breakdown</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((result, i) => {
              const col = colour(i)
              return (
                <div key={result.factor_id} className="bg-white rounded-xl shadow border border-gray-100 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.badge}`}>
                      {result.factor_name}
                    </span>
                    <span className="text-lg font-extrabold text-gray-800">{result.percentage}%</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {result.section_breakdown.map((sec) => (
                      <div key={sec.section_id} className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-gray-600">{sec.section_name}</span>
                        <span className="text-xs font-medium text-gray-800">{sec.score} pts</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                    <span className="text-xs font-semibold text-gray-700">Total</span>
                    <span className="text-xs font-bold text-gray-800">{result.total_score} pts</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
